// ================================
// CodeTrack Dashboard JavaScript
// Connected to JSON File Storage API
// ================================

// ================================
// CONFIGURATION & SETUP
// ================================

// Dynamic API URL - works locally and on deployment
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

console.log('🌐 API Base URL:', BASE_URL);

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
    console.log('👤 Username:', USERNAME);

    return true;
  } catch (error) {
    console.error('❌ Error loading user profile:', error);
    console.warn('⚠️ Redirecting to profile setup...');
    alert('No profile found. Please set up your profile first.');
    window.location.href = 'index.html';
    return false;
  }
}

// Load profile on startup (async - will be awaited in DOMContentLoaded)
let profileLoadPromise = loadUserProfile();

// Helper function to get auth headers
function getAuthHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// Get platform username
function getPlatformUsername(platform) {
  if (!USER_PROFILE) return null;
  return USER_PROFILE[platform.toLowerCase()] || null;
}

console.log('Dashboard loaded successfully!');
console.log('API URL:', BASE_URL);
console.log('User Profile:', USER_PROFILE);

// ================================
// INITIALIZE DASHBOARD
// ================================

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async function() {
  // Wait for profile to load from API
  await profileLoadPromise;

  // Now load dashboard data
  loadDashboardData();
  initProgressChart();
});

// ================================
// PLATFORM STATS API FUNCTIONS
// ================================

