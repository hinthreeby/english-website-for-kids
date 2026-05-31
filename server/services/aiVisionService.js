const env = require("../config/env");

async function checkDrawing(imageBase64, keyword) {
  const prompt = `Look at this hand-drawn picture. Does it represent a "${keyword}"? The drawing should be clearly recognizable as a ${keyword} — you should be able to identify its main shape or key features. Answer "yes" only if the drawing is reasonably recognizable as a ${keyword}. Answer "no" if it is too vague, scribbled, incomplete, or does not actually look like a ${keyword}. Answer with only "yes" or "no".`;
  const raw = await callGroq(imageBase64, prompt);
  const normalized = raw.trim().toLowerCase();
  return {
    correct: normalized.startsWith("yes"),
    answer: normalized,
  };
}

async function callGroq(imageBase64, prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_DRAW_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 10,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Groq returned ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

module.exports = { checkDrawing };
