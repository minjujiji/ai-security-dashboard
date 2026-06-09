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
        "http://localhost:5000/api/logs/alerts"
      );

      setAlerts(response.data);
    };

    fetchAlerts();
  }, []);

  return (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Security Alerts
      </h1>

      <table border={1}>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Message</th>
            <th>IP Address</th>
            <th>Created At</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{alert.severity}</td>
              <td>{alert.message}</td>
              <td>{alert.ip_address}</td>
              <td>{new Date(alert.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  </div>
  );
};

export default Alerts;