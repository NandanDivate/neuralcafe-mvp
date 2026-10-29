import { useState, useEffect, useRef } from "react";
import { signInWithGoogle, logOut, auth, getRedirectUser, onAuthStateChanged } from "./firebase";
import MarkdownMessage from "./MarkdownMessage";

const API = import.meta.env.VITE_API_URL || "https://neuralcafe-mvp.onrender.com/api";

const PLANS = {
  "15min": { label: "15 Minutes", price: 5, tokens: "20,000", desc: "Quick burst · Rapid queries & debugging" },
  "30min": { label: "30 Minutes", price: 10, tokens: "40,000", desc: "Standard session · Deep research & code drafting (Popular)" },
  "1hr":   { label: "1 Hour", price: 18, tokens: "80,000", desc: "Extended focus · Multi-step architecture & heavy tasks" },
};

const MODELS = [
  { id: "gpt-oss", name: "GPT-OSS 120B", badge: "Smart Reasoning", desc: "120B Parameters · Deep logic, architecture & coding", provider: "Groq LPU" },
  { id: "qwen", name: "Qwen 3.8 27B", badge: "Ultra Fast", desc: "27B Parameters · Instant low-latency responses", provider: "Groq LPU" },
  { id: "gemini", name: "Gemini 2.0 Flash", badge: "Google AI", desc: "Google DeepMind · Versatile general intelligence", provider: "Google" },
];

function WindowsOrb() {
  return (
    <div className="nc-orb" aria-hidden="true">
      <div className="nc-orb-inner" />
    </div>
  );
}

