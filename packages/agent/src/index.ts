import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getUserContext, logToolCall } from "../../db/src/index.js";
import { predictPantryRestock, rankMenuItems, rankSkus, remainingDailyGoal, sumMacros } from "../../core/src/index.js";
import { skus, type MenuItem } from "../../../fixtures/index.js";

type ServerName = "food" | "instamart" | "dineout";
type ToolCall = { server: ServerName; name: string; args: unknown; result: unknown };
type PendingFoodOrder = { restaurant_id: string; item_id: string; address_id: string; item_name: string; price: number };

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const pendingFoodOrders = new Map<number, PendingFoodOrder>();

const systemPrompt = `You are Pantry, a warm, concise Swiggy food and grocery assistant. Never patronize. Show brief reasoning. Confirm before placing orders unless within the user's auto-order budget. Order confirmations must say "Order placed on Swiggy". Never scrape. Never expose API keys.`;

class McpHub {
  private clients = new Map<ServerName, Client>();
  private ready = false;
  tools: Record<ServerName, Tool[]> = { food: [], instamart: [], dineout: [] };

  async connect() {
    if (this.ready) return;
    for (const server of ["food", "instamart", "dineout"] as const) {
      const client = new Client({ name: `pantry-agent-${server}`, version: "0.1.0" });
      const transport = new StdioClientTransport({
        command: "pnpm",
        args: ["--filter", `@khana/mcp-${server}`, "dev"],
        cwd: repoRoot
      });
      await client.connect(transport);
      this.clients.set(server, client);
      this.tools[server] = (await client.listTools()).tools;
    }
    this.ready = true;
  }

  async call(userId: number, server: ServerName, name: string, args: Record<string, unknown>): Promise<unknown> {
    await this.connect();
    const client = this.clients.get(server);
    if (!client) throw new Error(`MCP server not connected: ${server}`);
    const result = await withBackoff(() => client.callTool({ name, arguments: args }));
    const parsed = parseToolResult(result);
    logToolCall(userId, server, { tool: name, args, result: parsed });
    return parsed;
  }

  async close() {
    await Promise.all([...this.clients.values()].map((client) => client.close()));
    this.clients.clear();
    this.ready = false;
  }
}

const hub = new McpHub();

async function withBackoff<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let delay = 200;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/rate|429/i.test(message) || attempt === attempts) throw error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
      delay *= 2;
    }
  }
  throw new Error("Unreachable backoff state");
}

function parseToolResult(result: unknown) {
  const content = (result as { content?: { type: string; text?: string }[] }).content ?? [];
  const text = content.find((part) => part.type === "text")?.text;
  if (!text) return result;
  return JSON.parse(text) as unknown;
}

export async function listMcpTools() {
  await hub.connect();
  return hub.tools;
}

export async function closeAgent() {
  await hub.close();
}

export function anthropicToolSchemas() {
  return Object.entries(hub.tools).flatMap(([server, tools]) =>
    tools.map((tool) => ({ name: `${server}_${tool.name}`, description: tool.description ?? "", input_schema: tool.inputSchema }))
  );
}

export async function chat(userId: number, message: string): Promise<{ message: string; toolCalls: ToolCall[] }> {
  await hub.connect();
  const context = getUserContext(userId);
  const toolCalls: ToolCall[] = [];
  const normalized = message.toLowerCase();

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    void anthropic;
  }

  if (/\b(confirm|order|yes|place it)\b/i.test(message) && pendingFoodOrders.has(userId)) {
    const pending = pendingFoodOrders.get(userId)!;
    const args = { restaurant_id: pending.restaurant_id, items: [{ item_id: pending.item_id, qty: 1 }], address_id: pending.address_id };
    const result = await hub.call(userId, "food", "place_food_order", args);
    toolCalls.push({ server: "food", name: "place_food_order", args, result });
    const macros = extractFoodMacros(result);
    logToolCall(userId, "food", { order: result, macros }, "placed");
    pendingFoodOrders.delete(userId);
    return { message: `Order placed on Swiggy. ${pending.item_name} is on its way. ETA: ${(result as { eta?: string }).eta ?? "fresh from Swiggy"}.`, toolCalls };
  }

  if (normalized.includes("pantry") || normalized.includes("restock")) {
    const proposal = predictPantryRestock(context.pantry);
    const ranked = rankSkus(skus, { dietary: context.profile.dietary }, 5);
    return {
      message: proposal.items.length
        ? `Ready to restock? ${proposal.items.length} items running low. Proposed cart is ₹${proposal.subtotal}. Picked this because: ${proposal.items.map((item) => item.name).join(", ")} are likely empty within 48h.`
        : `Your tracked pantry looks steady for the next 48h. For more protein this week, try ${ranked[0]!.name}: ${ranked[0]!.reason}.`,
      toolCalls
    };
  }

  const maxPrice = normalized.includes("lunch") ? context.profile.budget_lunch : context.profile.budget_dinner;
  const searchArgs = { location: "Mumbai", cuisine: context.profile.cuisines[0], max_price: maxPrice };
  const restaurants = (await hub.call(userId, "food", "search_restaurants", searchArgs)) as { id: string; name: string }[];
  toolCalls.push({ server: "food", name: "search_restaurants", args: searchArgs, result: restaurants });

  const menus = [];
  for (const restaurant of restaurants.slice(0, 4)) {
    const args = { restaurant_id: restaurant.id };
    const result = (await hub.call(userId, "food", "get_menu", args)) as { restaurant_id: string; restaurant_name: string; items: MenuItem[] };
    toolCalls.push({ server: "food", name: "get_menu", args, result });
    menus.push(result);
  }
  const ranked = menus.flatMap((menu) =>
    rankMenuItems(menu.items, { dietary: context.profile.dietary, budget: maxPrice }, 3).map((item) => ({
      ...item,
      restaurant_id: menu.restaurant_id,
      restaurant_name: menu.restaurant_name
    }))
  ).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!ranked[0]) return { message: "I could not find a fresh match from Swiggy for that budget. Want me to widen cuisine or price?", toolCalls };

  const remaining = remainingDailyGoal(context.goals, context.todayMacros);
  const first = ranked[0];
  pendingFoodOrders.set(userId, { restaurant_id: first.restaurant_id, item_id: first.id, address_id: "addr-aanya-home", item_name: first.name, price: first.price });
  const options = ranked.map((item, index) => `${index + 1}. ${item.name} from ${item.restaurant_name} - ₹${item.price}. Picked this because: ${item.reason}`).join("\n");
  const autoNote = first.price <= context.profile.auto_order_budget ? `This is within your ₹${context.profile.auto_order_budget} auto-order budget, but I’ll still wait for your go-ahead in the demo loop.` : "Say confirm and I’ll place it.";
  return {
    message: `I found 3 dinner options. You have ${remaining.proteinG}g protein left today.\n${options}\n${autoNote}`,
    toolCalls
  };
}

function extractFoodMacros(result: unknown) {
  const order = result as { items?: { item_id: string; qty: number }[]; restaurant_name?: string };
  if (!order.items) return undefined;
  return sumMacros([]);
}

export { systemPrompt };
