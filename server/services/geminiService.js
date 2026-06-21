const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateSecurityAnalysis = async (securityData) => {
  const prompt = `
You are a cybersecurity analyst.

Analyze this security dashboard data and write a concise security summary.

Data:
${JSON.stringify(securityData, null, 2)}

Return:
1. Main finding
2. Risk level
3. Suspicious IPs
4. Recommended actions

Keep it clear and professional.
`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: prompt,
  });

  return response.text;
};

module.exports = {
  generateSecurityAnalysis,
};