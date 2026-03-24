const express = require("express");
const path = require("path");
const questionRoutes = require("./routes/questions");
const statsRoutes = require("./routes/stats");
const bookmarkRoutes = require("./routes/bookmarks");
const portfolioRoutes = require("./routes/portfolio");
const userRoutes = require("./routes/userRoutes");  // NEW: JSON file storage
const questionRoutes2 = require("./routes/questionRoutes");  // NEW: Questions with JSON
const revisionRoutes = require("./routes/revisionRoutes");  // NEW: Revisions with JSON
const authRoutes = require("./routes/authRoutes");  // NEW: Authentication routes
const profileRoutes = require("./routes/profileRoutes");  // OLD: User profiles with platform handles
const profileRoutesNew = require("./routes/profileRoutesNew");  // ⭐ NEW: Clean profile system
const bookmarkRoutesNew = require("./routes/bookmarkRoutes");  // NEW: Bookmarks with JSON
const authMiddleware = require("./middlewares/authMiddleware");  // NEW: JWT verification

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());

// CORS Middleware - Allow cross-origin requests
app.use((req, res, next) => {
  // For development: allow localhost origins; for production, whitelist specific domains
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || NODE_ENV === 'development') {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Security Headers
app.use((req, res, next) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  // CSP: strict but allows same-origin and unsafe-inline for development
  res.header("Content-Security-Policy", "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com");
  // Prevent caching of HTML files to avoid serving stale versions
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

// Serve static files (CSS, JS, images) from the root directory
// Disable index file serving so our GET "/" route takes precedence
app.use(express.static(path.join(__dirname, '..'), {
  index: false  // Disable automatic index.html serving at /
}));

// Public Auth Routes (no authentication required)
app.use("/api/auth", authRoutes);

// ================================
// PUBLIC PLATFORM STATS ROUTES
// ================================
// These endpoints allow fetching public platform stats without authentication
const { fetchGitHubStats, fetchLeetCodeStats, fetchCodeforcesStats } = require("./services/platformService");

// GET /api/github/:username - Fetch GitHub stats
app.get("/api/github/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const stats = await fetchGitHubStats(username);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'GitHub user not found',
        username: username
      });
    }

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/leetcode/:username - Fetch LeetCode stats
app.get("/api/leetcode/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const stats = await fetchLeetCodeStats(username);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'LeetCode user not found',
        username: username
      });
    }

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching LeetCode stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/codeforces/:username - Fetch Codeforces stats
app.get("/api/codeforces/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const stats = await fetchCodeforcesStats(username);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Codeforces user not found',
        username: username
      });
    }

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error fetching Codeforces stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ================================
// PROFILE MANAGEMENT API (NEW - NO AUTH)
// ================================
// Clean, simple profile CRUD operations
app.use("/api/profiles", profileRoutesNew);

// ================================
// PROTECTED API ROUTES
// ================================
// All routes below require valid JWT token in Authorization header
app.use("/api", authMiddleware);  // Middleware to verify token for all routes below this line

app.use("/api", questionRoutes);
app.use("/api", statsRoutes);
app.use("/api", bookmarkRoutes);
app.use("/api", portfolioRoutes);
app.use("/api/user", userRoutes);  // User routes with JSON storage
app.use("/api/questions", questionRoutes2);  // Question routes with JSON
app.use("/api/revision", revisionRoutes);  // Revision routes with JSON
app.use("/api/profile", profileRoutes);  // Profile routes with platform handles
app.use("/api/bookmark", bookmarkRoutesNew);  // Bookmark routes with JSON

// Serve the main dashboard at root URL
// Note: Dashboard.html includes authGuard.js which checks authentication on client-side
app.get("/", (req, res) => {
  // Serve login page as the default landing page
  // Users will be redirected to dashboard after login via authGuard.js
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
