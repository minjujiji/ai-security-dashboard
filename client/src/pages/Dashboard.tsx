import { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import jsPDF from "jspdf";

interface Summary {
  totalEvents: number;
  totalAlerts: number;
  highAlerts: number;
  failedLogins: number;
  riskScore: number;
}

interface EventTypeData {
  event_type: string;
  count: string;
}

interface AlertSeverityData {
  severity: string;
  count: string;
}

interface RecentAlert {
  id: number;
  severity: string;
  message: string;
  ip_address: string;
  created_at: string;
}

interface RecentEvent {
  id: number;
  event_timestamp: string;
  event_type: string;
  ip_address: string;
  raw_log: string;
}

interface TopIP {
  ip_address: string;
  failed_attempts: string;
}

interface Recommendation {
  title: string;
  description: string;
  priority: string;
}

interface TimelineData {
  event_date: string;
  count: string;
}

interface AIAnalysisResult {
  severity: string;
  ruleSeverity: string;
  aiSeverity: string | null;
  riskScore: number;
  mainFinding: string;
  summary: string;
  suspiciousIps: string[];
  recommendedActions: string[];
  provider: string;
  model: string;
}

const severityBadge: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const riskColor = (score: number) =>
  score >= 70 ? "#dc2626" : score >= 40 ? "#ca8a04" : "#16a34a";

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverityData[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topIPs, setTopIPs] = useState<TopIP[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [securitySummary, setSecuritySummary] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await api.get("/api/logs/summary");
      const eventTypeResponse = await api.get("/api/logs/event-types");
      const alertSeverityResponse = await api.get("/api/logs/alert-severity");
      const recentAlertsResponse = await api.get("/api/logs/recent-alerts");
      const recentEventsResponse = await api.get("/api/logs/recent-events");
      const topIPsResponse = await api.get("/api/logs/top-attacking-ips");
      const recommendationsResponse = await api.get("/api/logs/recommendations");
      const timelineResponse = await api.get("/api/logs/event-timeline");
      const securitySummaryResponse = await api.get("/api/logs/security-summary");

      setEventTypes(eventTypeResponse.data);
      setSummary(response.data);
      setAlertSeverity(alertSeverityResponse.data);
      setRecentAlerts(recentAlertsResponse.data);
      setRecentEvents(recentEventsResponse.data);
      setTopIPs(topIPsResponse.data);
      setRecommendations(recommendationsResponse.data);
      setTimelineData(timelineResponse.data);
      setSecuritySummary(securitySummaryResponse.data.summary);
    };

    fetchSummary();
  }, []);

  const generateAIAnalysis = async () => {
  try {
    setAiLoading(true);

    const response = await api.get("/api/logs/ai-analysis");

    setAiAnalysis(response.data);
  } catch (error) {
    console.error(error);
    alert("AI analysis failed");
  } finally {
    setAiLoading(false);
  }
};

  const downloadReport = () => {
  if (!summary) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Security Analysis Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`Total Events: ${summary.totalEvents}`, 20, 40);
  doc.text(`Total Alerts: ${summary.totalAlerts}`, 20, 50);
  doc.text(`High Alerts: ${summary.highAlerts}`, 20, 60);
  doc.text(`Failed Logins: ${summary.failedLogins}`, 20, 70);
  doc.text(`Risk Score: ${summary.riskScore}/100`, 20, 80);

  doc.text("Recommendations:", 20, 100);

  recommendations.forEach((item, index) => {
    doc.text(
      `${index + 1}. ${item.title}`,
      20,
      115 + index * 10
    );
  });

  doc.save("security-report.pdf");
};

  if (!summary) {
    return <p>Loading dashboard...</p>;
  }

  return (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8 ml-64">
      <h1 className="text-3xl font-bold mb-6">
        Security Dashboard
      </h1>

      <button onClick={downloadReport} className="mb-6 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700">
        Download Security Report
      </button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Total Events</h3>
          <p className="text-3xl font-bold">
            {summary.totalEvents}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Total Alerts</h3>
          <p className="text-3xl font-bold">
            {summary.totalAlerts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">High Alerts</h3>
          <p className="text-3xl font-bold text-red-600">
            {summary.highAlerts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Failed Logins</h3>
          <p className="text-3xl font-bold">
            {summary.failedLogins}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Risk Score</h3>

          <p className={`text-3xl font-bold ${
              summary.riskScore >= 70
                ? "text-red-600"
                : summary.riskScore >= 40
                ? "text-yellow-600"
                : "text-green-600"
            }`}
            > {summary.riskScore}/100
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Overall Risk Gauge
        </h2>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={[{ name: "Risk", value: summary.riskScore, fill: riskColor(summary.riskScore) }]}
              startAngle={180}
              endAngle={0}
              cy="75%"
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" background cornerRadius={10} />
              <text
                x="50%"
                y="70%"
                textAnchor="middle"
                className="text-4xl font-bold"
                fill={riskColor(summary.riskScore)}
              >
                {summary.riskScore}/100
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Events by Type
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventTypes}>
              <XAxis dataKey="event_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Alerts by Severity
        </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertSeverity}>
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4"> Recent Security Alerts </h2>

          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border-l-4 border-red-500 pl-4 py-2"
              >
                <p className="font-semibold">{alert.message}</p>
                <p className="text-sm text-gray-500">
                  Severity: {alert.severity} | IP: {alert.ip_address}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            Recent Log Events
          </h2>

          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="border-b pb-3"
              >
                <p className="font-semibold">{event.event_type}</p>
                <p className="text-sm text-gray-500">
                  IP: {event.ip_address}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(event.event_timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Top Attacking IPs
        </h2>

        {topIPs.length > 0 && (
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topIPs.map((ip) => ({
                  ip: ip.ip_address,
                  failed: Number(ip.failed_attempts),
                }))}
              >
                <XAxis dataKey="ip" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="failed" name="Failed attempts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {topIPs.length === 0 ? (
        <p className="text-gray-500">
          No failed login activity detected.
        </p>
        ) : ( 
          <div className="space-y-4">
            {topIPs.map((ip) => (
              <div
                key={ip.ip_address}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-semibold">
                    {ip.ip_address}
                  </p>
                  <p className="text-sm text-gray-500">
                    Suspicious authentication activity
                  </p>
                </div>

                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  {ip.failed_attempts} failed attempts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Security Recommendations
        </h2>

        {recommendations.length === 0 ? (
          <p className="text-gray-500">
            No high-priority recommendations at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((item, index) => (
              <div
                key={index}
                className="border-l-4 border-red-500 pl-4 py-2"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
                <span className="inline-block mt-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                  {item.priority} Priority
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          Event Timeline
        </h2>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <XAxis
                dataKey="event_date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString()
                }
              />

              <YAxis />

              <Tooltip
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString()
                }
              />

              <Line
                type="monotone"
                dataKey="count"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          AI Security Analyst
        </h2>

        <p className="text-gray-500 mb-4">
          Gemini (via the FastAPI AI service) rates the threat level. The final severity is the higher of the AI rating and the rule-based rating.
        </p>

        <button
          onClick={generateAIAnalysis}
          disabled={aiLoading}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {aiLoading ? "Generating..." : "Generate AI Analysis"}
        </button>

        {aiAnalysis && (
          <div className="mt-6 space-y-4 text-gray-700 border-l-4 border-blue-500 pl-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  severityBadge[aiAnalysis.severity] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {aiAnalysis.severity} severity
              </span>
              <span className="text-xs text-gray-500">
                Rules: {aiAnalysis.ruleSeverity} | AI: {aiAnalysis.aiSeverity ?? "n/a"} |{" "}
                {aiAnalysis.provider} ({aiAnalysis.model})
              </span>
            </div>

            {aiAnalysis.mainFinding && (
              <p className="font-semibold">{aiAnalysis.mainFinding}</p>
            )}

            {aiAnalysis.summary && <p>{aiAnalysis.summary}</p>}

            {aiAnalysis.suspiciousIps.length > 0 && (
              <div>
                <p className="font-semibold">Suspicious IPs</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {aiAnalysis.suspiciousIps.map((ip) => (
                    <span
                      key={ip}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.recommendedActions.length > 0 && (
              <div>
                <p className="font-semibold">Recommended actions</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  {aiAnalysis.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h2 className="text-xl font-bold mb-4">
          AI Security Summary
        </h2>

        {securitySummary.length === 0 ? (
          <p className="text-gray-500">
            No security summary available.
          </p>
        ) : (
          <ul className="space-y-3">
            {securitySummary.map((item, index) => (
              <li
                key={index}
                className="border-l-4 border-blue-500 pl-4 text-gray-700"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

    </main>
  </div>
);
};

export default Dashboard;