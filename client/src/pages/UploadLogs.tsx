import { useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const UploadLogs = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please choose a log file first");
      return;
    }

    const formData = new FormData();
    formData.append("logfile", file);

    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">
          Upload Security Logs
        </h1>

        <p className="text-gray-500 mb-8">
          Upload .log or .txt files to analyze suspicious activity.
        </p>

        <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
          <form onSubmit={handleUpload}>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept=".log,.txt"
                className="hidden"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
              />

              <p className="text-lg font-medium">
                {file ? file.name : "Click to select a log file"}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Supported formats: .log, .txt
              </p>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload and Analyze"}
            </button>
          </form>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500">Filename</h3>
              <p className="font-bold break-all">
                {result.filename}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500">Total Events</h3>
              <p className="text-3xl font-bold">
                {result.totalEvents}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500">Total Alerts</h3>
              <p className="text-3xl font-bold text-red-600">
                {result.totalAlerts}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadLogs;