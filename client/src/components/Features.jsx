import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Image, Briefcase, BookOpen, X } from "lucide-react";
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from "framer-motion";
import resumeImg from "../assets/resume.jpeg";
import imageImg from "../assets/image.jpeg";
import jobsImg from "../assets/jobs.jpeg";
import blogImg from "../assets/blog.jpeg";
import projectImg from "../assets/project.jpeg";
// ROUTES FOR EACH FEATURE
const routeMap = {
  resume: "/resume-builder",
  generator: "/image-generator",
  jobs: "/jobs",
  blog: "/blogs",
};

// ICONS
const iconMap = {
  resume: <FileText className="w-7 h-7 text-purple-600" />,
  generator: <Image className="w-7 h-7 text-purple-600" />,
  jobs: <Briefcase className="w-7 h-7 text-purple-600" />,
  blog: <BookOpen className="w-7 h-7 text-purple-600" />,
};

// IMAGE PATHS (imported from src/assets)
const previewImages = {
  resume: resumeImg,
  generator: imageImg,
  jobs: jobsImg,
  blog: blogImg,
};

const FeatureItem = ({ item, openModal, setHover }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      onMouseEnter={() => setHover(item)}
      onMouseLeave={() => setHover(null)}
      onClick={() => openModal(item)}
      className="group cursor-pointer flex items-start gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center shadow-inner">
        {iconMap[item.icon]}
      </div>
      <div>
        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
          {item.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {item.subtitle}
        </p>
        <p className="text-xs text-purple-600 mt-2 opacity-0 group-hover:opacity-100 transition-all">
          Click to preview
        </p>
      </div>
    </motion.div>
  );
};

const PreviewModal = ({ item, close }) => {
  const navigate = useNavigate();
  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
      >
        <motion.div
          key="modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-gray-900 w-full max-w-xl p-6 rounded-2xl shadow-2xl relative"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-black"
          >
            <X size={24} />
          </button>

          <motion.img
            layoutId={`feature-image-${item.icon}`}
            src={previewImages[item.icon]}
            alt={item.title}
            className="w-full h-64 object-cover rounded-xl shadow-md"
          />

          <h2 className="text-2xl font-bold mt-5 text-gray-900 dark:text-white">
            {item.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {item.subtitle}
          </p>

          {item.details && (
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              {item.details}
            </p>
          )}

          <button
            onClick={() => navigate(routeMap[item.icon])}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition"
          >
            Go to {item.title}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Features = () => {
  const [items, setItems] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [hoverData, setHoverData] = useState(null);
  const { user } = useAppContext();
  const { openLogin } = useAuth();

  const handleOpenModal = (item) => {
    if (!user) {
      toast.error('Please login to preview this feature')
      openLogin()
      return
    }
    setModalData(item)
  }

  useEffect(() => {
    setItems([
      {
        id: 1,
        icon: "resume",
        title: "Resume Builder",
        subtitle: "Build your personal brand with a powerful resume.",
        details:
          "Choose from modern AI‑generated resume templates and export them easily.",
      },
      {
        id: 2,
        icon: "generator",
        title: "AI Image Generator",
        subtitle: "Create jaw‑dropping AI images for your branding.",
        details:
          "Use AI to generate unique visuals for your projects and social feeds.",
      },
      {
        id: 3,
        icon: "jobs",
        title: "Jobs",
        subtitle: "Find perfect job matches and track applications.",
        details:
          "Get AI‑assisted recommendations and insights right to your dashboard.",
      },
      {
        id: 4,
        icon: "blog",
        title: "Blog",
        subtitle: "Create and publish stunning blog content.",
        details:
          "AI‑assisted writing tools help you craft posts fast and professionally.",
      },
    ]);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* LEFT SIDE */}
        <div>
          <p className="text-sm text-purple-600 font-semibold uppercase">
            Global Talent Network
          </p>

          {/* H4 Gradient Heading */}
          <h4 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-transparent bg-clip-text whitespace-nowrap">
            An all‑in‑one career platform fulfilling all your needs
          </h4>

          <div className="mt-10 space-y-5">
            {items.map((it) => (
              <FeatureItem
                key={it.id}
                item={it}
                openModal={handleOpenModal}
                setHover={setHoverData}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="bg-purple-100/60 dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-purple-200/50">
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl h-64 flex items-center justify-center overflow-hidden"
            layout
          >
            {hoverData ? (
              <motion.img
                key={hoverData.icon}
                layoutId={`feature-image-${hoverData.icon}`}
                src={previewImages[hoverData.icon]}
                alt={hoverData.title}
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
            ) : (
              <motion.img
                layoutId="feature-image-default"
                src={projectImg}
                alt="Project showcase"
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
            )}
          </motion.div>
        </div>
      </div>

      {modalData && (
        <PreviewModal item={modalData} close={() => setModalData(null)} />
      )}
    </section>
  );
};

export default Features;
