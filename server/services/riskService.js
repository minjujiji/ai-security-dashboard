// Deterministic (rule-based) risk logic. The AI rating is combined with this,
// so the final severity never drops below what the rules already established.

const SEVERITY_ORDER = ["Low", "Medium", "High", "Critical"];

const computeRiskScore = (highAlerts, failedLogins) =>
  Math.min(Number(highAlerts) * 30 + Number(failedLogins) * 5, 100);

const severityFromScore = (score) => {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
};

const isSeverity = (value) => SEVERITY_ORDER.includes(value);

// Takes the more severe of the rule-based and AI ratings.
const combineSeverity = (ruleSeverity, aiSeverity) => {
  if (!isSeverity(aiSeverity)) return ruleSeverity;
  return SEVERITY_ORDER.indexOf(aiSeverity) > SEVERITY_ORDER.indexOf(ruleSeverity)
    ? aiSeverity
    : ruleSeverity;
};

module.exports = { computeRiskScore, severityFromScore, combineSeverity, isSeverity };
