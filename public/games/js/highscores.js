const gamesEndpoint = "../../api/games";
const scoresEndpoint = "../../api/scores";
const usersEndpoint = "../../api/users";

async function issueGetGames() {
  const gamesData = await fetch(gamesEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return gamesData;
}

async function issueGetScores(gameId) {
  const scoresData = await fetch(`${scoresEndpoint}/${gameId}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return scoresData;
}

async function issueGetUsers(userIds) {
  const queryId = `${userIds.join("&id=")}`;
  const userUrlQuery = `${usersEndpoint}?id=${queryId}`;

  const users = await fetch(userUrlQuery, { headers: formatHeaders() }).then((r) => r.json());

  const parsedUsers = users.reduce((result, user) => {
    result[user.id] = `${user.firstname} ${user.lastname}`;
    return result;
  }, {});
  return parsedUsers;
}

async function displayGameScoreTable(game, scoreData, usersData) {
  const containerDiv = document.getElementById("scores");

  const outerDiv = document.createElement("div");
  outerDiv.align = "center";

  const headerContainer = document.createElement("div");
  headerContainer.classList.add("header-container");
  const heading = document.createElement("h2");
  heading.textContent = `Game: ${game}`;

  const urlNode = document.createElement("a");
  urlNode.classList.add("play-button");
  urlNode.href = `${game.toLowerCase().replaceAll(" ", "-")}.html`;
  const labelText = document.createTextNode("Play!🎮");
  urlNode.appendChild(labelText);
  headerContainer.appendChild(heading);
  headerContainer.appendChild(urlNode);
  outerDiv.appendChild(headerContainer);

  if (scoreData.length === 0) {
    const noDataHeader = document.createElement("h3");
    noDataHeader.textContent = "No Data";

    outerDiv.appendChild(noDataHeader);
  } else {
    const innerDiv = document.createElement("div");
    innerDiv.align = "center";
    innerDiv.id = "container";
    const table = document.createElement("table");
    table.classList.add("table-bor");
    table.id = `game-${game}`;

    // header:
    const row = document.createElement("tr");
    const userHeader = document.createElement("th");
    const userHeaderText = document.createTextNode("User Name");
    userHeader.style.textAlign = "center";
    userHeader.appendChild(userHeaderText);
    row.appendChild(userHeader);
    const scoreHeader = document.createElement("th");
    const scoreHeaderText = document.createTextNode("Score");
    scoreHeader.style.textAlign = "center";
    scoreHeader.appendChild(scoreHeaderText);
    row.appendChild(scoreHeader);
    table.appendChild(row);

    for (const score of scoreData) {
      const row = document.createElement("tr");

      const labelCell = document.createElement("td");
      const urlNode = document.createElement("a");
      urlNode.href = `user.html?id=${score.user_id}`;
      const labelText = document.createTextNode(usersData[score.user_id]);
      urlNode.appendChild(labelText);

      labelCell.style.textAlign = "center";
      labelCell.appendChild(urlNode);
      row.appendChild(labelCell);
      const scoreCell = document.createElement("td");

      let scoreText = "";
      if (score.time !== undefined && score.size !== undefined) {
        scoreText = document.createTextNode(`${score.score} (time: ${score.time}, size: ${score.size})`);
        scoreCell.appendChild(scoreText);
      } else {
        scoreText = document.createTextNode(score.score);
      }

      scoreCell.style.textAlign = "center";
      scoreCell.appendChild(scoreText);
      row.appendChild(scoreCell);

      table.appendChild(row);
    }

    innerDiv.appendChild(table);
    outerDiv.appendChild(innerDiv);
  }
  containerDiv.appendChild(outerDiv);
}

async function displayGameScores(gameData) {
  issueGetScores(gameData.id).then((scores) => {
    const userIds = scores.map((score) => score.user_id);
    issueGetUsers(userIds).then((usersData) => {
      scores.sort((a, b) => b.score - a.score);
      displayGameScoreTable(gameData.name, scores, usersData);
    });
  });
}

async function displayData() {
  issueGetGames().then((gamesData) => {
    for (const gameData of gamesData) {
      displayGameScores(gameData);
    }
  });
}

displayData();
