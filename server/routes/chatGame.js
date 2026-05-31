const express = require("express");
const env = require("../config/env");
const { chatLimiter } = require("../config/rateLimiters");

const router = express.Router();

const SYSTEM_PROMPT = `You are Luna, a friendly space explorer who loves helping young children practice English.
Rules:
- Reply in 1-2 short, simple sentences only.
- Use vocabulary suitable for children aged 5-10.
- Always end with one easy question to keep the conversation going.
- Be warm, enthusiastic, and encouraging.
- If the child says something unclear, gently ask them to repeat.`;

router.post("/message", chatLimiter, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "messages array is required." });

  if (!env.GROQ_API_KEY)
    return res.status(503).json({ error: "Groq API key not configured." });

  // Keep last 10 messages to limit tokens
  const history = messages.slice(-10);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        max_tokens: 120,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      throw new Error(`Groq ${response.status}: ${err}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    return res.json({ reply });
  } catch (err) {
    return res.status(503).json({ error: "AI service unavailable. Please try again." });
  }
});

module.exports = router;
