# CodeTrack - Quick Reference

## localStorage Usage

### Save Profile
```javascript
localStorage.setItem('userProfile', JSON.stringify({
  name: "John Doe",
  github: "torvalds",
  leetcode: "dan_c",
  codeforces: "tourist"
}));
```

### Read Profile
```javascript
const profile = JSON.parse(localStorage.getItem('userProfile'));
console.log(profile.github);  // "torvalds"
```

### Clear Profile
```javascript
localStorage.removeItem('userProfile');
```

---

## API Endpoints

### GitHub Stats
```
GET /api/github/{username}

Response:
{
  "login": "torvalds",
  "public_repos": 413,
  "followers": 16000,
  "bio": "...",
  "avatar_url": "..."
}
```

### LeetCode Stats
```
GET /api/leetcode/{username}

Response:
{
  "username": "dan_c",
  "solved": 3145,
  "easy": 987,
  "medium": 1158,
  "hard": 1000
}
```

### Codeforces Stats
```
GET /api/codeforces/{username}

Response:
{
  "handle": "tourist",
  "rating": 4165,
  "maxRating": 4250,
  "solvedCount": 5880
}
```

---

## Key Functions

### Load User Profile
```javascript
loadUserProfile() → reads localStorage, redirects if not found
```

### Fetch Platform Stats
```javascript
fetchGitHubStats(username)       → GET /api/github/:username
fetchLeetCodeStats(username)     → GET /api/leetcode/:username
fetchCodeforcesStats(username)   → GET /api/codeforces/:username
fetchAllPlatformStats()          → All 3 in parallel
```

### Display Stats
```javascript
displayPlatformStats(stats) → Renders metric cards
```

---

## Testing Commands

### Test in Console
```javascript
// Check if profile is stored
localStorage.getItem('userProfile')

// Manually set profile
localStorage.setItem('userProfile', JSON.stringify({name:"Test",github:"torvalds",leetcode:"dan_c",codeforces:"tourist"}))

// Reload dashboard
location.reload()

// Test API directly
fetch('/api/github/torvalds').then(r => r.json()).then(console.log)
```

### Test API Endpoints
```bash
# GitHub
curl http://localhost:5000/api/github/torvalds

# LeetCode
curl http://localhost:5000/api/leetcode/dan_c

# Codeforces
curl http://localhost:5000/api/codeforces/tourist
```

---

## Files at a Glance

| File | Purpose |
|------|---------|
| index.html | Profile setup page |
| dashboard-modern.html | Dashboard with stats cards |
| dashboard.js | All logic (load profile, fetch stats) |
| server.js | 3 new public API routes |
| platformService.js | GitHub stats fetcher (new) |

---

## Console Output Expected

```
🌐 API Base URL: http://localhost:5000/api
✅ User profile loaded: {name: "John", github: "torvalds", ...}
👤 Username: John
📱 Platform Usernames:
   GitHub: torvalds
   LeetCode: dan_c
   Codeforces: tourist

📊 Fetching all platform stats...
🐙 Fetching GitHub stats for torvalds...
✅ GitHub stats fetched: {login: "torvalds", public_repos: 413, ...}
💻 Fetching LeetCode stats for dan_c...
✅ LeetCode stats fetched: {solved: 3145, easy: 987, ...}
🚀 Fetching Codeforces stats for tourist...
✅ Codeforces stats fetched: {handle: "tourist", rating: 4165, ...}

🎨 Displaying platform stats...
✅ Dashboard updated successfully!
```

---

## Error Messages & Fixes

| Error | Fix |
|-------|-----|
| "No profile found" | Run: `localStorage.setItem('userProfile', JSON.stringify({name:"Test",github:"user",...}))` |
| "User not found" (in card) | Check username exists on that platform |
| "Failed to fetch" | Verify backend running on port 5000 |
| Stats not updating | Clear localStorage and reload |

---

## Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Frontend points to correct backend URL
- [ ] All 3 API endpoints working
- [ ] localStorage persisting across sessions
- [ ] Error handling working
- [ ] Console logs appearing
- [ ] Mobile responsive

---

## Performance Notes

- ✅ 1-hour cache per platform (prevents rate limiting)
- ✅ Parallel API calls (all 3 fetch simultaneously)
- ✅ localStorage is instant (no network latency)
- ✅ Error handling doesn't block other platforms

---

## Mobile Compatibility

- ✅ Responsive design (Tailwind CSS)
- ✅ Touch-friendly inputs
- ✅ Works on all screen sizes
- ✅ localStorage works on mobile browsers

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Common Test Usernames

### GitHub
- `torvalds` (Linus Torvalds - 413 repos, 16K+ followers)
- `gvanrossum` (Guido van Rossum - 50+ repos)

### LeetCode
- `dan_c` (3145 problems)
- `michaelwahdan` (500+ problems)

### Codeforces
- `tourist` (4165 rating - world's best)
- `Um_nik` (3900+ rating)

---

**Need help?** Check IMPLEMENTATION_GUIDE.md for detailed instructions!