// Fetch GitHub stats
async function fetchGitHubStats(username) {
  if (!username) {
    console.warn('⚠️ GitHub username not set');
    return null;
  }

  try {
    console.log(`🐙 Fetching GitHub stats for ${username}...`);
    const response = await fetch(`${BASE_URL}/github/${username}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ GitHub stats fetched:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching GitHub stats:', error.message);
    return null;
  }
}

// Fetch LeetCode stats
async function fetchLeetCodeStats(username) {
  if (!username) {
    console.warn('⚠️ LeetCode username not set');
    return null;
  }

  try {
    console.log(`💻 Fetching LeetCode stats for ${username}...`);
    const response = await fetch(`${BASE_URL}/leetcode/${username}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ LeetCode stats fetched:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching LeetCode stats:', error.message);
    return null;
  }
}

// Fetch Codeforces stats
async function fetchCodeforcesStats(username) {
  if (!username) {
    console.warn('⚠️ Codeforces username not set');
    return null;
  }

  try {
    console.log(`🚀 Fetching Codeforces stats for ${username}...`);
    const response = await fetch(`${BASE_URL}/codeforces/${username}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Codeforces stats fetched:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching Codeforces stats:', error.message);
    return null;
  }
}

// Fetch all platform stats
async function fetchAllPlatformStats() {
  console.log('📊 Fetching all platform stats...');

  const [gitHub, leetCode, codeforces] = await Promise.all([
    fetchGitHubStats(USER_PROFILE?.github),
    fetchLeetCodeStats(USER_PROFILE?.leetcode),
    fetchCodeforcesStats(USER_PROFILE?.codeforces)
  ]);

  return {
    github: gitHub,
    leetcode: leetCode,
    codeforces: codeforces
  };
}

// ================================
// API FUNCTIONS (JSON Storage)
// ================================

// Fetch questions for a user
async function fetchQuestions(username) {
  try {
    console.log(`📚 Fetching questions for ${username}...`);
    const response = await fetch(`${BASE_URL}/questions/${username}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('⚠️ Authentication failed');
        window.location.href = 'login.html';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API returned error:', data.message);
      throw new Error(data.message || 'Failed to fetch questions');
    }

    console.log('✅ Questions received:', data);
    return data;

  } catch (error) {
    console.error('❌ Error fetching questions:', error.message);
    return null;
  }
}

// Fetch revisions for a user
async function fetchRevisions(username) {
  try {
    console.log(`📋 Fetching revisions for ${username}...`);
    const response = await fetch(`${BASE_URL}/revision/${username}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('⚠️ Authentication failed');
        window.location.href = 'login.html';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API returned error:', data.message);
      throw new Error(data.message || 'Failed to fetch revisions');
    }

    console.log('✅ Revisions received:', data);
    return data;

  } catch (error) {
    console.error('❌ Error fetching revisions:', error.message);
    return null;
  }
}

// Add a new question
async function addNewQuestion(name, topic, difficulty) {
  try {
    const payload = {
      username: USERNAME,
      name: name.trim(),
      topic: topic.trim().toLowerCase(),
      difficulty: difficulty.trim().toLowerCase()
    };

    console.log('📤 Adding new question:', payload);

    const response = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add question');
    }

    console.log('✅ Question added:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error adding question:', error.message);
    return { success: false, message: error.message };
  }
}

// Mark revision complete
async function markComplete(questionId, revisionType) {
  try {
    const payload = { revisionType };
    
    console.log(`✏️ Marking revision complete:`, { questionId, revisionType });

    const response = await fetch(`${BASE_URL}/revision/${USERNAME}/${questionId}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to mark revision complete');
    }

    console.log('✅ Revision marked complete:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error marking complete:', error.message);
    return { success: false, message: error.message };
  }
}

// ================================
// UI UPDATE FUNCTIONS
// ================================

// Update metric cards
function updateMetricCards(questionsData, revisionsData, platformStats) {
  // PRIORITY: Show LeetCode stats if available
  if (platformStats && platformStats.leetcode && !platformStats.leetcode.error) {
    const solved = platformStats.leetcode.solved || 0;
    const easy = platformStats.leetcode.easy || 0;
    const medium = platformStats.leetcode.medium || 0;
    const hard = platformStats.leetcode.hard || 0;

    // Update Total Solved from LeetCode
    const solvedEl = document.getElementById('metricSolved');
    const easyEl = document.getElementById('metricEasy');
    const mediumEl = document.getElementById('metricMedium');
    const hardEl = document.getElementById('metricHard');

    if (solvedEl) solvedEl.textContent = solved;
    if (easyEl) easyEl.textContent = `E: ${easy}`;
    if (mediumEl) mediumEl.textContent = `M: ${medium}`;
    if (hardEl) hardEl.textContent = `H: ${hard}`;

    console.log('✅ Updated metrics with LeetCode stats:', {solved, easy, medium, hard});
  } else if (questionsData) {
    // Fallback: Show internal CodeTrack questions if LeetCode not available
    const { totalQuestions, stats } = questionsData;
    const metricCards = document.querySelectorAll('.metric-card');

    if (metricCards[0]) {
      const valueEl = metricCards[0].querySelector('.metric-value');
      if (valueEl) valueEl.textContent = totalQuestions || 0;
      console.log('✅ Updated metrics with internal questions:', totalQuestions);
    }
  }

  // Update revision progress if available
  if (revisionsData && revisionsData.summary) {
    const revSummary = revisionsData.summary;
    const dueToday = revSummary.dueToday || 0;
    const completed = revSummary.completed || 0;
    const upcoming = revSummary.upcoming || 0;
    const total = completed + upcoming + dueToday;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const metricCards = document.querySelectorAll('.metric-card');
    if (metricCards[1]) {
      const valueEl = metricCards[1].querySelector('.metric-value');
      const metaEl = metricCards[1].querySelector('.metric-meta');
      if (valueEl) valueEl.textContent = percent + '%';
      if (metaEl) metaEl.textContent = `${dueToday} due today`;
    }
  }
}

// Update difficulty breakdown
function updateDifficultyBreakdown(stats) {
  if (!stats) return;

  const easy = stats.easy || 0;
  const medium = stats.medium || 0;
  const hard = stats.hard || 0;
  const total = easy + medium + hard || 1;

  // Update circles
  const circles = document.querySelectorAll('.difficulty-circle span');
  if (circles.length >= 3) {
    circles[0].textContent = easy;
    circles[1].textContent = medium;
    circles[2].textContent = hard;
  }

  // Update percentages
  const percents = document.querySelectorAll('.label-percent');
  if (percents.length >= 3) {
    percents[0].textContent = Math.round((easy / total) * 100) + '%';
    percents[1].textContent = Math.round((medium / total) * 100) + '%';
    percents[2].textContent = Math.round((hard / total) * 100) + '%';
  }
}

// Update revisions list
function updateRevisionsList(revisionsData) {
  const listEl = document.querySelector('.revisions-list');
  if (!listEl || !revisionsData) return;

  // Clear existing items
  listEl.innerHTML = '';

  // Get items to show - dueToday has priority, then upcoming
  const itemsTodraw = [];
  
  // Add due today items first
  if (revisionsData.dueToday && Array.isArray(revisionsData.dueToday)) {
    itemsTodraw.push(...revisionsData.dueToday.map(item => ({
      id: item.id,
      name: item.name,
      topic: item.topic,
      difficulty: item.difficulty,
      revisionType: item.revisionType,
      dueDate: 'Today',
      priority: 'today'
    })));
  }
  
  // Add upcoming items, limited to 4 total with due today
  if (revisionsData.upcoming && Array.isArray(revisionsData.upcoming)) {
    const itemsToAdd = Math.max(0, 4 - itemsTodraw.length);
    itemsTodraw.push(...revisionsData.upcoming.slice(0, itemsToAdd).map(item => ({
      id: item.id,
      name: item.name,
      topic: item.topic,
      difficulty: item.difficulty,
      revisionType: item.revisionType,
      dueDate: item.dueDate,
      priority: 'upcoming'
    })));
  }

  if (itemsTodraw.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No revisions scheduled</div>';
    return;
  }

  // Add items to list
  itemsTodraw.forEach(item => {
    const displayDate = item.dueDate === 'Today' ? 'Today' : formatDate(item.dueDate);
    const displayRevisionType = item.revisionType === 'day3' ? '3-day' : 
                                item.revisionType === 'day7' ? '7-day' : '15-day';
    
    listEl.innerHTML += `
      <div class="revision-row" onclick="handleRevisionClick('${item.id}', '${item.revisionType}')">
        <div class="revision-info">
          <span class="revision-name">${item.name}</span>
          <span class="revision-topic">${item.topic} • ${displayRevisionType} • ${displayDate}</span>
        </div>
        <span class="difficulty-badge ${item.difficulty || 'medium'}">${item.difficulty || 'medium'}</span>
      </div>
    `;
  });

  // Update badge with count due today
  const badge = document.querySelector('.card-badge');
  if (badge) {
    badge.textContent = revisionsData.summary?.dueToday || 0;
  }
}

// Helper function to format dates
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch (e) {
    return dateStr;
  }
}

