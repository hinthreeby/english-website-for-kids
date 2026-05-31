const env = require("../config/env");

/**
 * Check if a drawing matches a keyword using a vision AI model.
 *
 * Currently uses local Ollama (llava). To migrate to cloud:
 *   - Remote Ollama: change OLLAMA_URL in .env to your hosted instance
 *   - Cloud API: replace callOllama() with callOpenAI() / callClaude() etc.
 */
async function checkDrawing(imageBase64, keyword) {
  const prompt = `This is a drawing made by a young child. Be very generous and encouraging. Could this drawing possibly represent a "${keyword}" in any way — even if it is simple, rough, or abstract? If there is any resemblance at all, answer "yes". Only answer "no" if the drawing looks completely unrelated. Answer with only "yes" or "no".`;
  const raw = await callOllama(imageBase64, prompt);
  const normalized = raw.trim().toLowerCase();
  return {
    correct: normalized.startsWith("yes"),
    answer: normalized,
  };
}

async function callOllama(imageBase64, prompt) {
  const response = await fetch(`${env.OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL,
      prompt,
      images: [imageBase64],
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama returned ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.response ?? "";
}

module.exports = { checkDrawing };
