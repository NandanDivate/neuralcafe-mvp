import { useState, useEffect, useRef } from "react";
import { signInWithGoogle, logOut, auth, getRedirectUser, onAuthStateChanged } from "./firebase";
import MarkdownMessage from "./MarkdownMessage";

const API = import.meta.env.VITE_API_URL || "https://neuralcafe-mvp.onrender.com/api";

const PLANS = {
  "15min": { label: "15 Minutes", price: 5, tokens: "20,000", desc: "Quick burst · Ideal for rapid queries & debugging" },
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
    <div style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #93c5fd 0%, #2563eb 55%, #1e3a8a 100%)",
      boxShadow: "0 0 10px rgba(59, 130, 246, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.8)",
        filter: "blur(0.5px)",
      }} />
    </div>
  );
}

function WindowHeader({ title, onClose, onMinimize, onMaximize }) {
  return (
    <div className="aero-titlebar">
      <div className="aero-title">
        <WindowsOrb />
        <span>{title}</span>
      </div>
      <div className="aero-window-controls">
        <button className="aero-control-btn" onClick={onMinimize} title="Minimize">_</button>
        <button className="aero-control-btn" onClick={onMaximize} title="Maximize">□</button>
        <button className="aero-control-btn close" onClick={onClose} title="Close">✕</button>
      </div>
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
  const totalDuration = 1800; // Reference for progress bar (up to 30m default)
  const percentLeft = Math.min(100, Math.max(0, (left / totalDuration) * 100));

  return (
    <div style={{
      background: "rgba(9, 20, 36, 0.75)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: 6,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          Session Clock
        </div>
        <div style={{
          fontFamily: "var(--font-system)",
          fontSize: 26,
          fontWeight: 700,
          color: isUrgent ? "#f87171" : "#38bdf8",
          textShadow: isUrgent ? "0 0 10px rgba(239, 68, 68, 0.6)" : "0 0 10px rgba(56, 189, 248, 0.6)",
          letterSpacing: 1.5,
          marginTop: -2,
        }}>
          {m}:{s}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 220 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          <span>Duration Remaining</span>
          <span>{left > 0 ? `${Math.ceil(left / 60)}m` : "Expired"}</span>
        </div>
        <div style={{ height: 8, background: "rgba(0, 0, 0, 0.5)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{
            height: "100%",
            width: `${percentLeft}%`,
            background: isUrgent
              ? "linear-gradient(90deg, #ef4444 0%, #f87171 100%)"
              : "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
            borderRadius: 3,
            transition: "width 1s linear",
            boxShadow: isUrgent ? "0 0 8px #ef4444" : "0 0 8px #38bdf8",
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
          maxWidth: "80%",
          background: "linear-gradient(180deg, rgba(37, 99, 235, 0.35) 0%, rgba(29, 78, 216, 0.45) 100%)",
          border: "1px solid rgba(96, 165, 250, 0.45)",
          borderRadius: "10px 10px 2px 10px",
          padding: "12px 16px",
          color: "#f8fafc",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
          lineHeight: 1.6,
          fontSize: 14.5,
          whiteSpace: "pre-wrap",
        }}>
          {content}
        </div>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
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
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
        border: "1px solid rgba(56, 189, 248, 0.6)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: "0 0 10px rgba(56, 189, 248, 0.5)",
      }}>
        AI
      </div>

      <div style={{
        flex: 1,
        maxWidth: "88%",
        background: "rgba(12, 24, 42, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        borderRadius: "10px 10px 10px 2px",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.45)",
      }}>
        {/* Model header bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 14px",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          fontSize: 11.5,
          color: "var(--text-secondary)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              padding: "2px 8px",
              borderRadius: 3,
              fontWeight: 600,
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: 11,
            }}>
              {model || "AI ASSISTANT"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>· Verified Response</span>
          </div>

          <button
            onClick={copyFullMessage}
            style={{
              background: copied ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${copied ? "#10b981" : "rgba(255, 255, 255, 0.15)"}`,
              color: copied ? "#34d399" : "var(--text-secondary)",
              borderRadius: 3,
              padding: "2px 8px",
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? "✓ Copied Response" : "Copy"}
          </button>
        </div>

        {/* Structured Markdown Content */}
        <div style={{ padding: "14px 18px" }}>
          <MarkdownMessage content={content} />
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
    }}>
      <div className="aero-window" style={{ width: "100%", maxWidth: 840 }}>
        <WindowHeader title="NeuralCafe — Enterprise Pay-Per-Session AI Platform" />

        <div style={{ padding: "3rem 2.5rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "5px 14px",
            borderRadius: 20,
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            color: "#38bdf8",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
            marginBottom: "1.5rem",
            boxShadow: "0 0 14px rgba(56, 189, 248, 0.25)",
          }}>
            <WindowsOrb />
            <span>NEURALCAFE · AERO COMPUTE ENVIRONMENT</span>
          </div>

          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1.12,
            marginBottom: "1.2rem",
            color: "#ffffff",
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.6)",
          }}>
            Professional AI.<br />
            <span style={{
              background: "linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Pure Pay-Per-Session.
            </span>
          </h1>

          <p style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            maxWidth: 620,
            margin: "0 auto 2.5rem auto",
          }}>
            Direct access to high-parameter intelligence without recurring monthly subscriptions.
            Recharge your session wallet, select your desired duration, and chat with instant LPU-accelerated models.
          </p>

          {/* 4 Feature value propositions in Aero Glass Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
            marginBottom: "2.8rem",
            textAlign: "left",
          }}>
            {[
              { title: "₹5 Base Entry", desc: "15 min burst from ₹5", tag: "Affordable" },
              { title: "120B Flagship", desc: "GPT-OSS 120B Reasoning", tag: "Enterprise" },
              { title: "Zero Lock-in", desc: "No subscriptions or auto-debits", tag: "Transparent" },
              { title: "Isolated Memory", desc: "Session cleared on exit", tag: "Confidential" },
            ].map((f, i) => (
              <div key={i} style={{
                background: "rgba(18, 36, 62, 0.55)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: 6,
                padding: "16px 14px",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}>
                <div style={{ fontSize: 10, color: "var(--aero-cyan)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                  {f.tag}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onStart}
            className="aero-btn aero-btn-primary"
            style={{
              padding: "14px 38px",
              fontSize: 16,
              borderRadius: 6,
              boxShadow: "0 0 20px rgba(56, 189, 248, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            }}
          >
            Start an AI Session →
          </button>

          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginTop: "2.5rem",
            fontSize: 12,
            color: "var(--text-muted)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "1.2rem",
          }}>
            <span>🔒 Google OAuth Secured</span>
            <span>·</span>
            <span>⚡ Groq LPU Powered</span>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="aero-window" style={{ width: "100%", maxWidth: 460 }}>
          <WindowHeader
            title="Windows Security · User Authentication"
            onClose={() => setScreen("landing")}
            onMinimize={() => {}}
            onMaximize={() => {}}
          />

          <div style={{ padding: "2.2rem 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.5rem" }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af 0%, #0369a1 100%)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}>
                👤
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                  Sign in to NeuralCafe
                </h2>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                  Secure session wallet authorization
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.8rem" }}>
              Sign in with your Google account to connect your persistent wallet balance, start AI sessions, and access model compute.
            </p>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
                color: "#0f172a",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                borderRadius: 4,
                padding: "11px 18px",
                fontFamily: "var(--font-system)",
                fontWeight: 600,
                fontSize: 14.5,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35), inset 0 1px 0 #ffffff",
                transition: "all 0.15s ease",
              }}
            >
              <img
                src="https://www.google.com/favicon.ico"
                width={18}
                height={18}
                alt="Google"
              />
              {loading ? "Connecting Google Account..." : "Continue with Google Account"}
            </button>

            {status && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: "#f87171", background: "rgba(239, 68, 68, 0.1)", padding: "8px 12px", borderRadius: 4, border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                {status}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.2rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: 11.5, color: "var(--text-muted)" }}>
              <span>🔒 256-Bit SSL Encrypted</span>
              <button
                onClick={() => setScreen("landing")}
                style={{ background: "transparent", border: "none", color: "var(--aero-cyan)", cursor: "pointer", fontSize: 11.5, textDecoration: "underline" }}
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="aero-window" style={{ width: "100%", maxWidth: 520 }}>
          <WindowHeader
            title={`NeuralCafe Wallet Manager — ${userEmail}`}
            onClose={() => setScreen("landing")}
            onMinimize={() => {}}
            onMaximize={() => {}}
          />

          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.4rem" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--aero-cyan)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>
                  Verified Account
                </div>
                <div style={{ fontSize: 15, color: "#ffffff", fontWeight: 600 }}>
                  {userEmail}
                </div>
              </div>
              <button className="aero-btn aero-btn-secondary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={handleLogout}>
                Sign Out
              </button>
            </div>

            {/* Balance Card */}
            <div style={{
              background: "linear-gradient(180deg, rgba(30, 64, 175, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              borderRadius: 6,
              padding: "1.4rem",
              marginBottom: "1.6rem",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Current Wallet Balance
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", marginTop: 2, letterSpacing: -1 }}>
                  ₹{balance}
                </div>
              </div>
              <div style={{
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#38bdf8",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}>
                Active · Ready
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-main)", marginBottom: 8 }}>
              Select Top-up Amount:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
              {[20, 50, 100, 200].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopupAmt(String(amt))}
                  className={`aero-btn ${topupAmt === String(amt) ? "aero-btn-primary" : "aero-btn-secondary"}`}
                  style={{ padding: "8px 0" }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                className="aero-input"
                type="number"
                placeholder="Or enter custom amount in ₹"
                value={topupAmt}
                onChange={e => setTopupAmt(e.target.value)}
              />
            </div>

            <button
              onClick={handleTopup}
              disabled={loading}
              className="aero-btn aero-btn-primary"
              style={{ width: "100%", padding: "11px 0", fontSize: 14.5, marginBottom: 10 }}
            >
              {loading ? "Processing..." : `Recharge Wallet (₹${topupAmt || "?"}) →`}
            </button>

            {balance > 0 && (
              <button
                onClick={() => setScreen("plans")}
                className="aero-btn aero-btn-secondary"
                style={{ width: "100%", padding: "10px 0", fontSize: 13.5 }}
              >
                Skip Recharge · Launch AI Session →
              </button>
            )}

            {status && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: "#38bdf8", textAlign: "center", background: "rgba(56, 189, 248, 0.1)", padding: "6px 12px", borderRadius: 4 }}>
                {status}
              </div>
            )}

            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="aero-window" style={{ width: "100%", maxWidth: 640 }}>
          <WindowHeader
            title="Session Configuration · NeuralCafe"
            onClose={() => setScreen("wallet")}
            onMinimize={() => {}}
            onMaximize={() => {}}
          />

          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                  Select Session Plan
                </h2>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
                  Pay only for the time you need.
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Wallet Balance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>₹{balance}</div>
              </div>
            </div>

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.8rem" }}>
              {Object.entries(PLANS).map(([key, plan]) => {
                const isSelected = selectedPlan === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    style={{
                      background: isSelected
                        ? "linear-gradient(180deg, rgba(30, 64, 175, 0.35) 0%, rgba(15, 23, 42, 0.7) 100%)"
                        : "rgba(18, 36, 62, 0.45)",
                      border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: 6,
                      padding: "14px 12px",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      boxShadow: isSelected ? "0 0 16px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)" : "none",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                      {plan.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isSelected ? "#38bdf8" : "#93c5fd", margin: "4px 0" }}>
                      ₹{plan.price}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>
                      {plan.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Model Selection */}
            <div style={{ marginBottom: "1.8rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>Select AI Inference Engine</span>
                <span style={{ fontSize: 11, color: "var(--aero-cyan)" }}>Groq LPU Accelerated</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {MODELS.map(m => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(180deg, rgba(30, 64, 175, 0.35) 0%, rgba(15, 23, 42, 0.7) 100%)"
                          : "rgba(18, 36, 62, 0.45)",
                        border: isSelected ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: 6,
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        boxShadow: isSelected ? "0 0 16px rgba(56, 189, 248, 0.35)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{m.name}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--aero-cyan)", fontWeight: 600, marginBottom: 4 }}>
                        {m.badge}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.3 }}>
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
              className="aero-btn aero-btn-primary"
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
              className="aero-btn aero-btn-secondary"
              style={{ width: "100%", padding: "8px 0", fontSize: 12.5 }}
            >
              ← Manage Wallet Funds
            </button>

            {status && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: "#f87171", textAlign: "center" }}>
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "1rem" }}>
      <div className="aero-window" style={{ width: "100%", maxWidth: 900, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <WindowHeader
          title={`NeuralCafe Workspace — ${session?.plan ? session.plan.toUpperCase() : "ACTIVE"} Plan · ${userEmail}`}
          onClose={() => { setSession(null); setScreen("plans"); }}
          onMinimize={() => {}}
          onMaximize={() => {}}
        />

        {/* Workspace Toolbar */}
        <div style={{
          padding: "10px 16px",
          background: "rgba(10, 22, 38, 0.7)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              border: "1px solid rgba(56, 189, 248, 0.35)",
            }}>
              {MODELS.find(m => m.id === selectedModel)?.name || "AI Engine"}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              Wallet: <strong style={{ color: "#ffffff" }}>₹{balance}</strong>
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              · {tokenInfo ? `${tokenInfo.used.toLocaleString()} / ${tokenInfo.max.toLocaleString()} tokens` : "Token meter ready"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {session && <Timer endsAt={session.endsAt} />}
            <button
              onClick={() => { setSession(null); setScreen("plans"); }}
              className="aero-btn aero-btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              End Session
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div style={{
          flex: 1,
          minHeight: 380,
          maxHeight: "calc(100vh - 280px)",
          overflowY: "auto",
          padding: "1.5rem 1.8rem",
          background: "rgba(6, 14, 26, 0.6)",
        }}>
          {messages.map((m, i) => (
            <ChatMessage key={i} {...m} />
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                border: "1px solid rgba(56, 189, 248, 0.6)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "0 0 10px rgba(56, 189, 248, 0.5)",
              }}>
                AI
              </div>
              <div style={{
                background: "rgba(12, 24, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", animation: "pulse 1.2s infinite ease-in-out" }} />
                <span>AI is thinking & structuring response...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Dock */}
        <div style={{
          padding: "14px 18px",
          background: "rgba(10, 22, 38, 0.85)",
          borderTop: "1px solid rgba(255, 255, 255, 0.14)",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}>
          <input
            className="aero-input"
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
            className="aero-btn aero-btn-primary"
            style={{ padding: "10px 22px", fontSize: 14 }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Windows 7 Status Strip */}
        <div style={{
          padding: "5px 14px",
          background: "rgba(6, 12, 22, 0.95)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--text-muted)",
        }}>
          <div style={{ display: "flex", gap: 14 }}>
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