// Update topics list
function updateTopicsList(questions) {
  const listEl = document.querySelector('.topics-list');
  if (!listEl || !questions || !Array.isArray(questions)) return;

  // Count by topic
  const topicCounts = {};
  questions.forEach(q => {
    if (q.topic) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }
  });

  const topicEntries = Object.entries(topicCounts);
  if (topicEntries.length === 0) {
    listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No topics yet</div>';
    return;
  }

  const maxCount = Math.max(...topicEntries.map(([_, count]) => count), 1);

  // Clear and rebuild
  listEl.innerHTML = '';

  topicEntries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([topic, count]) => {
      const percent = (count / maxCount) * 100;
      const topicName = topic.charAt(0).toUpperCase() + topic.slice(1);

      listEl.innerHTML += `
        <div class="topic-row">
          <span class="topic-name">${topicName}</span>
          <div class="topic-bar">
            <div class="topic-fill" style="width: ${percent}%;"></div>
          </div>
          <span class="topic-count">${count}</span>
        </div>
      `;
    });
}

// Update user profile
function updateProfile() {
  const nameEl = document.querySelector('.user-name');
  const emailEl = document.querySelector('.user-email');
  const avatarEl = document.querySelector('.avatar');

  if (!USERNAME) {
    console.error('❌ No username available');
    return;
  }

  // Use actual name from profile
  const displayName = USERNAME.charAt(0).toUpperCase() + USERNAME.slice(1);

  if (nameEl) nameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = USERNAME.toLowerCase() + '@codetrack.dev';
  if (avatarEl) avatarEl.textContent = USERNAME.substring(0, 2).toUpperCase();

  // Update sidebar profile with dynamic links
  if (typeof updateSidebarProfile === 'function') {
    updateSidebarProfile();
  }

  // Log platform usernames (for debugging)
  console.log('📱 Platform Usernames:');
  console.log('  GitHub:', USER_PROFILE?.github || 'Not set');
  console.log('  LeetCode:', USER_PROFILE?.leetcode || 'Not set');
  console.log('  Codeforces:', USER_PROFILE?.codeforces || 'Not set');
}

