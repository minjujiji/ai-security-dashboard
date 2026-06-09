import { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const UploadLogs = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please choose a file first");
      return;
    }

    const formData = new FormData();
    formData.append("logfile", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/logs/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
      alert("File uploaded successfully");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  return (
  <div className="flex min-h-screen bg-gray-100">
    <Sidebar />

    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold mb-6">
        Upload Security Logs
      </h1>

      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept=".log,.txt"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
        />

        <button type="submit">
          Upload
        </button>
      </form>

      {result && (
        <div>
          <h2>Upload Result</h2>
          <p>Total Events: {result.totalEvents}</p>
          <p>Total Alerts: {result.totalAlerts}</p>
        </div>
      )}
    </main>
  </div>
  );
};

export default UploadLogs;