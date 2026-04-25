import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001/api";

const PLANS = {
  "15min": { label: "15 min", price: 5, desc: "Quick burst" },
  "30min": { label: "30 min", price: 10, desc: "Most popular" },
  "1hr":   { label: "1 hour", price: 18, desc: "Deep work" },
};

const S = {
  app: {
    minHeight: "100vh",
    background: "#0a0a08",
    color: "#e8e8e0",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1rem",
  },
  card: {
    background: "#111110",
    border: "1px solid #2a2a26",
    borderRadius: 6,
    padding: "2rem",
    width: "100%",
    maxWidth: 480,
    marginBottom: "1.5rem",
  },
  label: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#c8f045",
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    marginBottom: 12,
  },
  h1: { fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 6 },
  muted: { color: "#6b6b60", fontSize: 13, lineHeight: 1.6 },
  input: {
    width: "100%",
    background: "#181816",
    border: "1px solid #2a2a26",
    borderRadius: 4,
    padding: "0.7rem 1rem",
    color: "#e8e8e0",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
    marginBottom: 10,
    boxSizing: "border-box",
  },
  btn: {
    background: "#c8f045",
    color: "#0a0a08",
    border: "none",
    borderRadius: 3,
    padding: "0.75rem 1.5rem",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    marginTop: 6,
  },
  btnGhost: {
    background: "transparent",
    color: "#e8e8e0",
    border: "1px solid #2a2a26",
    borderRadius: 3,
    padding: "0.6rem 1.2rem",
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  planCard: (selected) => ({
    border: `1px solid ${selected ? "#c8f045" : "#2a2a26"}`,
    borderRadius: 4,
    padding: "1rem",
    cursor: "pointer",
    background: selected ? "rgba(200,240,69,0.05)" : "#181816",
    flex: 1,
    transition: "all 0.15s",
  }),
};

