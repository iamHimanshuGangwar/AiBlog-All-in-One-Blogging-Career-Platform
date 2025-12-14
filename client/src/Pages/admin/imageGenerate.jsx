// client/src/pages/ImageGenerator.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Download,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const ImageGenerator = () => {
  const navigate = useNavigate();
  const { axios, token } = useAppContext();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [resolution, setResolution] = useState("1024x1024");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  /* ---------------- LOAD PROMPT HISTORY ---------------- */
  useEffect(() => {
    const stored = localStorage.getItem("imagePromptHistory");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  /* ---------------- GENERATE IMAGE ---------------- */
  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please describe the image you want");
      return;
    }

    setLoading(true);
    setImage(null);

    try {
      const { data } = await axios.post(
        "/api/ai/image/generate-image",
        { prompt, style, resolution },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data?.success || !data.imageUrl) {
        throw new Error("Image generation failed");
      }

      setImage(data.imageUrl);

      /* Save prompt history */
      const newHistory = [
        { prompt, style, resolution, image: data.imageUrl },
        ...history,
      ].slice(0, 10);

      setHistory(newHistory);
      localStorage.setItem(
        "imagePromptHistory",
        JSON.stringify(newHistory)
      );

      /* Optional: Save image to user profile */
      await axios.post(
        "/api/ai/image/save",
        { imageUrl: data.imageUrl, prompt, style, resolution },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});

      toast.success("Image generated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft />
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="text-purple-500" />
              AI Image Generator
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create stunning AI visuals instantly
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <form onSubmit={handleGenerate} className="space-y-4 mb-8">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cyberpunk city at night, ultra realistic"
            className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500"
          />

          <div className="grid sm:grid-cols-3 gap-4">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
            >
              <option value="realistic">Realistic</option>
              <option value="anime">Anime</option>
              <option value="logo">Logo</option>
            </select>

            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
            >
              <option value="512x512">512 × 512</option>
              <option value="1024x1024">1024 × 1024</option>
              <option value="2048x2048">2048 × 2048</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
              {loading ? "Creating…" : "Generate"}
            </button>
          </div>
        </form>

        {/* IMAGE PREVIEW */}
        <div className="relative aspect-video rounded-2xl border border-dashed bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden group">
          {loading ? (
            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
          ) : image ? (
            <>
              <img src={image} alt="Generated" className="object-contain w-full h-full" />
              <a
                href={image}
                download="ai-image.png"
                className="absolute bottom-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow opacity-0 group-hover:opacity-100"
              >
                <Download />
              </a>
            </>
          ) : (
            <div className="text-gray-400 text-center">
              <ImageIcon size={60} className="mx-auto mb-2 opacity-30" />
              No image generated yet
            </div>
          )}
        </div>

        {/* PROMPT HISTORY */}
        {history.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">Prompt History</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setStyle(item.style);
                    setResolution(item.resolution);
                    setImage(item.image);
                  }}
                  className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 hover:shadow text-left"
                >
                  <p className="font-medium truncate">{item.prompt}</p>
                  <p className="text-xs text-gray-500">
                    {item.style} • {item.resolution}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
