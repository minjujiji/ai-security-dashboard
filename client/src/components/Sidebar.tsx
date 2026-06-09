import { Link, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">
        ThreatWatch
      </h2>

      <nav className="flex flex-col gap-4">
        <Link to="/dashboard" className="hover:text-blue-400">
          Dashboard
        </Link>

        <Link to="/upload" className="hover:text-blue-400">
          Upload Logs
        </Link>

        <Link to="/logs" className="hover:text-blue-400">
          Log Events
        </Link>

        <Link to="/alerts" className="hover:text-blue-400">
          Alerts
        </Link>

        <button
          onClick={handleLogout}
          className="text-left hover:text-red-400 mt-8"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;