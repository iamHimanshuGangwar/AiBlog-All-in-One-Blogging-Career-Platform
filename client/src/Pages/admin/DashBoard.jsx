// client/src/pages/DashBoard.jsx
import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import BlogTable from "../../components/BlogTable";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const DashBoard = () => {
  const navigate = useNavigate();
  const { axios, token, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    blogs: 0,
    comments: 0,
    drafts: 0,
    jobApplications: 0,
    recentBlogs: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [blogRes, jobRes] = await Promise.all([
        axios.get("/api/admin/dashboard"),
        axios.get("/api/jobs/all-applications?status=pending"),
      ]);

      if (blogRes.data && blogRes.data.success && blogRes.data.dashboard) {
        const d = blogRes.data.dashboard;
        setDashboardData((prev) => ({
          ...prev,
          blogs: d.blogs || 0,
          comments: d.comments || 0,
          drafts: d.drafts || 0,
          recentBlogs: d.recentBlogs || [],
        }));
      }

      if (jobRes.data && jobRes.data.success) {
        setDashboardData((prev) => ({
          ...prev,
          jobApplications: jobRes.data.data?.length || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin and has token
  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!user?.isAdmin) {
      toast.error('Admin access required');
      navigate('/', { replace: true });
      return;
    }
  }, [token, user, navigate]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000); // Poll every 5 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Blogs", value: dashboardData.blogs, icon: assets.dashboard_icon_1 },
    { label: "Comments", value: dashboardData.comments, icon: assets.dashboard_icon_2 },
    { label: "Drafts", value: dashboardData.drafts, icon: assets.dashboard_icon_3 },
    { label: "Job Applications", value: dashboardData.jobApplications, icon: assets.dashboard_icon_1, isLink: true, link: "/admin/job-applications" },
  ];

  return (
    <div className="flex-1 p-6 md:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer border border-gray-100 dark:border-gray-700 ${
              stat.isLink ? "hover:bg-blue-50 dark:hover:bg-gray-700" : ""
            }`}
            onClick={() => stat.isLink && window.location.href && (window.location.href = stat.link)}
          >
            <img src={stat.icon} alt={stat.label} className="w-14 h-14" />
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- Latest Blogs Table --- */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 text-gray-900 dark:text-white">
          <img src={assets.dashboard_icon_4} alt="Latest Blogs" className="w-6 h-6" />
          <p className="font-bold text-xl">Latest Blogs</p>
        </div>
        <div className="overflow-x-auto rounded-2xl shadow-md scrollbar-hide bg-white dark:bg-gray-800">
          <table className="w-full text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 text-gray-800 dark:text-gray-300 text-left uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Blog Title</th>
                <th className="px-6 py-3 hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 hidden sm:table-cell">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {dashboardData.recentBlogs.length > 0 ? (
                dashboardData.recentBlogs.map((blog, index) => (
                  <BlogTable
                    key={blog._id}
                    blog={blog}
                    fetchBlogs={fetchDashboard}
                    index={index + 1}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">
                    No recent blogs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
