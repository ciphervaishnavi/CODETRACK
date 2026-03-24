// ================================
// AUTH GUARD
// ================================
// Client-side authentication check and session management
// Include this script at the beginning of protected pages (before other scripts)

(function() {
  'use strict';

  // Configuration
  const TOKEN_KEY = 'token';
  const USERNAME_KEY = 'username';
  const PROTECTED_PAGES = ['dashboard-modern.html', 'dashboard.html', 'premium-dashboard.html'];

  /**
   * Check if user is authenticated (has valid token)
   */
  function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  /**
   * Get stored username from localStorage
   */
  function getUsername() {
    return localStorage.getItem(USERNAME_KEY);
  }

  /**
   * Get stored token from localStorage
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Logout user - clear token and username, redirect to login
   */
  function logout() {
    console.log('🚪 Logging out user');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  }

  /**
   * Check on page load - redirect to login if not authenticated
   */
  function checkAuthOnPageLoad() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard-modern.html';
    const isProtectedPage = PROTECTED_PAGES.some(page => currentPage.includes(page));

    // ⭐ NEW: Check if user has profile ID in localStorage (NEW SYSTEM)
    const hasProfileId = !!localStorage.getItem('profileId');

    if (isProtectedPage) {
      // Allow access if either:
      // 1. User is authenticated (has token) - OLD SYSTEM
      // 2. User has profile ID (NEW SYSTEM) - can view platform stats without login
      if (!isAuthenticated() && !hasProfileId) {
        console.log('⚠️ No profile found, redirecting to profile setup');
        window.location.href = 'index.html';
        return;
      }

      if (!isAuthenticated() && hasProfileId) {
        console.log('✅ Profile ID found (no auth needed for platform stats)');
        return;
      }
    }

    if (isAuthenticated()) {
      console.log('✅ User authenticated:', getUsername());
      updateUIWithUserInfo();
    }
  }

  /**
   * Update dashboard UI with user information
   */
  function updateUIWithUserInfo() {
    const username = getUsername();
    
    // Update username display in header (if element exists)
    const usernameElement = document.getElementById('userProfile');
    if (usernameElement) {
      usernameElement.textContent = `👤 ${username}`;
    }

    // Update navbar username (if element exists)
    const navUsername = document.getElementById('navUsername');
    if (navUsername) {
      navUsername.textContent = username;
    }

    // Fetch and cache user profile from API
    fetchAndCacheUserProfile(username);

    // Add logout button to header
    addLogoutButton();
  }

  /**
   * Fetch user profile from API and cache in localStorage
   */
  async function fetchAndCacheUserProfile(username) {
    try {
      const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api';
      
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/profile/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('userProfile', JSON.stringify(data.profile));
        console.log('✅ User profile cached');
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch user profile:', error);
    }
  }

  /**
   * Add logout button to header
   */
  function addLogoutButton() {
    // Check if logout button already exists
    if (document.getElementById('logoutBtn')) {
      return;
    }

    // Find the actions container in header
    const headerActions = document.querySelector('[data-auth="actions"]') || 
                         document.querySelector('.header-actions') ||
                         document.querySelector('.actions');

    if (headerActions) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'logout-btn';
      logoutBtn.textContent = '🚪 Logout';
      logoutBtn.style.cssText = `
        padding: 8px 16px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: 10px;
      `;
      
      logoutBtn.addEventListener('mouseover', function() {
        this.style.background = '#dc2626';
        this.style.transform = 'scale(1.05)';
      });
      
      logoutBtn.addEventListener('mouseout', function() {
        this.style.background = '#ef4444';
        this.style.transform = 'scale(1)';
      });

      logoutBtn.addEventListener('click', logout);
      headerActions.appendChild(logoutBtn);
    }

    // Alternative: Add logout to navbar if headerActions not found
    const navbar = document.querySelector('[data-auth="navbar"]') ||
                   document.querySelector('.navbar') ||
                   document.querySelector('nav');

    if (navbar && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'logout-btn-nav';
      logoutBtn.textContent = 'Logout';
      logoutBtn.style.cssText = `
        padding: 8px 16px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: auto;
      `;
      
      logoutBtn.addEventListener('click', logout);
      navbar.appendChild(logoutBtn);
    }
  }

  /**
   * Public API - expose functions to window
   */
  window.AuthGuard = {
    isAuthenticated: isAuthenticated,
    getUsername: getUsername,
    getToken: getToken,
    logout: logout
  };

  /**
   * Run checks on page load
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthOnPageLoad);
  } else {
    checkAuthOnPageLoad();
  }

  // Optional: Check authentication every 5 minutes (DISABLED for profile-only users)
  setInterval(() => {
    const hasProfileId = !!localStorage.getItem('profileId');
    // Only logout if no profile and no auth
    if (!isAuthenticated() && !hasProfileId) {
      console.warn('⚠️ Token missing or expired');
      logout();
    }
  }, 5 * 60 * 1000);

})();
