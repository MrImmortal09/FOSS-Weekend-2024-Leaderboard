import React, { useState, useEffect } from 'react';

function App() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [cachedResults, setCachedResults] = useState(null);
  const [repoList, setRepoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Retrieve the token from environment variables
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  // Try to load cached data from localStorage on initial mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('leaderboardCache');
      const savedTimestamp = localStorage.getItem('leaderboardTimestamp');
      
      if (savedData && savedTimestamp) {
        const parsedData = JSON.parse(savedData);
        setCachedResults(parsedData);
        setLeaderboard(parsedData);
        setLastUpdated(parseInt(savedTimestamp));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }, []);

  // Fetch repo list from GitHub
  async function fetchRepoList() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/MrImmortal09/FOSS-Weekend-2024-Leaderboard/refs/heads/main/repos.txt');
      const text = await response.text();
      // Split by newlines and filter out empty lines
      const repos = text.split('\n').filter(repo => repo.trim().length > 0);
      setRepoList(repos);
      return repos;
    } catch (error) {
      console.error('Error fetching repo list:', error);
      return [];
    }
  }

  async function fetch_repos() {
    let ret = new Map();
    let respPromises = [];

    // Use the dynamically loaded repoList
    repoList.forEach((repo) => {
      for (let i = 1; i <= 3; i++) {
        const req = fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${i}`, {
          headers: headers,
        });
        respPromises.push(req);
      }
    });

    const responses = await Promise.all(respPromises);
    const data = await Promise.all(responses.map(response => response.json()));

    let pulls = [];
    data.forEach((pullCollection) => {
      if (pullCollection.length > 0) {
        pulls = pulls.concat(pullCollection);
      }
    });

    for (const pull of pulls) {
      const acceptedLabels = pull.labels.filter(label => label.name.includes("accepted-"));
      if (acceptedLabels.length > 0) {
        const validPull = acceptedLabels[0].name;
        const login = pull.user.login;
        const points = parseInt(validPull.split("-")[1]);
        if (ret.has(login)) {
          ret.set(login, ret.get(login) + points);
        } else {
          ret.set(login, points);
        }
      }
    }
    return ret;
  }

  async function start_exec() {
    // Refresh data if 120 seconds have passed or if no cache exists
    if (((Date.now() - lastUpdated) / 1000 > 120) || !cachedResults) {
      setDataLoading(true);
      try {
        const repoData = await fetch_repos();
        let results = [];
        for (let [user, score] of repoData.entries()) {
          results.push({ username: user, score });
        }
        results.sort((a, b) => b.score - a.score);
        setCachedResults(results);
        setLeaderboard(results);
        setLastUpdated(Date.now());
        
        // Save to localStorage for persistence between refreshes
        localStorage.setItem('leaderboardCache', JSON.stringify(results));
        localStorage.setItem('leaderboardTimestamp', Date.now().toString());
        
        setDataLoading(false);
        return results;
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataLoading(false);
        return cachedResults || [];
      }
    } else {
      // If we have cached results, use them immediately
      return cachedResults;
    }
  }

  // First fetch the repository list, then fetch data
  useEffect(() => {
    async function initializeApp() {
      setLoading(true);
      await fetchRepoList();
      setLoading(false);
    }
    initializeApp();
  }, []);

  // Once repositories are loaded, fetch the leaderboard data
  useEffect(() => {
    if (repoList.length > 0) {
      async function fetchData() {
        await start_exec();
      }
      // Remove the setTimeout - fetch immediately
      fetchData();
    }
  }, [repoList, start_exec]);

  return (
    <div className="container">
      <header>
        <h1>FOSS Weekend Leaderboard</h1>
        <p className="subtitle">Celebrating open source contributions</p>
      </header>
      {loading ? (
        <p>Loading repositories...</p>
      ) : repoList.length === 0 ? (
        <p>No repositories found. Please check the configuration.</p>
      ) : dataLoading ? (
        <div>
          <p>Updating leaderboard data...</p>
          {leaderboard.length > 0 && (
            <table className="leaderboard">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Contributor</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, index) => (
                  <tr key={item.username} className={index < 3 ? 'top-3' : ''}>
                    <td className={`rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                      {index + 1}
                    </td>
                    <td className="username">{item.username}</td>
                    <td className="score">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Contributor</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr key={item.username} className={index < 3 ? 'top-3' : ''}>
                <td className={`rank ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                  {index + 1}
                </td>
                <td className="username">{item.username}</td>
                <td className="score">{item.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <footer>
        <p>Data refreshes automatically every 15 minutes</p>
        <p>Tracking {repoList.length} repositories</p>
      </footer>
    </div>
  );
}

export default App;