function WindowHeader({ title, onClose, closeAriaLabel }) {
  return (
    <div className="nc-titlebar">
      <div className="nc-title">
        <WindowsOrb />
        <span className="nc-title-text">{title}</span>
      </div>
      {onClose && (
        <div className="nc-window-controls">
          <button
            className="nc-close-btn"
            onClick={onClose}
            aria-label={closeAriaLabel || "Close window"}
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

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
  const isUrgent = left < 120;
  const totalDuration = 1800; // Reference for progress bar
  const percentLeft = Math.min(100, Math.max(0, (left / totalDuration) * 100));

  return (
    <div style={{
      background: "var(--nc-bg-elevated)",
      border: "1px solid var(--nc-border)",
      borderRadius: "var(--radius-sm)",
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      minWidth: 0,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--nc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
          Session Clock
        </div>
        <div style={{
          fontFamily: "var(--font-system)",
          fontSize: 20,
          fontWeight: 700,
          color: isUrgent ? "var(--nc-danger)" : "var(--nc-champagne)",
          letterSpacing: 1,
          marginTop: -2,
        }}>
          {m}:{s}
        </div>
      </div>

      <div style={{ minWidth: 90, maxWidth: 140, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--nc-text-muted)", marginBottom: 3 }}>
          <span>{left > 0 ? `${Math.ceil(left / 60)}m left` : "Expired"}</span>
        </div>
        <div style={{ height: 6, background: "rgba(0, 0, 0, 0.4)", borderRadius: 3, overflow: "hidden", border: "1px solid var(--nc-border)" }}>
          <div style={{
            height: "100%",
            width: `${percentLeft}%`,
            background: isUrgent
              ? "linear-gradient(90deg, #b91c1c 0%, var(--nc-danger) 100%)"
              : "linear-gradient(90deg, #9d8354 0%, var(--nc-champagne) 100%)",
            borderRadius: 2,
            transition: "width 1s linear",
          }} />
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ role, content, model }) {
  const [copied, setCopied] = useState(false);

  function copyFullMessage() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (role === "user") {
    return (
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 16,
        gap: 10,
        alignItems: "flex-start",
      }}>
        <div style={{
          maxWidth: "85%",
          background: "var(--nc-surface-raised)",
          border: "1px solid var(--nc-border)",
          borderRadius: "8px 8px 2px 8px",
          padding: "12px 16px",
          color: "var(--nc-text)",
          boxShadow: "0 3px 10px rgba(0, 0, 0, 0.35)",
          lineHeight: 1.6,
          fontSize: 14.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {content}
        </div>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--nc-surface-hover)",
          border: "1px solid var(--nc-silver)",
          color: "var(--nc-text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          YOU
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "flex-start",
      marginBottom: 20,
      gap: 10,
      alignItems: "flex-start",
      minWidth: 0,
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "var(--nc-champagne-surface)",
        border: "1px solid var(--nc-champagne-muted)",
        color: "var(--nc-champagne)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: "0 0 8px var(--nc-champagne-glow)",
      }}>
        AI
      </div>

      <div style={{
        flex: 1,
        minWidth: 0,
        maxWidth: "92%",
        background: "var(--nc-surface)",
        border: "1px solid var(--nc-border)",
        borderRadius: "8px 8px 8px 2px",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
      }}>
        {/* Model header bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 12px",
          background: "linear-gradient(180deg, var(--nc-titlebar-top) 0%, var(--nc-titlebar-bottom) 100%)",
          borderBottom: "1px solid var(--nc-border)",
          fontSize: 11.5,
          color: "var(--nc-text-secondary)",
          gap: 8,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span className="nc-badge nc-badge-champagne" style={{ fontSize: 10.5, padding: "2px 7px" }}>
              {model || "AI ASSISTANT"}
            </span>
            <span style={{ color: "var(--nc-text-muted)", fontSize: 11 }}>· Verified Response</span>
          </div>

          <button
            onClick={copyFullMessage}
            aria-label="Copy assistant response"
            style={{
              background: copied ? "rgba(117, 184, 149, 0.2)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${copied ? "var(--nc-success)" : "var(--nc-border)"}`,
              color: copied ? "var(--nc-success)" : "var(--nc-text-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {/* Structured Markdown Content */}
        <div style={{ padding: "12px 16px", minWidth: 0 }}>
          <MarkdownMessage content={content} />
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onStart }) {
  return (
    <div className="nc-viewport-center">
      <div className="nc-window" style={{ maxWidth: 880 }}>
        {/* Requirement 3: Non-dismissible full page layout -> no window controls */}
        <WindowHeader title="NeuralCafe · Enterprise AI Workstation" />

        <div style={{ padding: "clamp(1.5rem, 5vw, 3rem)", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 20,
            background: "var(--nc-champagne-surface)",
            border: "1px solid rgba(216, 194, 154, 0.3)",
            color: "var(--nc-champagne)",
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: "0.05em",
            marginBottom: "1.4rem",
          }}>
            <WindowsOrb />
            <span>NEURALCAFE WORKSTATION · AERO COMPUTE ARCHITECTURE</span>
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.15,
            marginBottom: "1.2rem",
            color: "var(--nc-text)",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
          }}>
            Professional AI.<br />
            <span style={{ color: "var(--nc-champagne)" }}>
              Pure Pay-Per-Session.
            </span>
          </h1>

          <p style={{
            fontSize: 15.5,
            color: "var(--nc-text-secondary)",
            lineHeight: 1.65,
            maxWidth: 620,
            margin: "0 auto 2.2rem auto",
          }}>
            On-demand access to high-parameter foundation models without recurring subscriptions.
            Recharge your session balance, select your desired duration, and chat with instant LPU-accelerated intelligence.
          </p>

          {/* 4 Feature value propositions */}
          <div className="nc-grid-features" style={{ marginBottom: "2.4rem", textAlign: "left" }}>
            {[
              { title: "₹5 Entry Point", desc: "15 min compute bursts starting at ₹5", tag: "Affordable" },
              { title: "120B Flagship", desc: "GPT-OSS 120B reasoning & code synthesis", tag: "Enterprise" },
              { title: "Zero Lock-in", desc: "No subscriptions or auto-renewing debits", tag: "Transparent" },
              { title: "Isolated Memory", desc: "State and context wiped on session close", tag: "Confidential" },
            ].map((f, i) => (
              <div key={i} className="nc-card">
                <div style={{ fontSize: 10, color: "var(--nc-champagne)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                  {f.tag}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--nc-text)", marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--nc-text-secondary)", lineHeight: 1.45 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onStart}
            className="nc-btn nc-btn-champagne"
            style={{
              padding: "12px 36px",
              fontSize: 15.5,
              borderRadius: "var(--radius-sm)",
            }}
          >
            Start an AI Session →
          </button>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginTop: "2.5rem",
            fontSize: 12,
            color: "var(--nc-text-muted)",
            borderTop: "1px solid var(--nc-border)",
            paddingTop: "1.2rem",
          }}>
            <span>🔒 Google OAuth Secured</span>
            <span>·</span>
            <span>⚡ Groq Cloud LPU Powered</span>
            <span>·</span>
            <span>🗄️ Supabase PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
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
  const [selectedModel, setSelectedModel] = useState("gpt-oss");
  const bottomRef = useRef(null);

  // Sync user with backend & local storage
  async function syncUserWithBackend(emailAddress) {
    if (!emailAddress) return;
    try {
      const res = await fetch(`${API}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress }),
      }).then(r => r.json());

      if (res && res.userId) {
        setUserId(res.userId);
        setUserEmail(res.email);
        setBalance(typeof res.balance === "number" ? res.balance : 0);
        localStorage.setItem("nc_userId", res.userId);
        localStorage.setItem("nc_email", res.email);
        setScreen("wallet");
        return res;
      }
    } catch (err) {
      console.error("Backend sync failed:", err);
    }
  }

  // Auto-login & Auth state listener
  useEffect(() => {
    getRedirectUser().then(user => {
      if (user && user.email) {
        syncUserWithBackend(user.email);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user && user.email) {
        syncUserWithBackend(user.email);
      }
    });

    const savedId = localStorage.getItem("nc_userId");
    const savedEmail = localStorage.getItem("nc_email");
    if (savedId && savedEmail) {
      setUserId(savedId);
      setUserEmail(savedEmail);
      fetch(`${API}/wallet/${savedId}`)
        .then(r => r.json())
        .then(d => {
          if (d && typeof d.balance !== "undefined") {
            setBalance(d.balance);
            setScreen("wallet");
          }
        })
        .catch(console.error);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (Date.now() > session.endsAt) {
        setStatus("⏰ Session time expired.");
        setSession(null);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [session]);

  async function handleLogin() {
    setLoading(true);
    setStatus("");
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        await syncUserWithBackend(user.email);
      }
      setLoading(false);
    } catch (error) {
      console.error("Login failed:", error);
      setStatus("❌ Sign-in issue: " + error.message);
      setLoading(false);
    }
  }

  async function handleTopup() {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) return setStatus("Please enter a valid amount (e.g. ₹50)");
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API}/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: amt }),
      }).then(r => r.json());

      if (res.balance !== undefined) {
        setBalance(res.balance);
        setStatus(`✓ Added ₹${amt}. New balance: ₹${res.balance}`);
        setLoading(false);
        setTimeout(() => { setStatus(""); setScreen("plans"); }, 800);
      }
    } catch (e) {
      setStatus("❌ Top-up failed: " + e.message);
      setLoading(false);
    }
  }

  async function handleStartSession() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: selectedPlan }),
      }).then(r => r.json());

      if (res.error) {
        setStatus("❌ " + res.error);
        setLoading(false);
        return;
      }

      setBalance(res.balance);
      setSession({ sessionId: res.sessionId, endsAt: res.endsAt, plan: selectedPlan, model: selectedModel });
      const currentModelName = MODELS.find(m => m.id === selectedModel)?.name || "AI";
      setMessages([{
        role: "assistant",
        content: `**Welcome to your NeuralCafe session.**\n\nYour **${PLANS[selectedPlan].label}** session is now active with model **${currentModelName}**.\n\nFeel free to ask complex coding questions, paste architectures, or draft documents. What are you working on today?`,
        model: currentModelName,
      }]);
      setScreen("chat");
      setLoading(false);
    } catch (err) {
      setStatus("❌ Failed to initiate session: " + err.message);
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || !session) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, message: userMsg, model: selectedModel }),
      }).then(r => r.json());

      if (res.error) {
        setMessages(m => [...m, { role: "assistant", content: `⚠️ **Session Error:** ${res.error}` }]);
        if (res.error.includes("expired") || res.error.includes("Token")) {
          setSession(null);
        }
      } else {
        const modelBadge = MODELS.find(m => m.id === selectedModel)?.name || "AI";
        setMessages(m => [...m, { role: "assistant", content: res.reply, model: modelBadge }]);
        setTokenInfo({ used: res.tokensUsed, max: res.maxTokens });
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: `⚠️ **Network Error:** Could not contact server (${e.message}).` }]);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await logOut();
    localStorage.removeItem("nc_userId");
    localStorage.removeItem("nc_email");
    setUserId(null);
    setUserEmail("");
    setBalance(0);
    setSession(null);
    setMessages([]);
    setScreen("login");
  }

  // ── 1. LANDING PAGE ──
  if (screen === "landing") {
    return <LandingPage onStart={() => setScreen("login")} />;
  }

  // ── 2. LOGIN SCREEN ──
  if (screen === "login") {
    return (
      <div className="nc-viewport-center">
        <div className="nc-window" style={{ maxWidth: 440 }}>
          <WindowHeader
            title="Authentication · NeuralCafe"
            onClose={() => setScreen("landing")}
            closeAriaLabel="Close authentication and return to landing page"
          />

          <div style={{ padding: "clamp(1.5rem, 4vw, 2.2rem)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--nc-champagne-surface)",
                border: "1.5px solid var(--nc-champagne-muted)",
                boxShadow: "0 0 12px var(--nc-champagne-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}>
                👤
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18.5, fontWeight: 700, color: "var(--nc-text)" }}>
                  Sign in to NeuralCafe
                </h2>
                <div style={{ fontSize: 12.5, color: "var(--nc-text-secondary)", marginTop: 2 }}>
                  Secure session wallet authorization
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--nc-text-secondary)", lineHeight: 1.6, marginBottom: "1.6rem" }}>
              Authenticate with your Google account to connect your persistent wallet balance, start AI sessions, and access model compute.
            </p>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="nc-btn"
              style={{
                width: "100%",
                background: "#ffffff",
                color: "#1e293b",
                border: "1px solid #cbd5e1",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <img
                src="https://www.google.com/favicon.ico"
                width={17}
                height={17}
                alt="Google"
              />
              <span>{loading ? "Connecting Google Account..." : "Continue with Google Account"}</span>
            </button>

            {status && (
              <div style={{
                marginTop: 14,
                fontSize: 12.5,
                color: "var(--nc-danger)",
                background: "rgba(225, 139, 135, 0.12)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(225, 139, 135, 0.3)",
              }}>
                {status}
              </div>
            )}

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.8rem",
              paddingTop: "1.2rem",
              borderTop: "1px solid var(--nc-border)",
              fontSize: 11.5,
              color: "var(--nc-text-muted)",
            }}>
              <span>🔒 256-Bit SSL Encrypted</span>
              <button
                onClick={() => setScreen("landing")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--nc-champagne)",
                  cursor: "pointer",
                  fontSize: 11.5,
                  textDecoration: "underline",
                  padding: "4px",
                }}
              >
                ← Return to Landing Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. WALLET SCREEN ──
  if (screen === "wallet") {
    return (
      <div className="nc-viewport-center">
        <div className="nc-window" style={{ maxWidth: 520 }}>
          <WindowHeader
            title={`NeuralCafe Wallet Manager — ${userEmail}`}
            onClose={() => setScreen("landing")}
            closeAriaLabel="Close wallet and return to landing page"
          />

          <div style={{ padding: "clamp(1.4rem, 4vw, 2rem)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: "var(--nc-champagne)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
                  Verified Account
                </div>
                <div style={{ fontSize: 14.5, color: "var(--nc-text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userEmail}
                </div>
              </div>
              <button
                className="nc-btn nc-btn-silver"
                style={{ fontSize: 11.5, padding: "5px 12px", minHeight: 32 }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>

            {/* Balance Card */}
            <div style={{
              background: "linear-gradient(180deg, rgba(216, 194, 154, 0.08) 0%, rgba(34, 37, 43, 0.9) 100%)",
              border: "1px solid var(--nc-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.2rem 1.4rem",
              marginBottom: "1.5rem",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--nc-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Current Wallet Balance
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--nc-champagne)", marginTop: 2, letterSpacing: -0.5 }}>
                  ₹{balance}
                </div>
              </div>
              <div className="nc-badge nc-badge-champagne">
                Active · Ready
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--nc-text)", marginBottom: 8 }}>
              Select Top-up Amount:
            </div>
            <div className="nc-grid-presets" style={{ marginBottom: 14 }}>
              {[20, 50, 100, 200].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopupAmt(String(amt))}
                  className={`nc-btn ${topupAmt === String(amt) ? "nc-btn-champagne" : "nc-btn-silver"}`}
                  style={{ padding: "8px 0", minHeight: 38 }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <input
                className="nc-input"
                type="number"
                placeholder="Or enter custom amount in ₹"
                value={topupAmt}
                onChange={e => setTopupAmt(e.target.value)}
              />
            </div>

            <button
              onClick={handleTopup}
              disabled={loading}
              className="nc-btn nc-btn-champagne"
              style={{ width: "100%", padding: "11px 0", fontSize: 14.5, marginBottom: 10 }}
            >
              {loading ? "Processing..." : `Recharge Wallet (₹${topupAmt || "?"}) →`}
            </button>

            {balance > 0 && (
              <button
                onClick={() => setScreen("plans")}
                className="nc-btn nc-btn-silver"
                style={{ width: "100%", padding: "10px 0", fontSize: 13.5 }}
              >
                Proceed to Session Plans →
              </button>
            )}

            {status && (
              <div style={{
                marginTop: 12,
                fontSize: 12.5,
                color: "var(--nc-champagne)",
                textAlign: "center",
                background: "var(--nc-champagne-surface)",
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(216, 194, 154, 0.25)",
              }}>
                {status}
              </div>
            )}

            <div style={{ fontSize: 11, color: "var(--nc-text-muted)", textAlign: "center", marginTop: 16 }}>
              🔒 Demo Environment — Top-ups are simulated instantly for demonstration
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. PLAN & MODEL SELECTION SCREEN ──
  if (screen === "plans") {
    const activePlan = PLANS[selectedPlan];
    const canAfford = balance >= activePlan.price;

    return (
      <div className="nc-viewport-center">
        <div className="nc-window" style={{ maxWidth: 680 }}>
          <WindowHeader
            title="Session Configuration · NeuralCafe"
            onClose={() => setScreen("wallet")}
            closeAriaLabel="Close session configuration and return to wallet"
          />

          <div style={{ padding: "clamp(1.4rem, 4vw, 2rem)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem", gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "var(--nc-text)" }}>
                  Select Session Plan
                </h2>
                <div style={{ fontSize: 12.5, color: "var(--nc-text-secondary)", marginTop: 2 }}>
                  Pay only for the time you need.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--nc-text-muted)" }}>Wallet Balance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--nc-champagne)" }}>₹{balance}</div>
              </div>
            </div>

            {/* Plan cards */}
            <div className="nc-grid-plans" style={{ marginBottom: "1.8rem" }}>
              {Object.entries(PLANS).map(([key, plan]) => {
                const isSelected = selectedPlan === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`nc-card nc-card-interactive ${isSelected ? "nc-card-selected" : ""}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && setSelectedPlan(key)}
                    aria-label={`${plan.label} plan, price ₹${plan.price}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--nc-text)" }}>
                        {plan.label}
                      </span>
                      {isSelected && (
                        <span className="nc-badge nc-badge-champagne" style={{ fontSize: 9.5, padding: "1px 5px" }}>
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? "var(--nc-champagne)" : "var(--nc-text)", margin: "4px 0" }}>
                      ₹{plan.price}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--nc-text-secondary)", lineHeight: 1.35 }}>
                      {plan.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Model Selection */}
            <div style={{ marginBottom: "1.8rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--nc-text)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>Select AI Inference Engine</span>
                <span style={{ fontSize: 11, color: "var(--nc-champagne)" }}>Groq LPU Accelerated</span>
              </div>
              <div className="nc-grid-models">
                {MODELS.map(m => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`nc-card nc-card-interactive ${isSelected ? "nc-card-selected" : ""}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setSelectedModel(m.id)}
                      aria-label={`${m.name} model engine`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--nc-text)" }}>{m.name}</span>
                        {isSelected && (
                          <span className="nc-badge nc-badge-champagne" style={{ fontSize: 9.5, padding: "1px 5px" }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--nc-champagne)", fontWeight: 600, marginBottom: 4 }}>
                        {m.badge}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--nc-text-muted)", lineHeight: 1.3 }}>
                        {m.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Launch button */}
            <button
              onClick={handleStartSession}
              disabled={loading || !canAfford}
              className="nc-btn nc-btn-champagne"
              style={{ width: "100%", padding: "12px 0", fontSize: 15, marginBottom: 10 }}
            >
              {loading
                ? "Allocating Compute Session..."
                : !canAfford
                ? `Need ₹${activePlan.price - balance} more (Recharge Wallet)`
                : `Launch ${activePlan.label} Session (₹${activePlan.price}) →`}
            </button>

            <button
              onClick={() => setScreen("wallet")}
              className="nc-btn nc-btn-silver"
              style={{ width: "100%", padding: "9px 0", fontSize: 13 }}
            >
              ← Manage Wallet Funds
            </button>

            {status && (
              <div style={{
                marginTop: 12,
                fontSize: 12.5,
                color: "var(--nc-danger)",
                textAlign: "center",
                background: "rgba(225, 139, 135, 0.12)",
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(225, 139, 135, 0.3)",
              }}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── 5. ACTIVE CHAT SCREEN ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "clamp(0.5rem, 2vw, 1rem)", paddingBottom: "max(clamp(0.5rem, 2vw, 1rem), var(--safe-bottom))" }}>
      <div className="nc-window" style={{ maxWidth: 940, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Requirement 3: Close button navigates to plans/overview without terminating active session */}
        <WindowHeader
          title={`NeuralCafe Workspace — ${session?.plan ? session.plan.toUpperCase() : "ACTIVE"} · ${userEmail}`}
          onClose={() => setScreen("plans")}
          closeAriaLabel="Close chat window and return to configuration"
        />

        {/* Workspace Toolbar */}
        <div style={{
          padding: "8px 14px",
          background: "var(--nc-bg-elevated)",
          borderBottom: "1px solid var(--nc-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, minWidth: 0 }}>
            <span className="nc-badge nc-badge-champagne" style={{ fontSize: 11.5 }}>
              {MODELS.find(m => m.id === selectedModel)?.name || "AI Engine"}
            </span>
            <span style={{ fontSize: 12, color: "var(--nc-text-secondary)" }}>
              Wallet: <strong style={{ color: "var(--nc-champagne)" }}>₹{balance}</strong>
            </span>
            <span style={{ fontSize: 11.5, color: "var(--nc-text-muted)" }}>
              · {tokenInfo ? `${tokenInfo.used.toLocaleString()} / ${tokenInfo.max.toLocaleString()} tokens` : "Token meter active"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {session && <Timer endsAt={session.endsAt} />}
            <button
              onClick={() => { setSession(null); setScreen("plans"); }}
              className="nc-btn nc-btn-danger"
              style={{ fontSize: 11.5, padding: "5px 12px", minHeight: 32 }}
              title="Terminate this session"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div style={{
          flex: 1,
          minHeight: 360,
          maxHeight: "calc(100vh - 270px)",
          overflowY: "auto",
          padding: "clamp(1rem, 3vw, 1.8rem)",
          background: "var(--nc-bg)",
          minWidth: 0,
        }}>
          {messages.map((m, i) => (
            <ChatMessage key={i} {...m} />
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--nc-champagne-surface)",
                border: "1px solid var(--nc-champagne-muted)",
                color: "var(--nc-champagne)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: "0 0 8px var(--nc-champagne-glow)",
              }}>
                AI
              </div>
              <div style={{
                background: "var(--nc-surface)",
                border: "1px solid var(--nc-border)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 14px",
                fontSize: 12.5,
                color: "var(--nc-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div
                  className="nc-pulse"
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--nc-champagne)" }}
                />
                <span>AI is thinking & structuring response...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Dock */}
        <div style={{
          padding: "10px 14px",
          background: "var(--nc-bg-elevated)",
          borderTop: "1px solid var(--nc-border)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}>
          <input
            className="nc-input"
            style={{ flex: 1 }}
            placeholder={session ? "Ask a question, request code, or draft content (Enter to send)..." : "Session ended. Return to configuration to start a new one."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={!session || loading}
          />
          <button
            onClick={handleSend}
            disabled={!session || loading || !input.trim()}
            className="nc-btn nc-btn-champagne"
            style={{ padding: "0 20px", fontSize: 13.5 }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Status Strip */}
        <div style={{
          padding: "5px 14px",
          background: "var(--nc-bg)",
          borderTop: "1px solid var(--nc-border)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10.5,
          color: "var(--nc-text-muted)",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>● Supabase Connected</span>
            <span>⚡ Groq Cloud LPU</span>
            <span>🔒 Session Sandboxed</span>
          </div>
          <div>
            <span>Press Enter ↵ to Send</span>
          </div>
        </div>
      </div>
    </div>
  );
}