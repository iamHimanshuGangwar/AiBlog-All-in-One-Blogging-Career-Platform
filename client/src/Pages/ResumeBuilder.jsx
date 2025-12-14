// client/src/pages/ResumeBuilder.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  Briefcase,
  Code,
  Download,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

/* ---------------- LIVE PREVIEW ---------------- */

const LiveResumePreview = ({ data, theme }) => {
  const bg = theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900";

  return (
    <div className={`h-full p-8 overflow-y-auto rounded-2xl shadow-2xl ${bg}`}>
      <header className="border-b pb-4 mb-4">
        <h1 className="text-3xl font-bold">{data.personal.fullName || "Your Name"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.personal.professionalTitle || "Professional Title"} • {data.personal.email} • {data.personal.phone}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-purple-600 mb-2">Summary</h2>
        <p className="text-sm leading-relaxed">
          {data.summary || "Write a short professional summary that highlights your strengths."}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-purple-600 mb-2">Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <p className="font-medium">{exp.jobTitle || "Job Title"} — {exp.company || "Company"}</p>
            <p className="text-xs text-gray-500 mb-1">{exp.startDate} - {exp.endDate}</p>
            <ul className="list-disc ml-5 text-sm space-y-1">
              {exp.achievements
                .split("\n")
                .filter(Boolean)
                .map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-purple-600 mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills.length ? data.skills.map((s, i) => (
            <span key={i} className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">{s}</span>
          )) : <p className="text-sm">Add your skills</p>}
        </div>
      </section>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { axios, token, theme } = useAppContext();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [resumeData, setResumeData] = useState({
    personal: { fullName: "", professionalTitle: "", phone: "", email: "", location: "" },
    summary: "",
    experience: [{ jobTitle: "", company: "", startDate: "", endDate: "Present", achievements: "" }],
    skills: [],
  });

  const updatePersonal = (k, v) =>
    setResumeData((p) => ({ ...p, personal: { ...p.personal, [k]: v } }));

  const updateExperience = (i, k, v) => {
    const copy = [...resumeData.experience];
    copy[i][k] = v;
    setResumeData((p) => ({ ...p, experience: copy }));
  };

  const addExperience = () =>
    setResumeData((p) => ({
      ...p,
      experience: [...p.experience, { jobTitle: "", company: "", startDate: "", endDate: "Present", achievements: "" }],
    }));

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/ai/resume/download",
        { resumeData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ BACKEND RETURNS FILE PATH / URL
      if (!res.data?.success || !res.data?.downloadUrl) {
        throw new Error("Invalid download response");
      }

      const baseURL = axios.defaults.baseURL || window.location.origin;
      const fileURL = res.data.downloadUrl.startsWith("http")
        ? res.data.downloadUrl
        : `${baseURL}${res.data.downloadUrl}`;

      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "resume.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Resume downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STEPS ---------------- */

  const steps = {
    1: (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><User /> Personal Info</h3>
        {[
          ["fullName", "Full Name"],
          ["professionalTitle", "Professional Title"],
          ["email", "Email"],
          ["phone", "Phone"],
          ["location", "Location"],
        ].map(([k, p]) => (
          <input
            key={k}
            placeholder={p}
            value={resumeData.personal[k]}
            onChange={(e) => updatePersonal(k, e.target.value)}
            className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-700"
          />
        ))}
      </div>
    ),

    2: (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Briefcase /> Experience</h3>
        {resumeData.experience.map((exp, i) => (
          <div key={i} className="p-4 border rounded-xl space-y-2 bg-gray-50 dark:bg-gray-700">
            <input placeholder="Job Title" value={exp.jobTitle} onChange={(e) => updateExperience(i, "jobTitle", e.target.value)} className="w-full p-2 border rounded" />
            <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <input placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} className="w-1/2 p-2 border rounded" />
              <input placeholder="End Date" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} className="w-1/2 p-2 border rounded" />
            </div>
            <textarea placeholder="Achievements (one per line)" value={exp.achievements} onChange={(e) => updateExperience(i, "achievements", e.target.value)} className="w-full p-2 border rounded" />
          </div>
        ))}
        <button onClick={addExperience} className="w-full py-2 border border-purple-500 text-purple-600 rounded-lg">+ Add Experience</button>
      </div>
    ),

    3: (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Code /> Summary & Skills</h3>
        <textarea
          rows={4}
          placeholder="Professional summary"
          value={resumeData.summary}
          onChange={(e) => setResumeData((p) => ({ ...p, summary: e.target.value }))}
          className="w-full p-3 border rounded-lg"
        />
        <input
          placeholder="Skills (comma separated)"
          value={resumeData.skills.join(", ")}
          onChange={(e) => setResumeData((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()) }))}
          className="w-full p-3 border rounded-lg"
        />
      </div>
    ),

    4: (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Download /> Download</h3>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg"
        >
          {loading ? "Generating PDF..." : "Download Resume"}
        </button>
      </div>
    ),
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-gray-100 dark:bg-gray-900">
      {/* FORM */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Go Back"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileText /> Resume Builder
          </h1>
        </div>
        {steps[step]}
        <div className="flex justify-between mt-8">
          <button disabled={step === 1} onClick={() => setStep(step - 1)} className="px-5 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2"><ChevronLeft /> Back</button>
          <button disabled={step === 4} onClick={() => setStep(step + 1)} className="px-5 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2">Next <ChevronRight /></button>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="sticky top-8 h-[90vh]">
        <LiveResumePreview data={resumeData} theme={theme} />
      </div>
    </div>
  );
};

export default ResumeBuilder;
