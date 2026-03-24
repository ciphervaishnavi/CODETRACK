// ================================
// PLATFORM SERVICE
// ================================
// Fetch real-time stats from LeetCode and Codeforces APIs

const https = require('https');

/**
 * Simple in-memory cache with TTL (1 hour)
 */
const cache = {};

function setCache(key, value) {
  cache[key] = {
    value,
    timestamp: Date.now(),
    ttl: 3600000 // 1 hour
  };
}

function getCache(key) {
  if (!cache[key]) return null;
  if (Date.now() - cache[key].timestamp > cache[key].ttl) {
    delete cache[key];
    return null;
  }
  return cache[key].value;
}

/**
 * Fetch GitHub stats using REST API
 * Returns: { login, public_repos, followers, bio }
 */
async function fetchGitHubStats(username) {
  const cacheKey = `github_${username}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${encodeURIComponent(username)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    try {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.message === 'Not Found' || res.statusCode === 404) {
              resolve(null);
              return;
            }

            const result = {
              login: json.login,
              public_repos: json.public_repos || 0,
              followers: json.followers || 0,
              bio: json.bio || '',
              avatar_url: json.avatar_url
            };

            setCache(cacheKey, result);
            resolve(result);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Fetch LeetCode stats using GraphQL API
 * Returns: { solved, easy, medium, hard, recentSubmissions }
 */
async function fetchLeetCodeStats(handle) {
  const cacheKey = `leetcode_${handle}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  return new Promise((resolve) => {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            realName
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
            totalSubmissionNum {
              difficulty
            }
          }
        }
      }
    `;

    const postData = JSON.stringify({
      query: query,
      variables: { username: handle }
    });

    const options = {
      hostname: 'leetcode.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'Mozilla/5.0'
      }
    };

    try {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.data || !json.data.matchedUser) {
              resolve(null);
              return;
            }

            const stats = json.data.matchedUser.submitStats.acSubmissionNum;
            const result = {
              username: handle,
              solved: 0,
              easy: 0,
              medium: 0,
              hard: 0
            };

            // Parse LeetCode stats properly - "All" contains total, others are by difficulty
            stats.forEach((stat) => {
              if (stat.difficulty === 'All') {
                result.solved = stat.count;  // Use "All" as total (not sum)
              } else if (stat.difficulty === 'Easy') {
                result.easy = stat.count;
              } else if (stat.difficulty === 'Medium') {
                result.medium = stat.count;
              } else if (stat.difficulty === 'Hard') {
                result.hard = stat.count;
              }
            });

            setCache(cacheKey, result);
            resolve(result);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.write(postData);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Fetch Codeforces stats using REST API
 * Returns: { handle, rating, maxRating, solvedCount }
 */
async function fetchCodeforcesStats(handle) {
  const cacheKey = `codeforces_${handle}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  return new Promise((resolve) => {
    const options = {
      hostname: 'codeforces.com',
      path: `/api/user.info?handles=${encodeURIComponent(handle)}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    try {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.status !== 'OK' || !json.result || json.result.length === 0) {
              resolve(null);
              return;
            }

            const user = json.result[0];
            
            // Fetch submission count
            const submissionPath = `/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=100000`;
            const subOptions = {
              hostname: 'codeforces.com',
              path: submissionPath,
              method: 'GET',
              headers: { 'User-Agent': 'Mozilla/5.0' }
            };

            const subReq = https.request(subOptions, (subRes) => {
              let subData = '';
              subRes.on('data', (chunk) => { subData += chunk; });
              subRes.on('end', () => {
                try {
                  const subJson = JSON.parse(subData);
                  const solvedProblems = new Set();
                  
                  if (subJson.status === 'OK' && subJson.result) {
                    subJson.result.forEach((submission) => {
                      if (submission.verdict === 'OK') {
                        solvedProblems.add(submission.problem.name);
                      }
                    });
                  }

                  const result = {
                    handle: user.handle,
                    rating: user.rating || 0,
                    maxRating: user.maxRating || 0,
                    solvedCount: solvedProblems.size
                  };

                  setCache(cacheKey, result);
                  resolve(result);
                } catch (e) {
                  resolve(null);
                }
              });
            });

            subReq.on('error', () => resolve(null));
            subReq.end();
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

module.exports = {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchCodeforcesStats
};
