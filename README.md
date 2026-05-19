# Pantry for Swiggy Builders Club

Pantry is a warm, goal-aware food and grocery assistant for Mumbai users. It connects to local MCP stubs that model Swiggy Food, Instamart, and Dineout, then ranks fresh tool results against a user's profile, pantry cadence, and nutrition goals.

## What we're building

**Dinner autopilot.** Pantry turns requests like "Dinner. High protein. Surprise me." into fresh Swiggy Food searches, menu reads, ranked options, and a confirmed order flow that always attributes the transaction to Swiggy.

**Pantry restock predictor.** A daily 9 AM job looks at tracked grocery cadence and proposes an Instamart cart when staples are likely to run out in the next 48 hours.

**Goal-aware grocery discovery.** When Aanya says she needs more protein this week, Pantry searches Instamart SKUs and re-ranks by protein-per-rupee with concise reasons for every recommendation.

## How it works

```text
CLI / Next.js UI
      |
      v
packages/agent chat(userId, message)
      |
      +--> SQLite profile, goals, pantry, orders
      |
      +--> MCP stdio clients
             |-- food: search_restaurants, get_menu, place_food_order
             |-- instamart: search_skus, get_sku, add_to_cart, view_cart, checkout_instamart
             |-- dineout: search_dineout, book_table
      |
      v
core ranking, macro math, pantry predictor
```

Data flow: each turn loads profile, pantry, goals, and today's macro total; the agent calls MCP tools; core helpers rank or sum results; every tool call is written to the `orders` audit table.

## Auth plan

OAuth redirect URI placeholder: `https://YOUR_HOST/api/auth/swiggy/callback`

Static gateway IP placeholder: `YOUR_STATIC_EGRESS_IP`

Anthropic runs server-side only through `ANTHROPIC_API_KEY`; no browser bundle receives API keys.

## Data handling

Stored data: user profile, dietary preferences, cuisine preferences, goals, pantry cadence, notifications, and order/tool-call log.

Storage location: SQLite on our host, defaulting to `./data/pantry.sqlite`.

Retention: indefinite until the user deletes their account.

Deletion path: `DELETE /api/me` wipes the user row and cascades profile, pantry, goals, and order history.

## Security contact

Security contact placeholder: `security@example.com`

## Ground rules compliance

- Brand attribution: order confirmations always say "Order placed on Swiggy."
- No stale prices: display flows use MCP tool results rather than scraped pages or hard-coded UI prices.
- Explained re-ranking: every ranked menu item or SKU includes a "Picked this because" reason.
- Governed transaction data: all tool calls and placed orders are logged in SQLite for audit.
- OAuth auth: README includes redirect URI and gateway IP placeholders for the hosted Swiggy integration.
- Rate-limit backoff: MCP tool calls are wrapped with exponential backoff for 429/rate-limit errors.

## Demo

90-second video placeholder: `https://loom.com/share/YOUR_VIDEO`

Screenshots placeholder:

- `docs/screenshots/order.png`
- `docs/screenshots/pantry.png`
- `docs/screenshots/goals.png`

## Roadmap

Week 1: complete MCP stubs, CLI demo, and submission UI.

Week 2: replace stubs with Swiggy OAuth sandbox credentials and hosted gateway.

Week 3: add richer pantry learning from real Instamart order history.

Week 4: run closed alpha with five Mumbai users and tune ranking weights.

Week 5: add Dineout reservation flows, dietary safety checks, and budget guardrails.

Week 6: closed beta with deletion/export controls, monitoring, and rate-limit dashboards.

## Local development

```bash
pnpm install
pnpm seed
pnpm cli
pnpm demo
pnpm dev
```
