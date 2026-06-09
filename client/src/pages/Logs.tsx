import { useEffect, useState } from "react";
import axios from "axios";

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
        "http://localhost:5000/api/logs/events"
      );

      setEvents(response.data);
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <h1>Security Log Events</h1>

      <table border={1}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event Type</th>
            <th>IP Address</th>
            <th>Raw Log</th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                {new Date(
                  event.event_timestamp
                ).toLocaleString()}
              </td>
              <td>{event.event_type}</td>
              <td>{event.ip_address}</td>
              <td>{event.raw_log}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Logs;