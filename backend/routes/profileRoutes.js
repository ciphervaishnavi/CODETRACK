// ================================
// PROFILE ROUTES
// ================================
// User profile management: handles, stats

const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../helpers/fileHelper');
const { fetchLeetCodeStats, fetchCodeforcesStats, fetchGitHubStats } = require('../services/platformService');

/**
 * GET /api/profile/:username
 * Fetch user's profile with handles and cached platform stats
 * Protected: requires valid JWT token
 */
router.get('/:username', async (req, res) => {
  try {
    // Check ownership
    if (req.user.username !== req.params.username) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: cannot view other user\s profile'
      });
    }

    const data = await readData();
    const user = data.users.find(u => u.username === req.params.username);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User "${req.params.username}" not found`
      });
    }

    const profile = user.profile || {
      platformHandles: {
        leetcode: null,
        codeforces: null,
        github: null,
        linkedin: null
      },
      platformStats: {
        leetcode: null,
        codeforces: null
      },
      lastStatsUpdate: null
    };

    res.json({
      success: true,
      profile: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * PATCH /api/profile/:username/handles
 * Update user's platform handles
 * Protected: requires valid JWT token
 */
router.patch('/:username/handles', async (req, res) => {
  try {
    // Check ownership
    if (req.user.username !== req.params.username) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: cannot update other user\s profile'
      });
    }

    const { leetcode, codeforces, github, linkedin, codechef } = req.body;
    const data = await readData();
    const userIndex = data.users.findIndex(u => u.username === req.params.username);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User "${req.params.username}" not found`
      });
    }

    // Initialize profile if not exists
    if (!data.users[userIndex].profile) {
      data.users[userIndex].profile = {
        platformHandles: {},
        platformStats: {},
        lastStatsUpdate: null
      };
    }

    // Update handles
    data.users[userIndex].profile.platformHandles = {
      leetcode: leetcode || null,
      codeforces: codeforces || null,
      github: github || null,
      linkedin: linkedin || null,
      codechef: codechef || null
    };

    await writeData(data);

    res.json({
      success: true,
      message: 'Handles updated successfully',
      profile: data.users[userIndex].profile
    });
  } catch (error) {
    console.error('Error updating handles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * GET /api/profile/:username/refresh-stats
 * Fetch and update platform stats from APIs
 * Protected: requires valid JWT token
 */
router.get('/:username/refresh-stats', async (req, res) => {
  try {
    // Check ownership
    if (req.user.username !== req.params.username) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const data = await readData();
    const userIndex = data.users.findIndex(u => u.username === req.params.username);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `User "${req.params.username}" not found`
      });
    }

    const user = data.users[userIndex];
    if (!user.profile) {
      user.profile = {
        platformHandles: {},
        platformStats: {},
        lastStatsUpdate: null
      };
    }

    const handles = user.profile.platformHandles;
    const stats = {};

    // Fetch LeetCode stats if handle exists
    if (handles.leetcode) {
      const lcStats = await fetchLeetCodeStats(handles.leetcode);
      if (lcStats) {
        stats.leetcode = lcStats;
      } else {
        stats.leetcode = { error: 'Handle not found or API error' };
      }
    }

    // Fetch Codeforces stats if handle exists
    if (handles.codeforces) {
      const cfStats = await fetchCodeforcesStats(handles.codeforces);
      if (cfStats) {
        stats.codeforces = cfStats;
      } else {
        stats.codeforces = { error: 'Handle not found or API error' };
      }
    }

    // Update user's platform stats
    user.profile.platformStats = stats;
    user.profile.lastStatsUpdate = new Date().toISOString();

    await writeData(data);

    res.json({
      success: true,
      message: 'Stats refreshed successfully',
      stats: stats,
      timestamp: user.profile.lastStatsUpdate
    });
  } catch (error) {
    console.error('Error refreshing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
