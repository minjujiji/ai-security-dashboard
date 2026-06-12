import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, } from "recharts";

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

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverityData[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [topIPs, setTopIPs] = useState<TopIP[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await axios.get("http://localhost:5000/api/logs/summary");
      const eventTypeResponse = await axios.get( "http://localhost:5000/api/logs/event-types");
      const alertSeverityResponse = await axios.get("http://localhost:5000/api/logs/alert-severity");
      const recentAlertsResponse = await axios.get("http://localhost:5000/api/logs/recent-alerts");
      const recentEventsResponse = await axios.get("http://localhost:5000/api/logs/recent-events");
      const topIPsResponse = await axios.get("http://localhost:5000/api/logs/top-attacking-ips");
      const recommendationsResponse = await axios.get("http://localhost:5000/api/logs/recommendations");

      
      setEventTypes(eventTypeResponse.data);
      setSummary(response.data);
      setAlertSeverity(alertSeverityResponse.data);
      setRecentAlerts(recentAlertsResponse.data);
      setRecentEvents(recentEventsResponse.data);
      setTopIPs(topIPsResponse.data);
      setRecommendations(recommendationsResponse.data);
    };

    fetchSummary();
  }, []);

  if (!summary) {
    return <p>Loading dashboard...</p>;
  }

  return (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Security Dashboard
      </h1>

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


    </main>
  </div>
);
};

export default Dashboard;