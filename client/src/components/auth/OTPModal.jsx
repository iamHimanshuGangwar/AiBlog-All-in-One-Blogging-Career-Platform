import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const OTPModal = () => {
  const { axios, tempUserId, openLogin, closeOTP } = useAuth();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!tempUserId) {
      toast.error("No user ID found. Please register again.");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.post("/auth/verify-otp", {
        otp,
        userId: tempUserId,
      });

      if (!data?.success) {
        return toast.error(data?.message || "OTP verification failed");
      }

      toast.success("Account verified!");
      openLogin();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "OTP verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 w-full text-center">
      {/* Title */}
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
        Verify OTP
      </h2>

      {/* OTP Form */}
      <form onSubmit={submit} className="mt-6 space-y-5">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          className="w-full text-center text-lg tracking-widest py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter 6-digit OTP"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <p className="text-sm mt-4 text-gray-700 dark:text-gray-300">
        Already verified?{" "}
        <span
          className="text-blue-500 dark:text-blue-400 cursor-pointer hover:underline font-semibold"
          onClick={openLogin}
        >
          Login
        </span>
      </p>
    </div>
  );
};

export default OTPModal;
