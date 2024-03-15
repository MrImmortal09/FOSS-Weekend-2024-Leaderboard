
const auth_headers = new Headers({
  'Authorization': 'Bearer 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'  // read-only access token (5000 req/hr)
})

let lastUpdated = 0;
let cachedResults = null;

const repo_list = [
  "iiitl/realty",
  "iiitl/translate_app",
  "iiitl/chat_buddy",
  "iiitl/Classification",
  "iiitl/Regression",
  "iiitl/Wollete",
  "iiitl/crypto_project",
  "iiitl/batting",
  "iiitl/snake-game-js",
  "iiitl/Github-Finder",
  "iiitl/MERN_AUTH",
  "iiitl/Note_Generator",
  "iiitl/Jumble_Words",
  "iiitl/Media_Player",
  "iiitl/React-Native-To-Do",
  "iiitl/bash-practice-repo-24",
  "iiitl/git-practice-weekend-24"
];


async function fetch_repos() {

  // let final = await fetch("https://raw.githubusercontent.com/ecxtacy/FOSS-Weekend-2024-Leaderboard/main/repos.txt", { headers: auth_headers })
  //   .then(resp => resp.text())
  //   .then(async (repos) => {
      // console.log(repos)
      // // return;

      let ret = new Map();
      let resp = [];

      let respPromises = [];

      // let finalRepos = repos.split(/\r?\n/);

      (async () => {


      })();

      repo_list.forEach((repo) => {
        console.log(repo)
        let page = 1;

        const req = fetch(
          `https://api.github.com/repos/${repo}/pulls?state=all`, {
            headers: auth_headers
          }
        );

        respPromises.push(req);

        // const t_resp = await fetch(
        //   `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${page}`, {
        //     headers: auth_headers
        //   }
        // );
        // const jsonData = await t_resp.json();
        // console.log(jsonData)

        // if(jsonData.length > 0) {
        //   resp = [...resp, ...jsonData];
        // }

        // while (jsonData.length > 0) {
        //   resp = [...resp, ...jsonData];
        //   if (jsonData.length < 90) break;
        //   page += 1;
        //   const t_resp = await fetch(
        //     `https://api.github.com/repos/${repo}/pulls?state=all&per_page=100&page=${page}`, {
        //       headers: auth_headers
        //     }
        //   );
        //   const jsonData = await t_resp.json();
        // }

        // pull[i].labels.name.includes("accepted") -> filter out -> 'accepted-x'
        
        // try {
        //   for (const pull of resp) {
        //     const acceptedLabels = pull.labels.filter(
        //       (label) => label.name.includes("accepted-")
        //     );
        //     if (acceptedLabels.length > 0) {
        //       const validPull = acceptedLabels[0].name;
        //       const login = pull.user.login;
        //       if (ret.has(login)) {
        //         ret.set(login, ret.get(login) + parseInt(validPull.split("-")[1]));
        //       } else {
        //         ret.set(login, parseInt(validPull.split("-")[1]));
        //       }
        //     }
        //   }
        // } catch (error) {
        //   console.error(`ERROR AT: ${user}, ${repo}`);
        //   console.error(resp);
        //   return "ded";
        // }
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

      // await fetch('https://api.github.com/repos/ecxtacy/FOSS-Weekend-2024-Leaderboard/dispatches', {
      //   method: "POST",
      //   headers: auth_headers,
      //   body: JSON.stringify({
      //     event_type: 'leaderboard_update',
      //     client_payload: {
      //       data: JSON.stringify(ret2)
      //     }
      //   }),
      // });

      return ret2;
    // });
}

async function fetch_new_data_and_save() {
  fetch("https://github.com/ecxtacy/FOSS-Weekend-2024-Leaderboard/raw/main/repos.txt")
    .then(resp => resp.text())
    .then(async (repos) => {
      console.log(repos)
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
      console.log("here")
      console.log(ret2);

      await fetch('https://api.github.com/repos/ecxtacy/FOSS-Weekend-2024-Leaderboard/dispatches', {
        method: "POST",
        headers: auth_headers,
        body: JSON.stringify({
          event_type: 'leaderboard_update',
          client_payload: {
            data: JSON.stringify(ret2)
          }
        }),
      });



      return ret2;
    })
}

async function fetch_existing_data() {
  return fetch("https://github.com/ecxtacy/FOSS-Weekend-2024-Leaderboard/raw/leaderboard/leaderboard.json")
    .then(resp => resp.json())
}

async function start_exec() {

  // if((Date.now() - lastUpdated)/1000 > 120 || cachedResults === null) {
    
  // } else {
  //   console.log("cached results shown")
  //   return cachedResults;
  // }
  const tt = await fetch_repos();
  lastUpdated = localStorage.getItem("lup");
  console.log(lastUpdated)
  
  let results = [];
  
  for(let k in tt) {
    let user = {};
    user.username = k;
    user.score = tt[k];
    results.push(user);
  }
  console.log(results);

  results.sort((a, b) => b.score - a.score);

  localStorage.setItem('lup', Date.now());
  return results;

  // "https://api.github.com/repos/ecxtacy/FOSS-Weekend-2024-Leaderboard/commits?path=leaderboard.json&ref=leaderboard&page=1&per_page=1"

  // return fetch("https://api.github.com/repos/ecxtacy/FOSS-Weekend-2024-Leaderboard/contents/raw/leaderboard/leaderboard.json", {
  //     headers: auth_headers
  //   })
  //   .then(resp => { return resp.json(); })
  //   .then(json => {
  //     // return fetch_new_data_and_save();
  //     console.log("data is");
  //     json = json.content
  //     console.log(json)
  //     let last = new Date(json[0]['commit']['commiter']['date']);
  //     let now = new Date();
  //     let difference_in_s = (now - last) / 1000;
  //     if (difference_in_s > 180) {
  //       return fetch_new_data_and_save();
  //     } else {
  //       return fetch_existing_data();
  //     }
  //   })

  
}
