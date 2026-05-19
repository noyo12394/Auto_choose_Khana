import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import { chat, closeAgent, listMcpTools } from "../../../packages/agent/src/index.js";

const tools = await listMcpTools();
console.log(chalk.dim(`Connected MCP tools: ${Object.values(tools).flat().map((tool) => tool.name).join(", ")}`));
console.log("Pantry CLI ready for Aanya. Try: Dinner. High protein. Surprise me.");

const rl = readline.createInterface({ input, output, prompt: chalk.bold("> ") });
rl.prompt();
for await (const line of rl) {
  if (["exit", "quit"].includes(line.trim().toLowerCase())) break;
  const result = await chat(1, line);
  for (const call of result.toolCalls) {
    console.log(chalk.dim(`[tool:${call.server}.${call.name}] ${JSON.stringify(call.args)}`));
  }
  console.log(result.message);
  rl.prompt();
}
rl.close();
await closeAgent();
