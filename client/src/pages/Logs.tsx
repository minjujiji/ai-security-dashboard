import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

interface LogEvent {
  id: number;
  event_timestamp: string;
  event_type: string;
  ip_address: string;
  raw_log: string;
}

const Logs = () => {
  const [events, setEvents] = useState<LogEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/logs/events`
      );

      setEvents(response.data);
    };

    fetchEvents();
  }, []);

  return (

    <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Security Log Events
      </h1>

        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-900 text-white">
                <tr>
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Event Type</th>
                <th className="p-3 text-left">IP Address</th>
                <th className="p-3 text-left">Raw Log</th>
                </tr>
            </thead>

            <tbody>
                {events.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                    {new Date(event.event_timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-medium">{event.event_type}</td>
                    <td className="p-3">{event.ip_address}</td>
                    <td className="p-3 text-sm text-gray-600">{event.raw_log}</td>
                </tr>
                ))}
            </tbody>
        </table>
    </main>
    </div>
  );
};

export default Logs;