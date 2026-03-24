// ================================
// CLEAN PROFILE API ROUTES
// ================================
// Simple, functional profile management
// No authentication - just pure CRUD operations

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const PROFILES_FILE = path.join(__dirname, '../data/profiles.json');

// ================================
// HELPER FUNCTIONS
// ================================

// Read profiles from file
async function readProfiles() {
  try {
    const data = await fs.readFile(PROFILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading profiles:', error);
    return { profiles: [] };
  }
}

// Write profiles to file
async function writeProfiles(data) {
  try {
    await fs.writeFile(PROFILES_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing profiles:', error);
    return false;
  }
}

// Find profile by ID
function findProfileById(profiles, id) {
  return profiles.find(p => p.id === id);
}

// Validate profile data
function validateProfileData(data) {
  if (!data.name || data.name.trim() === '') {
    return { valid: false, error: 'Name is required' };
  }

  // At least one platform username required
  if (!data.github && !data.leetcode && !data.codeforces) {
    return { valid: false, error: 'At least one platform username is required' };
  }

  return { valid: true };
}

// ================================
// API ROUTES
// ================================

/**
 * POST /api/profiles
 * Create a new profile
 * Body: { name, github, leetcode, codeforces, linkedin }
 */
router.post('/', async (req, res) => {
  try {
    const { name, github, leetcode, codeforces, linkedin } = req.body;

    console.log('📝 Creating new profile:', { name, github, leetcode, codeforces });

    // Validate
    const validation = validateProfileData({ name, github, leetcode, codeforces });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Read existing profiles
    const data = await readProfiles();

    // Create new profile
    const newProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      github: github?.trim() || null,
      leetcode: leetcode?.trim() || null,
      codeforces: codeforces?.trim() || null,
      linkedin: linkedin?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to profiles
    data.profiles.push(newProfile);

    // Save
    const saved = await writeProfiles(data);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save profile'
      });
    }

    console.log('✅ Profile created:', newProfile.id);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    });

  } catch (error) {
    console.error('❌ Error creating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * GET /api/profiles/:id
 * Get profile by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Fetching profile:', id);

    // Read profiles
    const data = await readProfiles();

    // Find profile
    const profile = findProfileById(data.profiles, id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    console.log('✅ Profile found:', profile.name);

    res.json({
      success: true,
      profile: profile
    });

  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * PUT /api/profiles/:id
 * Update profile
 * Body: { name, github, leetcode, codeforces, linkedin }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, github, leetcode, codeforces, linkedin } = req.body;

    console.log('✏️ Updating profile:', id);

    // Validate
    const validation = validateProfileData({ name, github, leetcode, codeforces });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Read profiles
    const data = await readProfiles();

    // Find profile index
    const profileIndex = data.profiles.findIndex(p => p.id === id);

    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update profile
    data.profiles[profileIndex] = {
      ...data.profiles[profileIndex],
      name: name.trim(),
      github: github?.trim() || null,
      leetcode: leetcode?.trim() || null,
      codeforces: codeforces?.trim() || null,
      linkedin: linkedin?.trim() || null,
      updatedAt: new Date().toISOString()
    };

    // Save
    const saved = await writeProfiles(data);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    console.log('✅ Profile updated:', id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: data.profiles[profileIndex]
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete profile
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting profile:', id);

    // Read profiles
    const data = await readProfiles();

    // Find profile index
    const profileIndex = data.profiles.findIndex(p => p.id === id);

    if (profileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Remove profile
    data.profiles.splice(profileIndex, 1);

    // Save
    const saved = await writeProfiles(data);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete profile'
      });
    }

    console.log('✅ Profile deleted:', id);

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * GET /api/profiles
 * Get all profiles (optional - for debugging)
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all profiles');

    const data = await readProfiles();

    res.json({
      success: true,
      profiles: data.profiles,
      count: data.profiles.length
    });

  } catch (error) {
    console.error('❌ Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
