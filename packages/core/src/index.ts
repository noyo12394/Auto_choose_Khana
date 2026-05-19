import { skus, type Macro, type MenuItem, type Sku } from "../../../fixtures/index.js";

export type RankedPick<T> = T & { score: number; reason: string };
export type GoalInput = {
  dietary: string[];
  cuisines?: string[];
  budget?: number;
  proteinTargetG?: number;
};

function matchesDiet(item: { veg?: boolean; dietary?: string[] }, dietary: string[]) {
  if (dietary.includes("veg") && item.veg === false) return false;
  if (dietary.includes("vegan") && !item.dietary?.includes("vegan")) return false;
  return true;
}

export function rankMenuItems(items: MenuItem[], goals: GoalInput, topN = 3): RankedPick<MenuItem>[] {
  return items
    .filter((item) => matchesDiet(item, goals.dietary))
    .filter((item) => !goals.budget || item.price <= goals.budget)
    .map((item) => {
      const score = item.macros.proteinG / item.price;
      return {
        ...item,
        score,
        reason: `${item.macros.proteinG}g protein, ₹${item.price}, ${item.dietary.includes("high-protein") ? "high-protein" : "fits"} goal match`
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function rankSkus(items: Sku[], goals: GoalInput, topN = 8): RankedPick<Sku>[] {
  return items
    .filter((item) => matchesDiet(item, goals.dietary.includes("veg") ? ["veg"] : []))
    .map((item) => {
      const score = item.macros.proteinG / item.price;
      return { ...item, score, reason: `${item.macros.proteinG}g protein per serving for ₹${item.price}; strong protein-per-rupee pick` };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export type PantryEntry = { sku_id: string; typical_days_between_orders: number; last_ordered_at: string };
export function predictPantryRestock(pantry: PantryEntry[], now = new Date()) {
  const low = pantry
    .map((entry) => {
      const sku = skus.find((item) => item.id === entry.sku_id);
      const elapsedMs = now.getTime() - new Date(entry.last_ordered_at).getTime();
      const daysSince = elapsedMs / 86_400_000;
      const daysUntilEmpty = Math.ceil(entry.typical_days_between_orders - daysSince);
      return sku ? { ...entry, sku, daysUntilEmpty } : undefined;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => entry.daysUntilEmpty <= 2)
    .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);
  const items = low.map((entry) => ({ sku_id: entry.sku.id, name: entry.sku.name, qty: 1, price: entry.sku.price, daysUntilEmpty: entry.daysUntilEmpty }));
  return { items, subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0) };
}

export function sumMacros(lines: { macros: Macro; qty?: number }[]): Macro {
  return lines.reduce(
    (sum, line) => ({
      calories: sum.calories + line.macros.calories * (line.qty ?? 1),
      proteinG: sum.proteinG + line.macros.proteinG * (line.qty ?? 1),
      carbsG: sum.carbsG + line.macros.carbsG * (line.qty ?? 1),
      fatG: sum.fatG + line.macros.fatG * (line.qty ?? 1)
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

export function remainingDailyGoal(goal: { protein_g: number; calories: number }, consumed: Pick<Macro, "proteinG" | "calories">) {
  return {
    proteinG: Math.max(0, goal.protein_g - consumed.proteinG),
    calories: Math.max(0, goal.calories - consumed.calories)
  };
}
