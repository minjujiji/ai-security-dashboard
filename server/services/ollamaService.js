const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Fallback LLM. Returns the raw JSON string produced by the model.
const generateSecurityAnalysis = async (securityData) => {
  const prompt = `
You are a SOC analyst. Analyze this aggregated security data.

Respond ONLY with JSON in exactly this shape:
{
  "severity": "Low" | "Medium" | "High" | "Critical",
  "main_finding": "one sentence",
  "summary": "2 to 4 sentences",
  "suspicious_ips": ["only IPs that appear in the data"],
  "recommended_actions": ["3 to 5 concrete steps"]
}

Data:
${JSON.stringify(securityData, null, 2)}
`;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama3.2", prompt, stream: false, format: "json" }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Ollama responded ${response.status}`);
  }

  const data = await response.json();
  return data.response;
};

module.exports = { generateSecurityAnalysis };