// Display platform stats in UI
function displayPlatformStats(stats) {
  console.log('🎨 Displaying platform stats...');

  // GitHub Stats
  if (stats.github) {
    const ghEl = document.getElementById('githubStats');
    if (ghEl) {
      const repos = stats.github.public_repos || 0;
      const followers = stats.github.followers || 0;
      ghEl.innerHTML = `
        <div style="padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${repos}</div>
          <div style="font-size: 11px; color: var(--text-2); margin-top: 4px;">Public Repos</div>
          <div style="font-size: 12px; color: var(--text-3); margin-top: 6px;">👥 ${followers} followers</div>
        </div>
      `;
    }
  }

  // LeetCode Stats
  if (stats.leetcode && !stats.leetcode.error) {
    const lcEl = document.getElementById('leetcodeStats');
    if (lcEl) {
      const solved = stats.leetcode.solved || 0;
      const easy = stats.leetcode.easy || 0;
      const medium = stats.leetcode.medium || 0;
      const hard = stats.leetcode.hard || 0;
      lcEl.innerHTML = `
        <div style="padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${solved}</div>
          <div style="font-size: 11px; color: var(--text-2); margin-top: 4px;">Problems Solved</div>
          <div style="font-size: 11px; color: var(--text-3); margin-top: 6px;">
            🟢 ${easy} • 🟡 ${medium} • 🔴 ${hard}
          </div>
        </div>
      `;
    }
  } else if (stats.leetcode?.error) {
    const lcEl = document.getElementById('leetcodeStats');
    if (lcEl) {
      lcEl.innerHTML = `
        <div style="padding: 12px; text-align: center; color: var(--text-3);">
          User not found
        </div>
      `;
    }
  }

  // Codeforces Stats
  if (stats.codeforces && !stats.codeforces.error) {
    const cfEl = document.getElementById('codeforcesStats');
    if (cfEl) {
      const rating = stats.codeforces.rating || 0;
      const solved = stats.codeforces.solvedCount || 0;
      cfEl.innerHTML = `
        <div style="padding: 12px; text-align: center;">
          <div style="font-size: 18px; font-weight: 700; color: var(--accent);">${rating}</div>
          <div style="font-size: 11px; color: var(--text-2); margin-top: 4px;">Rating</div>
          <div style="font-size: 12px; color: var(--text-3); margin-top: 6px;">✓ ${solved} solved</div>
        </div>
      `;
    }
  } else if (stats.codeforces?.error) {
    const cfEl = document.getElementById('codeforcesStats');
    if (cfEl) {
      cfEl.innerHTML = `
        <div style="padding: 12px; text-align: center; color: var(--text-3);">
          User not found
        </div>
      `;
    }
  }
}

// ================================
// EVENT HANDLERS
// ================================

// Handle revision click (mark complete)
async function handleRevisionClick(questionId, revisionType) {
  // Ensure we have valid data
  if (!questionId || !revisionType) {
    console.error('Invalid question ID or revision type');
    return;
  }

  const displayRevisionType = revisionType === 'day3' ? '3-day' : 
                              revisionType === 'day7' ? '7-day' : '15-day';

  if (confirm(`Mark ${displayRevisionType} revision as complete?`)) {
    const result = await markComplete(questionId, revisionType);
    if (result && result.success) {
      alert('✅ Revision marked complete!');
      loadDashboardData();  // Refresh
    } else {
      alert('❌ Error: ' + (result?.message || 'Failed to mark revision'));
    }
  }
}

