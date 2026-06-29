import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Minimal chat client. Talks to the `MyAgent` Durable Object instance named
 * "main" over the agents WebSocket protocol. You shouldn't need to touch this
 * during the workshop — all the interesting work happens in src/server.ts.
 */
export function App() {
  const agent = useAgent({ agent: "MyAgent", name: "main" });
  const { messages, sendMessage, status } = useAgentChat({ agent });

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const busy = status === "streaming" || status === "submitted";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="container">
      <h1>Build a THINK Agent</h1>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="empty">Say hello to your agent…</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="role">{msg.role}</div>
            {msg.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Send a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "…" : "Send"}
        </button>
      </form>

      <div className="status">
        {status === "streaming" && "thinking…"}
        {status === "submitted" && "sending…"}
        {status === "error" && "something went wrong — try again"}
      </div>
    </div>
  );
}
