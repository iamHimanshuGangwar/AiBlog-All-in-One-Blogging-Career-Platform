import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./auth/LoginModal";
import SignupModal from "./auth/SignupModal";
import OTPModal from "./auth/OTPModal";

const AuthModal = () => {
  const { authModal, closeModal } = useAuth();

  if (!authModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
      >
        <motion.div
          key="auth-modal"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 z-10"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Modal Content */}
          {authModal === "login" && <LoginModal />}
          {authModal === "signup" && <SignupModal />}
          {authModal === "otp" && <OTPModal />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