// Handle add question (if form exists)
window.handleAddQuestion = async function(event) {
  event.preventDefault();

  const nameInput = document.getElementById('questionName');
  const topicInput = document.getElementById('questionTopic');
  const difficultyInput = document.getElementById('questionDifficulty');

  const name = nameInput?.value?.trim();
  const topic = topicInput?.value?.trim();
  const difficulty = difficultyInput?.value?.trim();

  // Validate inputs
  if (!name) {
    alert('⚠️ Please enter a question name');
    nameInput?.focus();
    return;
  }

  if (!topic) {
    alert('⚠️ Please select a topic');
    topicInput?.focus();
    return;
  }

  if (!difficulty) {
    alert('⚠️ Please select a difficulty level');
    difficultyInput?.focus();
    return;
  }

  // Add the question
  const result = await addNewQuestion(name, topic, difficulty);

  if (result && result.success) {
    alert('✅ Question added with revision schedule!');
    
    // Clear form
    if (nameInput) nameInput.value = '';
    if (topicInput) topicInput.value = '';
    if (difficultyInput) difficultyInput.value = '';
    
    // Refresh dashboard
    loadDashboardData();
  } else {
    alert('❌ Error: ' + (result?.message || 'Failed to add question'));
  }
};

// ================================
// MAIN LOAD FUNCTION
// ================================

async function loadDashboardData() {
  console.log('🚀 Loading dashboard data...');

  // Add loading state
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.style.opacity = '0.6';

  try {
    // Check if user has authentication token
    const hasAuth = !!localStorage.getItem('token');
    console.log('🔐 Has authentication:', hasAuth);

    let questionsData = null;
    let revisionsData = null;
    let platformStats = null;

    if (hasAuth) {
      // User is logged in - fetch everything (questions, revisions, platform stats)
      console.log('📊 Fetching full dashboard data (authenticated)...');
      [questionsData, revisionsData, platformStats] = await Promise.all([
        fetchQuestions(USERNAME),
        fetchRevisions(USERNAME),
        fetchAllPlatformStats()
      ]);
    } else {
      // User has profile but not logged in - only fetch platform stats
      console.log('📊 Fetching platform stats only (no auth)...');
      platformStats = await fetchAllPlatformStats();
    }

    // Update UI based on available data
    updateProfile();

    // Always update metric cards with platformStats (if available)
    updateMetricCards(questionsData, revisionsData, platformStats);

    // Only update questions/revisions details if we have that data
    if (questionsData && revisionsData) {
      if (questionsData.success && revisionsData.success) {
        updateDifficultyBreakdown(questionsData.stats);
        updateRevisionsList(revisionsData);
        updateTopicsList(questionsData.questions);
      } else {
        console.warn('⚠️ Questions or revisions data unavailable');
      }
    } else {
      console.log('ℹ️ Questions/revisions not loaded (auth required)');
    }

    // Display platform stats (always available with profile)
    if (platformStats && (platformStats.github || platformStats.leetcode || platformStats.codeforces)) {
      displayPlatformStats(platformStats);
    }

    console.log('✅ Dashboard updated successfully!');

  } catch (error) {
    console.error('❌ Dashboard load error:', error);
    // Don't alert on error - just log it
    console.warn('Some data could not be loaded. Platform stats should still be visible.');
  } finally {
    // Remove loading state
    if (mainContent) mainContent.style.opacity = '1';
  }
}

// ================================
// CHART.JS - PROGRESS OVER TIME
// ================================

function initProgressChart() {
  const canvas = document.getElementById('progressChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.classList.contains('dark');

  const progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
      datasets: [{
        label: 'Problems Solved',
        data: [2, 5, 8, 12, 18, 25],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: isDark ? '#000' : '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: isDark ? '#888' : '#666' },
          grid: { color: isDark ? '#2a2a2a' : '#e5e5e7' }
        },
        x: {
          ticks: { color: isDark ? '#888' : '#666' },
          grid: { color: isDark ? '#2a2a2a' : '#e5e5e7' }
        }
      }
    }
  });

  console.log('✅ Chart initialized!');
}

// Make functions available globally
window.handleRevisionClick = handleRevisionClick;
window.loadDashboardData = loadDashboardData;
