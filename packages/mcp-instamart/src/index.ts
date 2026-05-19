import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addToCart, checkoutInstamart, getSku, searchSkus, viewCart } from "./tools.js";

const server = new McpServer({ name: "khana-instamart", version: "0.1.0" });
server.tool("search_skus", "Search fresh Instamart SKUs.", { query: z.string(), category: z.string().optional() }, async (args) => ({ content: [{ type: "text", text: JSON.stringify(searchSkus(args), null, 2) }] }));
server.tool("get_sku", "Get fresh SKU detail.", { sku_id: z.string() }, async ({ sku_id }) => ({ content: [{ type: "text", text: JSON.stringify(getSku(sku_id), null, 2) }] }));
server.tool("add_to_cart", "Add an Instamart SKU to cart.", { sku_id: z.string(), qty: z.number().int().positive() }, async (args) => ({ content: [{ type: "text", text: JSON.stringify(addToCart(args), null, 2) }] }));
server.tool("view_cart", "View fresh Instamart cart contents.", { cart_id: z.string() }, async ({ cart_id }) => ({ content: [{ type: "text", text: JSON.stringify(viewCart(cart_id), null, 2) }] }));
server.tool("checkout_instamart", "Checkout Instamart cart after confirmation or auto-budget approval.", { cart_id: z.string(), address_id: z.string() }, async (args) => ({ content: [{ type: "text", text: JSON.stringify(checkoutInstamart(args), null, 2) }] }));
await server.connect(new StdioServerTransport());
