// Fetch the token from environment variables
let sc = process.env.GITHUB_TOKEN;

function decrypt(str) {
  let s = "";
  for (let i = 0; i < str.length; i++) {
    if (i % 2 == 0) {
      s += str[i];
    }
  }

  return s;
}

const headers = {
  'Authorization': `Bearer ${decrypt(sc)}`,
};

let lastUpdated = 0;
let cachedResults = null;

const repo_list = [
  "iiitl/student-hub",
  "iiitl/SNKS",
];


async function fetch_repos() {
      let ret = new Map();
      let resp = [];

      let respPromises = [];
      (async () => {


      })();

      repo_list.forEach((repo) => {
        console.log(repo)
        let page = 1;

        for(let i = 1; i <= 3; i++) {
          const req = fetch(
            `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${i}`, {
              headers: headers
            }
          );
          if(req) {
            respPromises.push(req);
          }
        }
      });

      const responses = await Promise.all(respPromises);
      responses.forEach((response) => {
        resp.push(response.json());
      });
      const data = await Promise.all(resp);
      
      let pulls = [];
      data.forEach((pullCollection) => {
        if(pullCollection.length > 0) {
          pulls = [...pulls, ...pullCollection];
        }
      })
      console.log(pulls);
      
      for(const pull of pulls) {
        const acceptedLabels = pull.labels.filter(
          (label) => label.name.includes("accepted-")
        );
        if (acceptedLabels.length > 0) {
          const validPull = acceptedLabels[0].name;
          const login = pull.user.login;
          if (ret.has(login)) {
            ret.set(login, ret.get(login) + parseInt(validPull.split("-")[1]));
          } else {
            ret.set(login, parseInt(validPull.split("-")[1]));
          }
        }
      }

      let ret2 = Object.fromEntries(ret);
      console.log("here")
      console.log(ret2);


      return ret2;

}

let localLeaderboardData = {}; // Variable to store leaderboard data in memory

async function fetch_new_data_and_save() {
  fetch("https://github.com/MrImmortal09/FOSS-Weekend-2024-Leaderboard/raw/main/repos.txt")
    .then(resp => resp.text())
    .then(async (repos) => {
      console.log(repos);
      let ret = new Map();
      repos.split(/\r?\n/).forEach(async (repo) => {
        let resp = [];
        let page = 1;
        const t_resp = await fetch(
          `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${page}`
        );
        const jsonData = await t_resp.json();
        while (jsonData.length > 0) {
          resp = [...resp, ...jsonData];
          if (jsonData.length < 90) break;
          page += 1;
          const t_resp = await fetch(
            `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${page}`
          );
          const jsonData = await t_resp.json();
        }
        try {
          for (const pull of resp) {
            const acceptedLabels = pull.labels.filter(
              (label) => label.name.includes("accepted-")
            );
            if (acceptedLabels.length > 0) {
              const validPull = acceptedLabels[0].name;
              const login = pull.user.login;
              if (ret.has(login)) {
                ret.set(login, ret.get(login) + parseInt(validPull.split("-")[1]));
              } else {
                ret.set(login, parseInt(validPull.split("-")[1]));
              }
            }
          }
        } catch (error) {
          console.error(`ERROR AT: ${user}, ${repo}`);
          console.error(resp);
          return "ded";
        }
      });
      let ret2 = Object.fromEntries(ret);
      console.log("here");
      console.log(ret2);

      // Store the data locally in memory
      localLeaderboardData = ret2;

      return ret2;
    });
}

async function fetch_existing_data() {
  return fetch("https://github.com/MrImmortal09/FOSS-Weekend-2024-Leaderboard/blob/main/raw/leaderboard/leaderboard.json")
    .then(resp => resp.json())
}

async function start_exec() {

  if((Date.now() - lastUpdated)/1000 > 120 || cachedResults === null) {
      const tt = await fetch_repos();
      console.log((Date.now() - lastUpdated)/1000)
      
      let results = [];
      
      for(let k in tt) {
        let user = {};
        user.username = k;
        user.score = tt[k];
        results.push(user);
      }
      console.log(results);
    
      results.sort((a, b) => b.score - a.score);
    
      return results;
  } else {
    console.log("cached results shown")
    return cachedResults;
  }
  
}
