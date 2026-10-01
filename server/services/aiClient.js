const ollama = require("./ollamaService");
const { isSeverity } = require("./riskService");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

// Primary path: Python FastAPI service (Gemini, structured JSON output).
const analyzeWithFastApi = async (payload) => {
  const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`AI service responded ${response.status}`);
  }
  return response.json();
};

// Fallback path: local Ollama model, asked for the same JSON shape.
const analyzeWithOllama = async (payload) => {
  const raw = await ollama.generateSecurityAnalysis(payload);
  try {
    const parsed = JSON.parse(raw);
    return {
      severity: isSeverity(parsed.severity) ? parsed.severity : undefined,
      main_finding: String(parsed.main_finding || ""),
      summary: String(parsed.summary || ""),
      suspicious_ips: Array.isArray(parsed.suspicious_ips) ? parsed.suspicious_ips : [],
      recommended_actions: Array.isArray(parsed.recommended_actions)
        ? parsed.recommended_actions
        : [],
      provider: "ollama",
      model: "llama3.2",
    };
  } catch {
    return {
      main_finding: "",
      summary: String(raw || ""),
      suspicious_ips: [],
      recommended_actions: [],
      provider: "ollama",
      model: "llama3.2",
    };
  }
};

const analyzeSecurityData = async (payload) => {
  try {
    return await analyzeWithFastApi(payload);
  } catch (primaryError) {
    console.warn("FastAPI AI service unavailable, falling back to Ollama:", primaryError.message);
    return analyzeWithOllama(payload);
  }
};

module.exports = { analyzeSecurityData };
