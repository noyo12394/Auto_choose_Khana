import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getMenu, placeFoodOrder, searchRestaurants } from "./tools.js";

const server = new McpServer({ name: "khana-food", version: "0.1.0" });

server.tool(
  "search_restaurants",
  "Search Swiggy Food restaurants by location, cuisine, veg preference, and price.",
  {
    location: z.string(),
    cuisine: z.string().optional(),
    veg: z.boolean().optional(),
    max_price: z.number().optional()
  },
  async (args) => ({ content: [{ type: "text", text: JSON.stringify(searchRestaurants(args), null, 2) }] })
);

server.tool(
  "get_menu",
  "Get a fresh menu with item prices and macro data.",
  { restaurant_id: z.string() },
  async ({ restaurant_id }) => ({ content: [{ type: "text", text: JSON.stringify(getMenu(restaurant_id), null, 2) }] })
);

server.tool(
  "place_food_order",
  "Place a Swiggy food order after confirmation or auto-budget approval.",
  {
    restaurant_id: z.string(),
    items: z.array(z.object({ item_id: z.string(), qty: z.number().int().positive() })),
    address_id: z.string()
  },
  async (args) => ({ content: [{ type: "text", text: JSON.stringify(placeFoodOrder(args), null, 2) }] })
);

await server.connect(new StdioServerTransport());
