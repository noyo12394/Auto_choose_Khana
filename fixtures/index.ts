export type Macro = { calories: number; proteinG: number; carbsG: number; fatG: number };
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  veg: boolean;
  dietary: string[];
  macros: Macro;
};
export type Restaurant = {
  id: string;
  name: string;
  location: string;
  cuisine: string[];
  veg: boolean;
  priceForOne: number;
  rating: number;
  etaMins: number;
  menu: MenuItem[];
};
export type Sku = {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  serving: string;
  macros: Macro;
  dietary: string[];
};

const areas = ["Bandra", "Andheri", "Powai", "Dadar", "Chembur", "Lower Parel"];
const cuisines = ["South Indian", "Maharashtrian", "North Indian", "Coastal", "Healthy", "Gujarati", "Biryani", "Cafe"];
const restaurantNames = [
  "Matunga Millet Tiffins",
  "Bandra Protein Bowl Co",
  "Powai Pepper Fry",
  "Dadar Darshini",
  "Konkan Catch Kitchen",
  "Andheri Andhra Meals",
  "Chembur Chaat House",
  "Lower Parel Lean Plates",
  "Mahim Malvani Mess",
  "Juhu Jain Bhojanalay",
  "Sion Sambar Studio",
  "Worli Wok & Curry",
  "Ghatkopar Gujarati Thali",
  "Colaba Coastal Cafe",
  "Byculla Biryani Bar",
  "Kurla Kebab Room",
  "Vile Parle Veg Works",
  "Khar Khichdi Club",
  "Parel Paneer Point",
  "Santacruz Salad Stop",
  "Mulund Misal House",
  "Borivali Bowl Bar",
  "Marine Lines Meals",
  "Fort Filter Coffee",
  "Tardeo Tandoor",
  "Versova Vegan Cart",
  "Mahalaxmi Macro Meals",
  "BKC Bento & Bhaji",
  "Prabhadevi Protein Dosa",
  "Thane Thali Trail"
];

const menuTemplates: Omit<MenuItem, "id">[] = [
  { name: "Paneer millet dosa with sambar", price: 220, veg: true, dietary: ["veg"], macros: { calories: 540, proteinG: 31, carbsG: 58, fatG: 20 } },
  { name: "Chicken sukka brown rice bowl", price: 320, veg: false, dietary: ["high-protein"], macros: { calories: 610, proteinG: 42, carbsG: 55, fatG: 22 } },
  { name: "Sprouts misal with curd", price: 180, veg: true, dietary: ["veg", "high-protein"], macros: { calories: 430, proteinG: 24, carbsG: 52, fatG: 13 } },
  { name: "Egg bhurji pav with salad", price: 190, veg: false, dietary: ["high-protein"], macros: { calories: 520, proteinG: 28, carbsG: 42, fatG: 24 } },
  { name: "Tofu kothu parotta bowl", price: 260, veg: true, dietary: ["veg", "vegan"], macros: { calories: 590, proteinG: 29, carbsG: 66, fatG: 21 } },
  { name: "Fish curry quinoa plate", price: 380, veg: false, dietary: ["high-protein"], macros: { calories: 560, proteinG: 39, carbsG: 47, fatG: 19 } }
];

export const restaurants: Restaurant[] = restaurantNames.map((name, index) => {
  const cuisine = [cuisines[index % cuisines.length]!, cuisines[(index + 4) % cuisines.length]!];
  const menu = menuTemplates.map((item, itemIndex) => ({
    ...item,
    id: `m-${index + 1}-${itemIndex + 1}`,
    price: item.price + (index % 4) * 15,
    name: item.name
  }));
  return {
    id: `r-${index + 1}`,
    name,
    location: areas[index % areas.length]!,
    cuisine,
    veg: menu.every((item) => item.veg),
    priceForOne: 190 + (index % 7) * 35,
    rating: Number((4.1 + (index % 8) / 10).toFixed(1)),
    etaMins: 22 + (index % 6) * 5,
    menu
  };
});