function Timer({ endsAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return (
    <div style={{ textAlign: "center", marginBottom: 16 }}>
      <div style={{ fontFamily: "monospace", fontSize: 36, fontWeight: 700, color: left < 60 ? "#ff6b35" : "#c8f045", letterSpacing: 2 }}>
        {m}:{s}
      </div>
      <div style={{ height: 4, background: "#2a2a26", borderRadius: 2, marginTop: 8 }}>
        <div style={{ height: "100%", width: `${(left / 3600) * 100}%`, background: left < 60 ? "#ff6b35" : "#c8f045", borderRadius: 2, transition: "width 1s linear" }} />
      </div>
      <div style={{ color: "#6b6b60", fontSize: 11, marginTop: 6 }}>Session time remaining</div>
    </div>
  );
}

function Message({ role, content }) {
  return (
    <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{
        fontFamily: "monospace", fontSize: 11, padding: "3px 7px",
        borderRadius: 2, flexShrink: 0, marginTop: 2,
        background: role === "user" ? "rgba(200,240,69,0.1)" : "rgba(107,107,96,0.15)",
        color: role === "user" ? "#c8f045" : "#6b6b60",
        border: `1px solid ${role === "user" ? "rgba(200,240,69,0.3)" : "#2a2a26"}`,
      }}>
        {role === "user" ? "YOU" : "AI"}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: role === "user" ? "#e8e8e0" : "#c8c8b8", flex: 1, whiteSpace: "pre-wrap" }}>
        {content}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [topupAmt, setTopupAmt] = useState("50");
  const [selectedPlan, setSelectedPlan] = useState("30min");
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const bottomRef = useRef(null);

  // Auto-login if saved
  useEffect(() => {
    const savedId = localStorage.getItem("nc_userId");
    const savedEmail = localStorage.getItem("nc_email");
    if (savedId && savedEmail) {
      setUserId(savedId);
      setUserEmail(savedEmail);
      // Refresh balance
      fetch(`${API}/wallet/${savedId}`)
        .then(r => r.json())
        .then(d => { setBalance(d.balance); setScreen("wallet"); });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (Date.now() > session.endsAt) {
        setStatus("⏰ Session expired.");
        setSession(null);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [session]);

  async function handleLogin() {
    if (!email || !email.includes("@")) return setStatus("Enter a valid email");
    setLoading(true);
    setStatus("");
    const res = await fetch(`${API}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(r => r.json());

    if (res.error) { setStatus("❌ " + res.error); setLoading(false); return; }

    setUserId(res.userId);
    setUserEmail(res.email);
    setBalance(res.balance);
    localStorage.setItem("nc_userId", res.userId);
    localStorage.setItem("nc_email", res.email);
    setLoading(false);
    setScreen("wallet");
  }

  async function handleTopup() {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) return setStatus("Enter a valid amount");
    setLoading(true);
    const res = await fetch(`${API}/wallet/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: amt }),
    }).then(r => r.json());
    setBalance(res.balance);
    setStatus(`✓ Balance: ₹${res.balance}`);
    setLoading(false);
    setTimeout(() => { setStatus(""); setScreen("plans"); }, 800);
  }

  async function handleStartSession() {
    setLoading(true);
    setStatus("");
    const res = await fetch(`${API}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan: selectedPlan }),
    }).then(r => r.json());

    if (res.error) { setStatus("❌ " + res.error); setLoading(false); return; }

    setBalance(res.balance);
    setSession({ sessionId: res.sessionId, endsAt: res.endsAt });
    setMessages([{ role: "assistant", content: `Session started! You have ${PLANS[selectedPlan].label} with the AI. How can I help you?` }]);
    setScreen("chat");
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || loading || !session) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.sessionId, message: userMsg }),
    }).then(r => r.json());

    if (res.error) {
      setMessages(m => [...m, { role: "assistant", content: `⚠️ ${res.error}` }]);
      if (res.error.includes("expired") || res.error.includes("Token")) setSession(null);
    } else {
      setMessages(m => [...m, { role: "assistant", content: res.reply }]);
      setTokenInfo({ used: res.tokensUsed, max: res.maxTokens });
    }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("nc_userId");
    localStorage.removeItem("nc_email");
    setUserId(null); setUserEmail(""); setBalance(0);
    setSession(null); setMessages([]);
    setScreen("login");
  }

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={S.app}>
      <div style={S.card}>
        <div style={S.label}>// NeuralCafe</div>
        <div style={S.h1}>Welcome back.</div>
        <div style={{ ...S.muted, marginBottom: 20 }}>Enter your email to access your wallet. New users are created automatically.</div>
        <input style={S.input} type="email" placeholder="you@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button style={S.btn} onClick={handleLogin} disabled={loading}>
          {loading ? "Loading..." : "Continue →"}
        </button>
        {status && <div style={{ marginTop: 12, fontSize: 13, color: "#ff6b35", fontFamily: "monospace" }}>{status}</div>}
      </div>
    </div>
  );

  // ── WALLET ──
  if (screen === "wallet") return (
    <div style={S.app}>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.label}>// Wallet · {userEmail}</div>
          <button style={{ ...S.btnGhost, fontSize: 11, padding: "4px 10px" }} onClick={handleLogout}>Logout</button>
        </div>
        <div style={S.h1}>Top Up Wallet</div>
        <div style={{ ...S.muted, marginBottom: 20 }}>
          Current balance: <span style={{ color: "#c8f045" }}>₹{balance}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[20, 50, 100, 200].map(amt => (
            <button key={amt} onClick={() => setTopupAmt(String(amt))}
              style={{ ...S.btnGhost, flex: 1, borderColor: topupAmt === String(amt) ? "#c8f045" : "#2a2a26", color: topupAmt === String(amt) ? "#c8f045" : "#e8e8e0" }}>
              ₹{amt}
            </button>
          ))}
        </div>
        <input style={S.input} type="number" placeholder="Custom amount"
          value={topupAmt} onChange={e => setTopupAmt(e.target.value)} />
        <button style={S.btn} onClick={handleTopup} disabled={loading}>
          {loading ? "Processing..." : `Add ₹${topupAmt || "?"} →`}
        </button>
        {balance > 0 && (
          <button style={{ ...S.btnGhost, width: "100%", marginTop: 10 }} onClick={() => setScreen("plans")}>
            Skip → Start Session
          </button>
        )}
        {status && <div style={{ marginTop: 12, fontSize: 13, color: "#c8f045", fontFamily: "monospace" }}>{status}</div>}
        <div style={{ ...S.muted, marginTop: 16, fontSize: 11, textAlign: "center" }}>🔒 MVP demo — no real payment processed</div>
      </div>
    </div>
  );

  // ── PLANS ──
  if (screen === "plans") return (
    <div style={S.app}>
      <div style={S.card}>
        <div style={S.label}>// Choose Session · {userEmail}</div>
        <div style={S.h1}>Pick a Plan</div>
        <div style={{ ...S.muted, marginBottom: 20 }}>Balance: <span style={{ color: "#c8f045" }}>₹{balance}</span></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} style={S.planCard(selectedPlan === key)} onClick={() => setSelectedPlan(key)}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{plan.label}</div>
              <div style={{ color: "#c8f045", fontFamily: "monospace", fontSize: 20, fontWeight: 700, margin: "4px 0" }}>₹{plan.price}</div>
              <div style={{ ...S.muted, fontSize: 11 }}>{plan.desc}</div>
            </div>
          ))}
        </div>
        <button style={S.btn} onClick={handleStartSession} disabled={loading || balance < PLANS[selectedPlan].price}>
          {loading ? "Starting..." : balance < PLANS[selectedPlan].price ? `Need ₹${PLANS[selectedPlan].price - balance} more` : `Start ${PLANS[selectedPlan].label} →`}
        </button>
        <button style={{ ...S.btnGhost, width: "100%", marginTop: 10 }} onClick={() => setScreen("wallet")}>← Top up more</button>
        {status && <div style={{ marginTop: 12, fontSize: 13, color: "#ff6b35", fontFamily: "monospace" }}>{status}</div>}
      </div>
    </div>
  );

  // ── CHAT ──
  return (
    <div style={{ ...S.app, padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 700, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={S.label}>// NeuralCafe · {userEmail}</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6b6b60" }}>
            ₹{balance} remaining · {tokenInfo ? `${tokenInfo.used}/${tokenInfo.max} tokens` : "Session active"}
          </div>
        </div>
        <button style={S.btnGhost} onClick={() => { setSession(null); setScreen("plans"); }}>End Session</button>
      </div>

      {session && (
        <div style={{ width: "100%", maxWidth: 700, ...S.card, padding: "1rem 1.5rem", marginBottom: 12 }}>
          <Timer endsAt={session.endsAt} />
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 700, ...S.card, flex: 1, minHeight: 300, maxHeight: "50vh", overflowY: "auto", marginBottom: 12 }}>
        {messages.map((m, i) => <Message key={i} {...m} />)}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, padding: "3px 7px", borderRadius: 2, background: "rgba(107,107,96,0.15)", color: "#6b6b60", border: "1px solid #2a2a26" }}>AI</div>
            <div style={{ ...S.muted, fontSize: 13 }}>Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ width: "100%", maxWidth: 700, display: "flex", gap: 10 }}>
        <input style={{ ...S.input, flex: 1, marginBottom: 0 }}
          placeholder={session ? "Ask anything..." : "Session ended"}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={!session || loading} />
        <button style={{ ...S.btn, width: "auto", marginTop: 0, padding: "0 1.5rem" }}
          onClick={handleSend} disabled={!session || loading || !input.trim()}>Send</button>
      </div>
      {status && <div style={{ marginTop: 10, fontSize: 13, color: "#ff6b35", fontFamily: "monospace" }}>{status}</div>}
    </div>
  );
}