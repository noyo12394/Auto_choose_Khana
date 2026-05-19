"use client";

import { Bot, Check, Send, ShoppingBasket, Target, Utensils } from "lucide-react";
import { useState } from "react";
import type { UserContext } from "@khana/db";

type ChatMessage = { role: "assistant" | "user"; text: string };

export function PantryApp({ initialContext, initialPrediction, notification }: { initialContext: UserContext; initialPrediction: { items: { name: string; daysUntilEmpty: number }[]; subtotal: number }; notification: { message?: string } | null }) {
  const [tab, setTab] = useState<"order" | "pantry" | "goals">("order");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Tell me what you need. I’ll pull fresh Swiggy options and show why each pick fits." }
  ]);
  const [input, setInput] = useState("Dinner. High protein. Surprise me.");
  const [toolTrace, setToolTrace] = useState<string[]>([]);
  const [goals, setGoals] = useState({ protein_g: initialContext.goals.protein_g, calories: initialContext.goals.calories, spice: initialContext.profile.spice });

  async function send(message = input) {
    if (!message.trim()) return;
    setMessages((items) => [...items, { role: "user", text: message }]);
    setInput("");
    const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
    const data = (await response.json()) as { message: string; toolCalls: { server: string; name: string; args: unknown }[] };
    setToolTrace(data.toolCalls.map((call) => `${call.server}.${call.name} ${JSON.stringify(call.args)}`));
    setMessages((items) => [...items, { role: "assistant", text: data.message }]);
  }

  async function saveGoals() {
    await fetch("/api/goals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(goals) });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Pantry</h1>
          <p>{initialContext.user.name} · {initialContext.user.location}</p>
        </div>
        <div className="tabs">
          <button className={tab === "order" ? "active" : ""} onClick={() => setTab("order")}><Utensils size={17} /> Order</button>
          <button className={tab === "pantry" ? "active" : ""} onClick={() => setTab("pantry")}><ShoppingBasket size={17} /> Pantry</button>
          <button className={tab === "goals" ? "active" : ""} onClick={() => setTab("goals")}><Target size={17} /> Goals</button>
        </div>
      </header>

      {notification || initialPrediction.items.length ? (
        <button className="banner" onClick={() => send("Restock my pantry")}>
          <ShoppingBasket size={18} /> {notification?.message ?? `Ready to restock? ${initialPrediction.items.length} items running low.`}
        </button>
      ) : null}

      {tab === "order" && (
        <section className="order-grid">
          <div className="chat">
            {messages.map((message, index) => (
              <div key={index} className={`bubble ${message.role}`}>
                {message.role === "assistant" ? <Bot size={18} /> : null}
                <span>{message.text}</span>
              </div>
            ))}
            <div className="composer">
              <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? send() : undefined} />
              <button onClick={() => send()}><Send size={18} /></button>
            </div>
          </div>
          <aside className="trace">
            <h2>Tool calls</h2>
            {toolTrace.length ? toolTrace.map((line) => <code key={line}>{line}</code>) : <p>Fresh MCP calls appear here.</p>}
          </aside>
        </section>
      )}

      {tab === "pantry" && (
        <section className="panel">
          <table>
            <thead><tr><th>SKU</th><th>Last ordered</th><th>Days until empty</th></tr></thead>
            <tbody>
              {initialContext.pantry.map((item) => {
                const prediction = initialPrediction.items.find((entry) => entry.name.includes(item.sku_id));
                const daysSince = Math.round((Date.now() - new Date(item.last_ordered_at).getTime()) / 86400000);
                return <tr key={item.sku_id}><td>{item.sku_id}</td><td>{daysSince} days ago</td><td>{prediction?.daysUntilEmpty ?? Math.max(0, item.typical_days_between_orders - daysSince)}</td></tr>;
              })}
            </tbody>
          </table>
        </section>
      )}

      {tab === "goals" && (
        <section className="panel form">
          <label>Protein goal<input type="number" value={goals.protein_g} onChange={(event) => setGoals({ ...goals, protein_g: Number(event.target.value) })} /></label>
          <label>Calories<input type="number" value={goals.calories} onChange={(event) => setGoals({ ...goals, calories: Number(event.target.value) })} /></label>
          <label>Spice<input value={goals.spice} onChange={(event) => setGoals({ ...goals, spice: event.target.value })} /></label>
          <button onClick={saveGoals}><Check size={18} /> Save</button>
        </section>
      )}
    </main>
  );
}
