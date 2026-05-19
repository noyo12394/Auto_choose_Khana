import { skus } from "@khana/fixtures";

const carts = new Map<string, { sku_id: string; qty: number }[]>();
let latestCartId: string | undefined;

export function searchSkus(args: { query: string; category?: string }) {
  const query = args.query.toLowerCase();
  const category = args.category?.toLowerCase();
  return skus
    .filter((sku) => sku.name.toLowerCase().includes(query) || sku.category.toLowerCase().includes(query) || sku.dietary.some((tag) => tag.includes(query)))
    .filter((sku) => !category || sku.category.toLowerCase().includes(category))
    .slice(0, 20);
}

export function getSku(sku_id: string) {
  const sku = skus.find((item) => item.id === sku_id);
  if (!sku) throw new Error(`Unknown sku_id: ${sku_id}`);
  return sku;
}

export function addToCart(args: { sku_id: string; qty: number }) {
  getSku(args.sku_id);
  const cartId = latestCartId ?? `cart-${Date.now()}`;
  const lines = carts.get(cartId) ?? [];
  lines.push({ sku_id: args.sku_id, qty: args.qty });
  carts.set(cartId, lines);
  latestCartId = cartId;
  return { cart_id: cartId };
}

export function viewCart(cart_id: string) {
  const lines = carts.get(cart_id) ?? [];
  const contents = lines.map((line) => {
    const sku = getSku(line.sku_id);
    return { ...sku, qty: line.qty, line_total: sku.price * line.qty };
  });
  return { cart_id, contents, subtotal: contents.reduce((sum, line) => sum + line.line_total, 0) };
}

export function checkoutInstamart(args: { cart_id: string; address_id: string }) {
  const cart = viewCart(args.cart_id);
  return { order_id: `swg-instamart-${Date.now()}`, eta: "18-26 min", address_id: args.address_id, ...cart, confirmation: "Order placed on Swiggy" };
}
