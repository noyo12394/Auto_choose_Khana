import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { bookTable, searchDineout } from "./tools.js";

const server = new McpServer({ name: "khana-dineout", version: "0.1.0" });
server.tool("search_dineout", "Search Dineout restaurants and live slots.", { location: z.string(), cuisine: z.string().optional(), party_size: z.number().int().positive().optional(), time: z.string().optional() }, async (args) => ({ content: [{ type: "text", text: JSON.stringify(searchDineout(args), null, 2) }] }));
server.tool("book_table", "Book a table after confirmation.", { restaurant_id: z.string(), party_size: z.number().int().positive(), time: z.string() }, async (args) => ({ content: [{ type: "text", text: JSON.stringify(bookTable(args), null, 2) }] }));
await server.connect(new StdioServerTransport());