const skuBases = [
  ["Amul High Protein Paneer", "Dairy", 125, "200 g", { calories: 296, proteinG: 38, carbsG: 8, fatG: 12 }, ["veg", "high-protein"]],
  ["Greek Yogurt Cup", "Dairy", 75, "100 g", { calories: 90, proteinG: 11, carbsG: 5, fatG: 3 }, ["veg", "high-protein"]],
  ["Moong Dal", "Dal & Pulses", 140, "1 kg", { calories: 347, proteinG: 24, carbsG: 63, fatG: 1 }, ["veg", "vegan"]],
  ["Soya Chunks", "Protein", 65, "200 g", { calories: 336, proteinG: 52, carbsG: 33, fatG: 1 }, ["veg", "vegan", "high-protein"]],
  ["Brown Rice", "Staples", 155, "1 kg", { calories: 360, proteinG: 8, carbsG: 77, fatG: 3 }, ["veg", "vegan"]],
  ["Eggs", "Protein", 90, "6 pcs", { calories: 70, proteinG: 6, carbsG: 1, fatG: 5 }, ["high-protein"]],
  ["Chicken Breast", "Meat", 260, "500 g", { calories: 165, proteinG: 31, carbsG: 0, fatG: 4 }, ["high-protein"]],
  ["Toned Milk", "Dairy", 74, "1 L", { calories: 61, proteinG: 3, carbsG: 5, fatG: 3 }, ["veg"]],
  ["Rolled Oats", "Breakfast", 210, "1 kg", { calories: 389, proteinG: 17, carbsG: 66, fatG: 7 }, ["veg", "vegan"]],
  ["Peanut Butter", "Spreads", 180, "340 g", { calories: 190, proteinG: 8, carbsG: 7, fatG: 16 }, ["veg", "vegan"]],
  ["Bananas", "Fruit", 55, "6 pcs", { calories: 105, proteinG: 1, carbsG: 27, fatG: 0 }, ["veg", "vegan"]],
  ["Spinach Bunch", "Vegetables", 30, "250 g", { calories: 23, proteinG: 3, carbsG: 4, fatG: 0 }, ["veg", "vegan"]],
  ["Besan", "Staples", 95, "500 g", { calories: 387, proteinG: 22, carbsG: 58, fatG: 7 }, ["veg", "vegan"]],
  ["Tuna Chunks", "Meat", 190, "185 g", { calories: 132, proteinG: 28, carbsG: 0, fatG: 1 }, ["high-protein"]],
  ["Protein Lassi", "Beverages", 85, "200 ml", { calories: 130, proteinG: 15, carbsG: 13, fatG: 2 }, ["veg", "high-protein"]]
] as const;

const localFlavours = ["Bandra", "Matunga", "Dadar", "Powai", "Juhu", "Chembur", "BKC", "Andheri", "Worli", "Colaba"];
export const skus: Sku[] = Array.from({ length: 150 }, (_, index) => {
  const base = skuBases[index % skuBases.length]!;
  const flavour = localFlavours[index % localFlavours.length]!;
  const variant = Math.floor(index / skuBases.length) + 1;
  return {
    id: `sku-${index + 1}`,
    name: `${flavour} ${base[0]} ${variant}`,
    category: base[1],
    price: base[2] + (variant - 1) * 7 + (index % 3) * 3,
    weight: base[3],
    serving: "per serving",
    macros: base[4],
    dietary: [...base[5]]
  };
});

export const dineoutRestaurants = restaurants.slice(0, 24).map((restaurant, index) => ({
  id: restaurant.id,
  name: restaurant.name,
  location: restaurant.location,
  cuisine: restaurant.cuisine,
  rating: restaurant.rating,
  priceForTwo: restaurant.priceForOne * 2 + 250,
  slots: ["19:00", "19:30", "20:00", "20:30", "21:00"].slice(index % 3)
}));
