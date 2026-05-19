import { restaurants, type MenuItem } from "@khana/fixtures";

export type SearchRestaurantsArgs = {
  location: string;
  cuisine?: string;
  veg?: boolean;
  max_price?: number;
};

export type PlaceFoodOrderArgs = {
  restaurant_id: string;
  items: { item_id: string; qty: number }[];
  address_id: string;
};

export function searchRestaurants(args: SearchRestaurantsArgs) {
  const location = args.location.toLowerCase();
  const cuisine = args.cuisine?.toLowerCase();
  return restaurants
    .filter((restaurant) => restaurant.location.toLowerCase().includes(location) || location.includes("mumbai"))
    .filter((restaurant) => !cuisine || restaurant.cuisine.some((item) => item.toLowerCase().includes(cuisine)))
    .filter((restaurant) => args.veg === undefined || restaurant.menu.some((item) => item.veg === args.veg))
    .filter((restaurant) => !args.max_price || restaurant.priceForOne <= args.max_price)
    .slice(0, 12)
    .map(({ menu, ...restaurant }) => ({
      ...restaurant,
      top_items: menu.slice(0, 3).map((item) => ({ id: item.id, name: item.name, price: item.price, macros: item.macros }))
    }));
}

export function getMenu(restaurant_id: string) {
  const restaurant = restaurants.find((item) => item.id === restaurant_id);
  if (!restaurant) throw new Error(`Unknown restaurant_id: ${restaurant_id}`);
  return {
    restaurant_id: restaurant.id,
    restaurant_name: restaurant.name,
    eta_mins: restaurant.etaMins,
    items: restaurant.menu
  };
}

export function placeFoodOrder(args: PlaceFoodOrderArgs) {
  const restaurant = restaurants.find((item) => item.id === args.restaurant_id);
  if (!restaurant) throw new Error(`Unknown restaurant_id: ${args.restaurant_id}`);
  const items = args.items.map((line) => {
    const item = restaurant.menu.find((entry) => entry.id === line.item_id);
    if (!item) throw new Error(`Unknown item_id: ${line.item_id}`);
    return { ...item, qty: line.qty };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    order_id: `swg-food-${Date.now()}`,
    eta: `${restaurant.etaMins}-${restaurant.etaMins + 8} min`,
    restaurant_name: restaurant.name,
    address_id: args.address_id,
    items: items.map((item: MenuItem & { qty: number }) => ({ item_id: item.id, name: item.name, qty: item.qty, price: item.price })),
    subtotal,
    confirmation: "Order placed on Swiggy"
  };
}
