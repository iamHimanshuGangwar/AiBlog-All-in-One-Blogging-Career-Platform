// client/src/pages/JobSearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Briefcase,
  Send,
  DollarSign,
  ArrowLeft,
  X,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const JobSearchPage = () => {
  const navigate = useNavigate();
  const { token, user, axios } = useAppContext();
  const { openLogin } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);

  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    resume: null,
  });

  // Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/job-listings/all-jobs");
        
        if (response.data.success) {
          const jobsList = response.data.data || [];
          setJobs(jobsList);
          
          // Extract unique industries
          const uniqueIndustries = [...new Set(jobsList.map(job => job.industry))];
          setIndustries(uniqueIndustries);
        }
      } catch (error) {
        console.error("Fetch jobs error:", error);
        // Don't show error toast, just log it
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [axios]);

  // Initialize form with user data if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }

    const stored = localStorage.getItem("appliedJobs");
    if (stored) setAppliedJobs(JSON.parse(stored));
  }, [user]);

  const applyFilters = useCallback(() => {
    const results = jobs.filter((job) => {
      const titleMatch = job.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const locationMatch = job.location
        .toLowerCase()
        .includes(locationFilter.toLowerCase());
      const industryMatch =
        industryFilter === "All" || job.industry === industryFilter;
      return titleMatch && locationMatch && industryMatch;
    });

    setFilteredJobs(results);
  }, [jobs, searchQuery, locationFilter, industryFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleApplyClick = (job) => {
    if (!token) {
      toast.error("Please login to apply");
      openLogin();
      return;
    }

    if (appliedJobs.includes(job._id)) {
      toast.error("You already applied for this job");
      return;
    }

    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.resume) {
      toast.error("Please complete all required fields");
      return;
    }

    // File validation
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const fileName = form.resume.name.toLowerCase();
    const isValid = allowedTypes.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      toast.error("Resume must be a PDF, DOC, or DOCX file");
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (form.resume.size > maxSize) {
      toast.error("Resume must be less than 5MB");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData with all required fields
      const formData = new FormData();
      formData.append("jobId", selectedJob._id);
      formData.append("jobTitle", selectedJob.title);
      formData.append("jobCompany", selectedJob.company);
      formData.append("applicantName", form.name);
      formData.append("applicantEmail", form.email);
      formData.append("coverLetter", form.coverLetter || "");
      formData.append("resume", form.resume);

      console.log('[JOB APPLICATION] Submitting to backend:', {
        jobId: selectedJob._id,
        jobTitle: selectedJob.title,
        jobCompany: selectedJob.company,
        applicantName: form.name,
        applicantEmail: form.email,
      });

      // Call backend API
      const { data } = await axios.post("/api/jobs/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        // Track applied job locally
        const updated = [...appliedJobs, selectedJob._id];
        setAppliedJobs(updated);
        localStorage.setItem("appliedJobs", JSON.stringify(updated));

        toast.success("Application submitted successfully! 🎉");
        setIsModalOpen(false);
        
        // Reset form
        setForm({
          name: user?.name || "",
          email: user?.email || "",
          phone: "",
          coverLetter: "",
          resume: null,
        });
      } else {
        toast.error(data.message || "Failed to submit application");
      }
    } catch (err) {
      console.error('[JOB APPLICATION] Error:', err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to submit application";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Job Portal
          </h1>
          <div className="ml-auto">
            <button
              onClick={async () => {
                if (!token) {
                  toast.error("Please login to view applications");
                  openLogin();
                  return;
                }
                setIsAppsModalOpen(true);
                // fetch applications when opening
                try {
                  setMyAppsLoading(true);
                  const res = await axios.get("/api/jobs/my-applications");
                  if (res.data && res.data.success) {
                    setMyApplications(res.data.data || []);
                  } else {
                    toast.error(res.data?.message || "Failed to fetch applications");
                  }
                } catch (err) {
                  const msg = err.response?.data?.message || err.message || "Failed to fetch applications";
                  toast.error(msg);
                } finally {
                  setMyAppsLoading(false);
                }
              }}
              className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              My Applications ({myApplications.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
          <input
            type="text"
            placeholder="Search job title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="p-3 rounded-xl border dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="All">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Results Info */}
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          Found {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No jobs found matching your criteria</p>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* Job Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {job.company}
                    </p>
                  </div>
                  {appliedJobs.includes(job._id) && (
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                      Applied
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.jobType}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Industry: {job.industry}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Apply Button */}
                <button
                  onClick={() => handleApplyClick(job)}
                  disabled={appliedJobs.includes(job._id)}
                  className={`w-full py-2 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                    appliedJobs.includes(job._id)
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {appliedJobs.includes(job._id) ? "Applied" : "Apply Now"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* My Applications Modal */}
        {isAppsModalOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Applications ({myApplications.length})</h2>
                <button onClick={() => setIsAppsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {myAppsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : myApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">You have not applied to any jobs yet.</div>
                ) : (
                  <div className="space-y-4">
                    {myApplications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{app.jobTitle}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">{app.jobCompany}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Applied: {new Date(app.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : app.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300'}`}>{app.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application Modal */}
        {isModalOpen && selectedJob && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedJob.title}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400">
                    {selectedJob.company}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    name="coverLetter"
                    value={form.coverLetter}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Upload Resume (PDF, DOC, DOCX) *
                  </label>
                  <input
                    type="file"
                    name="resume"
                    onChange={handleFormChange}
                    accept=".pdf,.doc,.docx"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearchPage;
