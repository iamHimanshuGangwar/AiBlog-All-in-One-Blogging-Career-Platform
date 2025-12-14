import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:4000";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [input, setInput] = useState("");
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenRef = useRef(null);

  // ----------------------
  // Token & Refresh Logic
  // ----------------------
  const setAuthToken = (newToken) => {
    setToken(newToken);
    tokenRef.current = newToken;
    if (newToken) {
      localStorage.setItem("token", newToken);
      axios.defaults.headers.common["Authorization"] = newToken;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const setAuthUser = (userObj) => {
    setUser(userObj || null);
    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
    } else {
      localStorage.removeItem("user");
    }
  };

  const refreshToken = async () => {
    try {
      // Use tokenRef to get the current token
      const currentToken = tokenRef.current || localStorage.getItem('token') || '';
      const headers = currentToken ? { Authorization: currentToken } : {};
      const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true, headers });
      if (data?.success && data?.token) {
        setAuthToken(data.token);
        if (data.user) setAuthUser(data.user);
        return data.token;
      } else {
        setAuthToken(null);
        setAuthUser(null);
        return null;
      }
    } catch (err) {
      console.error('Refresh token error:', err?.response?.data || err.message || err);
      setAuthToken(null);
      setAuthUser(null);
      return null;
    }
  };

  // ----------------------
  // Axios Interceptors
  // ----------------------
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = tokenRef.current || localStorage.getItem("token");
        if (currentToken) {
          config.headers.Authorization = currentToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers["Authorization"] = newToken;
            return axios(originalRequest);
          } else {
            toast.error("Session expired. Please login again.");
          }
        }
        // Only log errors, don't show toast for every error on initial load
        // This prevents network error popups on page refresh

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // ----------------------
  // Fetch Blogs
  // ----------------------
  const fetchBlogs = async (showError = false) => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/add/all");
      if (data.success) setBlogs(data.blogs);
      else if (showError) toast.error(data.message);
    } catch (err) {
      if (showError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Theme Toggle
  // ----------------------
  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  // ----------------------
  // Initial Load
  // ----------------------
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[APP CONTEXT] Initializing auth from localStorage');
      
      // Restore token
      const storedToken = localStorage.getItem("token");
      if (storedToken && storedToken !== "undefined") {
        const cleanToken = storedToken.replace(/^"+|"+$/g, "");
        console.log('[APP CONTEXT] Token restored from localStorage');
        setAuthToken(cleanToken);
      }

      // Restore user
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined") {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('[APP CONTEXT] User restored from localStorage:', parsedUser.email);
          setAuthUser(parsedUser);
        } catch (err) {
          console.warn('[APP CONTEXT] Failed to parse stored user:', err.message);
          localStorage.removeItem("user");
        }
      }

      // Restore theme
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");

      // Fetch blogs silently on initial load (don't show errors)
      fetchBlogs(false);

      // Mark as initialized
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const value = {
    axios,
    token,
    user,
    setToken: setAuthToken,
    setUser: setAuthUser,
    blogs,
    setBlogs,
    input,
    setInput,
    theme,
    toggleTheme,
    fetchBlogs,
    loading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
