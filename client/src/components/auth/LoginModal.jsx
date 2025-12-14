import React, { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const LoginModal = () => {
  const { axios, openSignup, closeModal } = useAuth();
  const { setToken, setUser } = useAppContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post("/auth/login", form);

      if (!data?.success) {
        return toast.error(data?.message || "Login failed");
      }

      setToken(data.token);
      setUser(data.user || null);
      toast.success("Login Successful!");

      closeModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
        Login
      </h2>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <input
            name="email"
            type="email"
            onChange={updateField}
            value={form.email}
            required
            placeholder="Enter email"
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <input
            name="password"
            type={showPass ? "text" : "password"}
            onChange={updateField}
            value={form.password}
            required
            placeholder="••••••"
            className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Show / Hide Password */}
          <span
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showPass ? <Eye size={20} /> : <EyeOff size={20} />}
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-700 dark:text-gray-300">
        Don't have an account?{" "}
        <span
          className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline font-semibold"
          onClick={openSignup}
        >
          Sign up
        </span>
      </p>

      <div className="border-t border-gray-300 dark:border-gray-600 mt-4 pt-4">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400 mb-3">Admin Login</p>
        <button
          onClick={() => {
            closeModal();
            navigate("/admin/login");
          }}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition"
        >
          Access Admin Panel
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
