const generateSecurityAnalysis = async (securityData) => {
  const prompt = `
You are a cybersecurity analyst.

Analyze the following security dashboard information and provide:

1. Main finding
2. Risk level
3. Suspicious IPs
4. Recommendations

Security Data:
${JSON.stringify(securityData, null, 2)}

Keep the answer professional and concise.
`;

  const response = await fetch(
    "http://localhost:11434/api/generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt,
        stream: false,
      }),
    }
  );

  const data = await response.json();

  return data.response;
};

module.exports = {
  generateSecurityAnalysis,
};