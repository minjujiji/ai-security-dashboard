import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Summary {
  totalEvents: number;
  totalAlerts: number;
  highAlerts: number;
  failedLogins: number;
}

const Dashboard = () => {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await axios.get(
        "http://localhost:5000/api/logs/summary"
      );

      setSummary(response.data);
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>
    </main>
  </div>
  );
};

export default Dashboard;