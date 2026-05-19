import { dineoutRestaurants } from "@khana/fixtures";

export function searchDineout(args: { location: string; cuisine?: string; party_size?: number; time?: string }) {
  const location = args.location.toLowerCase();
  const cuisine = args.cuisine?.toLowerCase();
  return dineoutRestaurants
    .filter((restaurant) => restaurant.location.toLowerCase().includes(location) || location.includes("mumbai"))
    .filter((restaurant) => !cuisine || restaurant.cuisine.some((item) => item.toLowerCase().includes(cuisine)))
    .filter((restaurant) => !args.time || restaurant.slots.includes(args.time))
    .slice(0, 10)
    .map((restaurant) => ({ ...restaurant, party_size: args.party_size ?? 2 }));
}

export function bookTable(args: { restaurant_id: string; party_size: number; time: string }) {
  const restaurant = dineoutRestaurants.find((item) => item.id === args.restaurant_id);
  if (!restaurant) throw new Error(`Unknown restaurant_id: ${args.restaurant_id}`);
  return { booking_id: `swg-dineout-${Date.now()}`, restaurant_name: restaurant.name, party_size: args.party_size, time: args.time };
}
