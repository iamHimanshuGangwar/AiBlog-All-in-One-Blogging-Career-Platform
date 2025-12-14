import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./configs/db.js";

// Routes
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import blogRouter from "./routes/blogRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import subscribeRouter from "./routes/subscribeRoutes.js";
import featureRouter from "./routes/featureRoutes.js";
import { subscribe as subscribeHandler, unsubscribe as unsubscribeHandler } from "./controllers/subscriberController.js";
import jobRouter from "./routes/jobRoutes.js";
import jobListingRouter from "./routes/jobListingRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for PDF downloads)
app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

// Connect to DB
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("Backend is running.");
});

// API Routes
app.use("/api/auth", authRouter);      // /api/auth/*
app.use("/api/admin", adminRouter);    // /api/admin/*
app.use("/api/add", blogRouter);       // /api/add/*
app.use("/api/image", imageRouter);    // /api/image/*
app.use("/api/ai", aiRouter);          // /api/ai/*
app.use("/api/subscribe", subscribeRouter); // /api/subscribe
app.use("/api/features", featureRouter); // /api/features
app.use("/api/jobs", jobRouter); // /api/jobs (applications)
app.use("/api/job-listings", jobListingRouter); // /api/job-listings (postings)

// Serve client build (if present) and add SPA fallback for non-API routes
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  // For any non-API route, serve the client's index.html so client-side router can handle it
  app.get('*', (req, res, next) => {
    if (req.path && req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Backup direct route in case router mounting fails or server wasn't restarted after deploys
app.post('/api/subscribe', express.json(), subscribeHandler);
app.get('/api/subscribe/unsubscribe', unsubscribeHandler);

// Ensure API routes always return JSON on 404 (avoid HTML error page breaking client JSON parsing)
app.use((req, res, next) => {
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
  }
  next();
});

// Global error handler (returns JSON for API errors)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err && err.stack ? err.stack : err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
  }
  next(err);
});

// Server Port
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
