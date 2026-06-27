const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const env = require("../config/env");
const { aiGenerateLimiter } = require("../config/rateLimiters");

async function fetchPixabayImage(word) {
  if (!env.PIXABAY_API_KEY) return "";
  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", env.PIXABAY_API_KEY);
    url.searchParams.set("q", word);
    url.searchParams.set("image_type", "all");
    url.searchParams.set("safesearch", "true");
    url.searchParams.set("per_page", "5");
    url.searchParams.set("lang", "en");
    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return "";
    const data = await resp.json();
    return data.hits?.[0]?.webformatURL || data.hits?.[0]?.largeImageURL || "";
  } catch {
    return "";
  }
}

// POST /api/ai/generate-wordlist
// Body: { topic: string, count: number }
// Returns: { words: [{ word, emoji, imageUrl }] }
router.post("/generate-wordlist", protect, isTeacher, aiGenerateLimiter, async (req, res) => {
  const { topic, count = 8 } = req.body;

  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

  const safeCount = Math.min(Math.max(parseInt(count) || 8, 3), 15);

  if (!env.GROQ_API_KEY) return res.status(503).json({ error: "AI service not configured" });

  try {
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates simple English vocabulary for children aged 3-5 years old. Always respond with valid JSON only, no extra text.",
          },
          {
            role: "user",
            content: `Generate exactly ${safeCount} simple English words about the topic "${topic.trim()}".
Rules:
- Words must be simple, common, concrete nouns (easily shown as a picture)
- Appropriate for children aged 3-5 years
- Include a relevant emoji for each word
- Return ONLY this JSON format, nothing else:
{"words":[{"word":"cat","emoji":"🐱"},{"word":"dog","emoji":"🐶"}]}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text().catch(() => "");
      throw new Error(`Groq ${groqResp.status}: ${errText}`);
    }

    const groqData = await groqResp.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "AI returned invalid response. Please try again." });
    }

    const wordItems = (parsed.words || [])
      .slice(0, safeCount)
      .filter((item) => item?.word && typeof item.word === "string");

    if (wordItems.length === 0) {
      return res
        .status(502)
        .json({ error: "AI could not generate words for this topic. Try a different topic." });
    }

    // Fetch images in parallel — failures are silent (imageUrl = "")
    const withImages = await Promise.all(
      wordItems.map(async (item) => ({
        word: item.word.toLowerCase().trim(),
        emoji: item.emoji || "",
        imageUrl: await fetchPixabayImage(item.word),
      }))
    );

    return res.json({ words: withImages });
  } catch {
    return res.status(503).json({ error: "AI service unavailable. Please try again." });
  }
});

// POST /api/ai/generate-quiz
// Body: { topic: string, count: number }
// Returns: { questions: [{ questionText, options, correctAnswer }] }
router.post("/generate-quiz", protect, isTeacher, aiGenerateLimiter, async (req, res) => {
  const { topic, count = 5 } = req.body;

  if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

  const safeCount = Math.min(Math.max(parseInt(count) || 5, 2), 10);

  if (!env.GROQ_API_KEY) return res.status(503).json({ error: "AI service not configured" });

  try {
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that creates simple English quiz questions for children aged 3-5 years old. Always respond with valid JSON only, no extra text.",
          },
          {
            role: "user",
            content: `Generate exactly ${safeCount} multiple-choice quiz questions about "${topic.trim()}" for children aged 3-5.
Rules:
- Questions must be very simple and use familiar objects/animals/colors
- Each question has exactly 4 short answer options (single words or very short phrases)
- One correct answer from the options
- Return ONLY this JSON format, nothing else:
{"questions":[{"questionText":"What color is the sky?","options":["blue","red","green","yellow"],"correctAnswer":"blue"}]}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.75,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!groqResp.ok) {
      const errText = await groqResp.text().catch(() => "");
      throw new Error(`Groq ${groqResp.status}: ${errText}`);
    }

    const groqData = await groqResp.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "AI returned invalid response. Please try again." });
    }

    const questions = (parsed.questions || [])
      .slice(0, safeCount)
      .filter(
        (q) =>
          q?.questionText &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          q.correctAnswer &&
          q.options.includes(q.correctAnswer)
      )
      .map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((o) => String(o).trim()),
        correctAnswer: String(q.correctAnswer).trim(),
        imageUrl: "",
        audioUrl: "",
      }));

    if (questions.length === 0) {
      return res.status(502).json({ error: "AI could not generate questions. Try a different topic." });
    }

    // Fetch image for each question using correctAnswer as the search term
    const withImages = await Promise.all(
      questions.map(async (q) => ({
        ...q,
        imageUrl: await fetchPixabayImage(q.correctAnswer),
      }))
    );

    return res.json({ questions: withImages });
  } catch {
    return res.status(503).json({ error: "AI service unavailable. Please try again." });
  }
});

module.exports = router;
