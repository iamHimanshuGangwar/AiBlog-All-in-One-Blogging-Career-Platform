import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Loader, RefreshCw } from "lucide-react";

const JobApplications = () => {
  const { axios } = useAppContext();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [totalApplications, setTotalApplications] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    total: 0,
  });

  const fetchApplications = async (status = "pending") => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/jobs/all-applications", {
        params: { status: status || undefined },
      });

      if (data.success) {
        setApplications(data.data || []);
        
        // Fetch stats for all statuses
        const [pending, accepted, rejected] = await Promise.all([
          axios.get("/api/jobs/all-applications", { params: { status: "pending" } }),
          axios.get("/api/jobs/all-applications", { params: { status: "accepted" } }),
          axios.get("/api/jobs/all-applications", { params: { status: "rejected" } }),
        ]);

        setTotalApplications({
          pending: pending.data.data?.length || 0,
          accepted: accepted.data.data?.length || 0,
          rejected: rejected.data.data?.length || 0,
          total: (pending.data.data?.length || 0) + (accepted.data.data?.length || 0) + (rejected.data.data?.length || 0),
        });
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(filter);
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => fetchApplications(filter), 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleApprove = async (applicationId) => {
    try {
      const { data } = await axios.patch(`/api/jobs/approve/${applicationId}`);
      if (data.success) {
        toast.success("Application approved!");
        fetchApplications(filter);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (applicationId) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      const { data } = await axios.patch(`/api/jobs/reject/${applicationId}`, {
        reason: reason || "Application rejected",
      });
      if (data.success) {
        toast.success("Application rejected!");
        fetchApplications(filter);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "reviewed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage candidate applications</p>
        </div>
        <button
          onClick={() => fetchApplications(filter)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          title="Refresh applications"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Applications", value: totalApplications.total, color: "from-blue-500 to-indigo-500" },
          { label: "Pending", value: totalApplications.pending, color: "from-yellow-500 to-orange-500" },
          { label: "Approved", value: totalApplications.accepted, color: "from-green-500 to-emerald-500" },
          { label: "Rejected", value: totalApplications.rejected, color: "from-red-500 to-pink-500" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-600"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* --- Filter Tabs --- */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "accepted", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
              filter === status
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-md"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* --- Applications Table --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-blue-500" size={40} />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">No applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 text-gray-800 dark:text-gray-300 text-left uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Job</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {applications.map((app, idx) => (
                  <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{app.applicantName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">{app.applicantEmail}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{app.jobTitle}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{app.jobCompany}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {app.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(app._id)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-all"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(app._id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                            title="Reject"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{app.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
