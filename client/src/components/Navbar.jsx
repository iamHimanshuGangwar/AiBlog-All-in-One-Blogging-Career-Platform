// client/src/components/Navbar.jsx
import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";

const Navbar = () => {
  const { token, user, theme, toggleTheme, setUser, setToken } = useAppContext();
  const { openLogin, openSignup } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const gradientNav = "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500";
  const hoverBg = "hover:bg-white/20";

  return (
    <>
      <nav className={`w-full ${gradientNav} shadow-md`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 text-white">

            {/* ===== LOGO + LEFT MENU ===== */}
            <div className="flex items-center gap-6">

              {/* LOGO */}
              <img
                onClick={() => navigate("/")}
                src={assets.logo}
                alt="logo"
                className="w-32 cursor-pointer"
              />

              {/* NAV BUTTONS */}
              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  navigate("/resume-builder");
                }}
                className="hidden sm:block px-3 py-1.5 rounded-full text-sm hover:bg-white/20 transition"
              >
                Resume Builder
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  navigate("/image-generator");
                }}
                className="hidden sm:block px-3 py-1.5 rounded-full text-sm hover:bg-white/20 transition"
              >
                AI Image Generator
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  navigate("/jobs");
                }}
                className="hidden sm:block px-3 py-1.5 rounded-full text-sm hover:bg-white/20 transition"
              >
                Jobs
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    openLogin();
                    return;
                  }
                  navigate("/blogs");
                }}
                className="hidden sm:block px-3 py-1.5 rounded-full text-sm hover:bg-white/20 transition"
              >
                Blogs
              </button>
            </div>

            {/* ===== RIGHT SIDE BUTTONS ===== */}
            <div className="flex items-center gap-4">

              {/* DARK / LIGHT MODE */}
              <button onClick={toggleTheme} className={`p-2 rounded-full ${hoverBg}`}>
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-300" />
                ) : (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>

              {/* LOGIN / SIGNUP / LOGOUT / DASHBOARD */}
              {!token ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={openLogin}
                    className="px-4 py-1.5 rounded-full bg-white text-purple-600 hover:bg-gray-100 text-sm font-medium"
                  >
                    Login
                  </button>

                  <button
                    onClick={openSignup}
                    className="px-4 py-1.5 rounded-full border border-white text-white hover:bg-white hover:text-purple-600 text-sm font-medium transition"
                  >
                    Signup
                  </button>
                </div>
              ) : user?.isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => navigate("/admin")}
                    className="px-4 py-1.5 rounded-full bg-green-500 text-white text-sm hover:bg-green-600 transition font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setToken(null);
                      setUser(null);
                      navigate("/");
                    }}
                    className="px-4 py-1.5 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => {
                      setToken(null);
                      setUser(null);
                      navigate("/");
                    }}
                    className="px-4 py-1.5 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition font-medium"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* ===== MOBILE MENU BUTTON ===== */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`p-2 rounded-md sm:hidden ${hoverBg}`}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileOpen && (
          <div className="md:hidden bg-white text-black px-4 py-4 space-y-3">
            <button
              onClick={() => { 
                if (!user) {
                  openLogin();
                  setMobileOpen(false);
                  return;
                }
                navigate("/resume-builder"); 
                setMobileOpen(false); 
              }}
              className="block w-full text-left py-2"
            >
              Resume Builder
            </button>
            <button
              onClick={() => { 
                if (!user) {
                  openLogin();
                  setMobileOpen(false);
                  return;
                }
                navigate("/image-generator"); 
                setMobileOpen(false); 
              }}
              className="block w-full text-left py-2"
            >
              AI Image Generator
            </button>
            <button
              onClick={() => { 
                if (!user) {
                  openLogin();
                  setMobileOpen(false);
                  return;
                }
                navigate("/jobs"); 
                setMobileOpen(false); 
              }}
              className="block w-full text-left py-2"
            >
              Jobs
            </button>
            <button
              onClick={() => { if (!user) { openLogin(); setMobileOpen(false); return; } navigate("/blogs"); setMobileOpen(false); }}
              className="block w-full text-left py-2"
            >
              Blogs
            </button>

            {!token ? (
              <>
                <button
                  onClick={() => { openLogin(); setMobileOpen(false); }}
                  className="block w-full text-left py-2 font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => { openSignup(); setMobileOpen(false); }}
                  className="block w-full text-left py-2 font-medium"
                >
                  Signup
                </button>
              </>
            ) : user?.isAdmin ? (
              <>
                <button
                  onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                  className="block w-full text-left py-2 text-green-500 font-semibold"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setToken(null); setUser(null); navigate("/"); setMobileOpen(false); }}
                  className="block w-full text-left py-2 text-red-500 font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { setToken(null); setUser(null); navigate("/"); setMobileOpen(false); }}
                className="block w-full text-left py-2 text-red-500 font-semibold"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
