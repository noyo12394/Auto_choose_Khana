import { describe, expect, it } from "vitest";
import { restaurants } from "@khana/fixtures";
import { predictPantryRestock, rankMenuItems, remainingDailyGoal, sumMacros } from "./index.js";

describe("core goal helpers", () => {
  it("ranks menu items by protein per rupee with reasons", () => {
    const picks = rankMenuItems(restaurants[0]!.menu, { dietary: ["high-protein"], budget: 400 }, 2);
    expect(picks).toHaveLength(2);
    expect(picks[0]!.reason).toContain("protein");
    expect(picks[0]!.score).toBeGreaterThan(0);
  });

  it("predicts pantry items running out within 48 hours", () => {
    const now = new Date("2026-05-19T09:00:00Z");
    const result = predictPantryRestock([{ sku_id: "sku-1", typical_days_between_orders: 6, last_ordered_at: "2026-05-14T09:00:00Z" }], now);
    expect(result.items[0]!.daysUntilEmpty).toBe(1);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  it("sums macros and computes remaining daily goal", () => {
    const consumed = sumMacros([{ macros: { calories: 100, proteinG: 20, carbsG: 5, fatG: 2 }, qty: 2 }]);
    expect(consumed.proteinG).toBe(40);
    expect(remainingDailyGoal({ protein_g: 115, calories: 2050 }, consumed)).toEqual({ proteinG: 75, calories: 1850 });
  });
});
