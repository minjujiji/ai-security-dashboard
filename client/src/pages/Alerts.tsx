import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface Alert {
  id: number;
  severity: string;
  message: string;
  ip_address: string;
  created_at: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/logs/alerts`
      );

      setAlerts(response.data);
    };

    fetchAlerts();
  }, []);

  return (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8 ml-64">
      <h1 className="text-3xl font-bold mb-6">
        Security Alerts
      </h1>

      {alerts.length === 0 ? (
  <div className="bg-white p-6 rounded-lg shadow">
    <p className="text-gray-500">
      No security alerts found.
    </p>
  </div>
) : (
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
  <thead className="bg-gray-900 text-white">
    <tr>
      <th className="p-3 text-left">Severity</th>
      <th className="p-3 text-left">Message</th>
      <th className="p-3 text-left">IP Address</th>
      <th className="p-3 text-left">Created At</th>
    </tr>
  </thead>

  <tbody>
    {alerts.map((alert) => (
      <tr
        key={alert.id}
        className="border-b hover:bg-gray-50"
      >
        <td className="p-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              alert.severity === "High"
                ? "bg-red-100 text-red-700"
                : alert.severity === "Medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {alert.severity}
          </span>
        </td>

        <td className="p-3 font-medium">
          {alert.message}
        </td>

        <td className="p-3">
          {alert.ip_address}
        </td>

        <td className="p-3 text-sm text-gray-600">
          {new Date(alert.created_at).toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>
)}
    </main>
  </div>
  );
};

export default Alerts;