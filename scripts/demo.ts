import { runPantryPredictor } from "../packages/cron/src/index.js";
import { closeAgent, chat } from "../packages/agent/src/index.js";

const scenarios = [
  ["Dinner. High protein. Surprise me.", "confirm"],
  ["Restock my pantry", "confirm"],
  ["I need more protein this week."]
];

for (const [index, messages] of scenarios.entries()) {
  console.log(`\nScenario ${index + 1}`);
  if (index === 1) runPantryPredictor();
  for (const message of messages) {
    console.log(`> ${message}`);
    const result = await chat(1, message);
    for (const call of result.toolCalls) console.log(`[tool:${call.server}.${call.name}]`);
    console.log(result.message);
  }
}

await closeAgent();
