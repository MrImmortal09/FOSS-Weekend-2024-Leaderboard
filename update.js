
const auth_headers = new Headers({
  'Authorization': 'Bearer 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'  // read-only access token (5000 req/hr)

	// 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
})

async function fetch_new_data_and_save() {
  fetch("https://github.com/ecxtacy/FOSS-Weekend-2024-Leaderboard/raw/main/repos.txt")
    .then(resp => resp.text())
    .then(async (repos) => {
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
  return fetch("https://api.github.com/repos/ecxtacy/FOSS-Weekend-2024-Leaderboard/commits?path=leaderboard.json&ref=leaderboard&page=1&per_page=1", {
      headers: auth_headers
    })
    .then(resp => { return resp.json(); })
    .then(json => {
      let last = new Date(json[0]['commit']['committer']['date']);
      let now = new Date();
      let difference_in_s = (now - last) / 1000;
      if (difference_in_s > 180) {
        return fetch_new_data_and_save();
      } else {
        return fetch_existing_data();
      }
    })
}
