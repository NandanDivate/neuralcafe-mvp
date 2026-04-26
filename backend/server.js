// NeuralCafe MVP - Backend Server (Groq + Supabase Edition)
// Run with: node server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});



const supabase = createClient(
  "https://kdviazumpgooatuolmdl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkdmlhenVtcGdvb2F0dW9sbWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjIzNjYsImV4cCI6MjA5MjY5ODM2Nn0.3ukX_fIFXsSd6hqbGekTgBffl-OrL7Y0g7FNvTC0UN8"
);

const PLANS = {
  "15min": { duration: 15 * 60 * 1000, price: 5,  maxTokens: 20000 },
  "30min": { duration: 30 * 60 * 1000, price: 10, maxTokens: 40000 },
  "1hr":   { duration: 60 * 60 * 1000, price: 18, maxTokens: 80000 },
};

const sessionHistories = {};

// 1. Register or login user by email
app.post("/api/user", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({ email })
        .select()
        .single();

      if (error) throw error;
      user = newUser;

      await supabase
        .from("wallets")
        .insert({ user_id: user.id, balance: 0 });

      console.log(`👤 New user created: ${email}`);
    } else {
      console.log(`👤 Returning user: ${email}`);
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    res.json({ userId: user.id, email: user.email, balance: wallet?.balance || 0 });

  } catch (error) {
    console.error("User error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Top up wallet
app.post("/api/wallet/topup", async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).json({ error: "Invalid request" });

  try {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (wallet?.balance || 0) + amount;

    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date() })
      .eq("user_id", userId);

    console.log(`💰 User ${userId} topped up ₹${amount}. New balance: ₹${newBalance}`);
    res.json({ success: true, balance: newBalance });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get wallet balance
app.get("/api/wallet/:userId", async (req, res) => {
  try {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", req.params.userId)
      .single();

    res.json({ balance: wallet?.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Start a session
app.post("/api/session/start", async (req, res) => {
  const { userId, plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

  try {
    const { price, duration, maxTokens } = PLANS[plan];

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!wallet || wallet.balance < price) {
      return res.status(402).json({ error: `Insufficient balance. Need ₹${price}, have ₹${wallet?.balance || 0}` });
    }

    const newBalance = wallet.balance - price;
    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date() })
      .eq("user_id", userId);

    const endsAt = new Date(Date.now() + duration);
    const { data: session, error } = await supabase
      .from("sessions")
      .insert({ user_id: userId, plan, ends_at: endsAt, tokens_used: 0, max_tokens: maxTokens })
      .select()
      .single();

    if (error) throw error;

    sessionHistories[session.id] = [];

    console.log(`🚀 Session ${session.id} started | Plan: ${plan}`);
    res.json({ sessionId: session.id, plan, endsAt: endsAt.getTime(), balance: newBalance });

  } catch (error) {
    console.error("Session start error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5. Chat with AI
app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  try {
    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    console.log("Session lookup:", sessionId, session, error);
    if (error || !session) return res.status(403).json({ error: "Session not found" });
    
    if (new Date() > new Date(session.ends_at + "Z")) return res.status(403).json({ error: "Session expired" });
    if (session.tokens_used >= session.max_tokens) return res.status(403).json({ error: "Token limit reached" });

    if (!sessionHistories[sessionId]) sessionHistories[sessionId] = [];
    sessionHistories[sessionId].push({ role: "user", content: message });
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: "You are a helpful AI assistant on NeuralCafe, a pay-per-session AI platform. Be helpful, concise, and friendly." },
        ...sessionHistories[sessionId],
      ],
    });

    const reply = response.choices[0].message.content;
    const tokensUsed = response.usage.prompt_tokens + response.usage.completion_tokens;
    const newTokensUsed = session.tokens_used + tokensUsed;

    await supabase
      .from("sessions")
      .update({ tokens_used: newTokensUsed })
      .eq("id", sessionId);

    sessionHistories[sessionId].push({ role: "assistant", content: reply });

    const timeLeft = Math.max(0, Math.floor((new Date(session.ends_at) - Date.now()) / 1000));

    console.log(`🤖 [${sessionId}] Tokens: ${newTokensUsed}/${session.max_tokens} | Time left: ${timeLeft}s`);
    res.json({ reply, tokensUsed: newTokensUsed, maxTokens: session.max_tokens, timeLeft, tokensLeft: session.max_tokens - newTokensUsed });

  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "AI call failed: " + error.message });
  }
});

// 6. Session status
app.get("/api/session/:sessionId", async (req, res) => {
  try {
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", req.params.sessionId)
      .single();

    if (!session) return res.status(404).json({ error: "Session not found" });
    if (new Date() > new Date(session.ends_at)) return res.status(403).json({ error: "Session expired" });

    res.json({
      valid: true,
      timeLeft: Math.max(0, Math.floor((new Date(session.ends_at) - Date.now()) / 1000)),
      tokensUsed: session.tokens_used,
      maxTokens: session.max_tokens,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 NeuralCafe backend running on http://localhost:${PORT}`);
  console.log(`⚡ Using Groq — Model: llama-3.3-70b-versatile`);
  console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? "✓ Connected" : "✗ MISSING!"}`);
  console.log(`📡 Groq API key: ${process.env.GROQ_API_KEY ? "✓ Loaded" : "✗ MISSING!"}\n`);
});