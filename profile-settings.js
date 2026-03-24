// ================================
// Profile Settings Manager
// ================================

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

// Get user profile from API (NEW SYSTEM)
let USER_PROFILE = null;
let USERNAME = null;
let PROFILE_ID = null;

async function loadUserProfile() {
  try {
    // Get profile ID from localStorage
    PROFILE_ID = localStorage.getItem('profileId');

    if (!PROFILE_ID) {
      throw new Error('No profile ID found');
    }

    console.log('📋 Fetching profile from API:', PROFILE_ID);

    // Fetch profile from API
    const response = await fetch(`${BASE_URL}/profiles/${PROFILE_ID}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to load profile');
    }

    USER_PROFILE = result.profile;
    USERNAME = USER_PROFILE.name;

    console.log('✅ Profile loaded from API:', USER_PROFILE);

    return true;
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
    alert('No profile found. Please set up your profile first.');
    window.location.href = 'index.html';
    return false;
  }
}

// Load profile on startup
let profileLoadPromise = loadUserProfile();

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  }
}

// Load current profile from API
async function loadProfile() {
  try {
    // Wait for profile to load
    await profileLoadPromise;

    console.log('📋 Populating form with profile data...');

    if (!USER_PROFILE) {
      showMessage('⚠️ No profile found', 'error');
      return;
    }

    // Populate form with existing data
    document.getElementById('leetcode').value = USER_PROFILE.leetcode || '';
    document.getElementById('codeforces').value = USER_PROFILE.codeforces || '';
    document.getElementById('github').value = USER_PROFILE.github || '';
    document.getElementById('linkedin').value = USER_PROFILE.linkedin || '';

    console.log('✅ Form populated');

    // Fetch and display real-time stats
    fetchAndDisplayStats();
  } catch (error) {
    console.error('Error loading profile:', error);
    showMessage('⚠️ Could not load profile: ' + error.message, 'error');
  }
}

// Fetch and display real platform stats
async function fetchAndDisplayStats() {
  try {
    console.log('📊 Fetching platform stats...');

    const stats = {};

    // Fetch GitHub stats
    if (USER_PROFILE.github) {
      const ghResponse = await fetch(`${BASE_URL}/github/${USER_PROFILE.github}`);
      if (ghResponse.ok) {
        stats.github = await ghResponse.json();
        console.log('✅ GitHub stats:', stats.github);
      }
    }

    // Fetch LeetCode stats
    if (USER_PROFILE.leetcode) {
      const lcResponse = await fetch(`${BASE_URL}/leetcode/${USER_PROFILE.leetcode}`);
      if (lcResponse.ok) {
        stats.leetcode = await lcResponse.json();
        console.log('✅ LeetCode stats:', stats.leetcode);
      }
    }

    // Fetch Codeforces stats
    if (USER_PROFILE.codeforces) {
      const cfResponse = await fetch(`${BASE_URL}/codeforces/${USER_PROFILE.codeforces}`);
      if (cfResponse.ok) {
        stats.codeforces = await cfResponse.json();
        console.log('✅ Codeforces stats:', stats.codeforces);
      }
    }

    // Display stats
    showStats(stats);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
  }
}

function showStats(stats) {
  const statsGrid = document.getElementById('statsGrid');
  if (!stats || Object.keys(stats).length === 0) return;

  // LeetCode stats
  if (stats.leetcode && stats.leetcode.solved !== undefined) {
    document.getElementById('lcSolved').textContent = stats.leetcode.solved || 0;
    document.getElementById('lcEasy').textContent = stats.leetcode.easy || 0;
  }

  // Codeforces stats
  if (stats.codeforces && stats.codeforces.rating !== undefined) {
    document.getElementById('cfRating').textContent = stats.codeforces.rating || 0;
    document.getElementById('cfSolved').textContent = stats.codeforces.solvedCount || 0;
  }

  // Show stats grid
  statsGrid.style.display = 'grid';
}

// Save handles to API
async function saveHandles() {
  try {
    const leetcode = document.getElementById('leetcode').value.trim();
    const codeforces = document.getElementById('codeforces').value.trim();
    const github = document.getElementById('github').value.trim();
    const linkedin = document.getElementById('linkedin').value.trim();

    if (!leetcode && !codeforces && !github && !linkedin) {
      showMessage('⚠️ Please add at least one platform handle', 'error');
      return;
    }

    console.log('💾 Updating profile via API...');

    // Update via API
    const response = await fetch(`${BASE_URL}/profiles/${PROFILE_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: USERNAME, // Keep existing name
        leetcode: leetcode || null,
        codeforces: codeforces || null,
        github: github || null,
        linkedin: linkedin || null
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update profile');
    }

    // Update local USER_PROFILE
    USER_PROFILE = result.profile;

    showMessage('✅ Profiles saved successfully!', 'success');
    console.log('✅ Profile updated:', result.profile);

    // Fetch and display updated stats
    fetchAndDisplayStats();

  } catch (error) {
    console.error('Error saving handles:', error);
    showMessage('❌ Error: ' + error.message, 'error');
  }
}

// Refresh stats - fetch latest platform data
async function refreshStats() {
  try {
    const loading = document.querySelector('.loading');
    if (loading) loading.classList.add('active');

    console.log('🔄 Refreshing stats...');

    // Fetch fresh stats
    await fetchAndDisplayStats();

    showMessage('✅ Stats refreshed!', 'success');
    console.log('✅ Stats updated');

  } catch (error) {
    console.error('Error refreshing stats:', error);
    showMessage('❌ Error refreshing stats: ' + error.message, 'error');
  } finally {
    const loading = document.querySelector('.loading');
    if (loading) loading.classList.remove('active');
  }
}

// Go back to dashboard
function goBack() {
  window.location.href = 'dashboard-modern.html';
}

// Load profile on page load
document.addEventListener('DOMContentLoaded', loadProfile);

// Global functions for onclick handlers
window.saveHandles = saveHandles;
window.refreshStats = refreshStats;
window.goBack = goBack;
