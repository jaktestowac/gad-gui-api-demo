const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const cells = document.querySelectorAll(".cell");
const joinButton = document.getElementById("join-button");
const sessionCodeInput = document.getElementById("session-code");
const messageLbl = document.getElementById("messageLbl");
let yourPlayerMarker = "✅";
let simpleSuccessBox = "simpleSuccessBox";
let simpleErrorBox = "simpleErrorBox";
let simpleInfoBox = "simpleInfoBox";

const startEndpoint = "../../api/tic-tac-toe/start";
const joinEndpoint = "../../api/tic-tac-toe/join";
const statusEndpoint = "../../api/tic-tac-toe/status";
const stopEndpoint = "../../api/tic-tac-toe/stop";
const baseInterval = 1500;
let gameInterval;
let myTurn = false;

async function issuePostStartRequest() {
  const session = fetch(startEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return session;
}

async function issueGetStatusRequest(code) {
  const session = fetch(statusEndpoint + "/" + code, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return session;
}

async function issuePostStatusRequest(code, move) {
  const body = { code, move };
  const session = fetch(statusEndpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return session;
}

async function issuePostStopRequest(code) {
  const session = fetch(stopEndpoint, {
    method: "POST",
    body: JSON.stringify({ code: code }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return session;
}

async function issuePostJoinRequest(code) {
  const session = fetch(joinEndpoint, {
    method: "POST",
    body: JSON.stringify({ code: code }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((r) => r.json());
  return session;
}

function gameStatusListener() {
  const sessionCode = sessionCodeInput.value;

  if (sessionCode === "" || sessionCode === undefined) {
    resetGame();
    return;
  }

  issueGetStatusRequest(sessionCode).then((session) => {
    if (session === undefined || session === null) {
      setMessage(`Game ended`, simpleInfoBox);
      resetGame();
    }

    if (session?.error !== undefined) {
      setMessage("Error: " + session.error.message, simpleErrorBox);
    }

    const listOfUsers =
      session !== undefined
        ? Object.values(session.users).map((userId) => {
            `${userId}` > 0;
          })
        : 0;
    if (listOfUsers.length < 2) {
      setMessage("Waiting for other players", simpleErrorBox);
    } else {
      const currentPlayer = session.currentTurn % 2;

      const currentPlayerId = session.users[currentPlayer];

      myTurn = `${currentPlayerId}` === `${getId()}`;

      setMessage(
        `Current player: ${myTurn ? `<strong>You (${yourPlayerMarker})</strong>` : "Opponent"}`,
        simpleInfoBox
      );
      updateBoard(session.board);
    }

    if (session.hasEnded === true) {
      const winnerId = getKeyForBiggestValue(session.scores);

      if (winnerId === undefined) {
        setMessage(`Game ended in a draw`, simpleInfoBox);
      } else {
        const winner = `${session.users[winnerId]}` === `${getId()}` ? "You!" : "Opponent";
        setMessage(`Game ended. Winner: ${winner}`, simpleInfoBox);
      }

      resetGame();
    }
  });
}

function getKeyForBiggestValue(obj) {
  const values = Object.values(obj);
  const max = Math.max(...values);
  const keys = Object.keys(obj);
  const maxIndex = values.indexOf(max);

  if (values.every((value) => value === max)) {
    return undefined;
  }

  return keys[maxIndex];
}

function updateBoard(boardArray) {
  cells.forEach((cell, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const cellValue = boardArray[row][col];
    if (cellValue !== "") {
      cell.textContent = `${cellValue}` === `${getId()}` ? yourPlayerMarker : "❌";
    }
  });
}

function setMessage(msg, className) {
  messageLbl.innerHTML = `<div class="${className}">${msg}</div>`;
}

function joinGame() {
  const sessionCode = sessionCodeInput.value;
  if (sessionCode === "" || sessionCode === undefined) {
    setMessage("Session code is required", simpleErrorBox);
    return;
  }

  issuePostJoinRequest(sessionCode).then((session) => {
    if (session.error !== undefined) {
      setMessage("Error: " + session.error.message, simpleErrorBox);
    } else {
      setMessage("Joined the game", simpleSuccessBox);
      prepareBoard(session);
    }
  });
}

function stopGame() {
  const sessionCode = sessionCodeInput.value;
  issuePostStopRequest(sessionCode).then((session) => {
    setMessage(`Game stopped`, simpleInfoBox);
    resetGame();
  });
}

function startGame() {
  issuePostStartRequest().then((session) => {
    prepareBoard(session);
  });
}

function prepareBoard(session) {
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.addEventListener("click", handleCellClick, { once: true });
  });
  startButton.disabled = true;
  joinButton.disabled = true;
  sessionCodeInput.disabled = true;
  stopButton.disabled = false;
  sessionCodeInput.value = session?.code;
  gameInterval = setInterval(gameStatusListener, baseInterval);
}

function handleCellClick(event) {
  if (myTurn === false) {
    return;
  }
  const cell = event.target;
  cell.textContent = yourPlayerMarker;

  const coords = cell.getAttribute("coords");

  const parsedCoords = coords.split(",").map(Number);

  const sessionCode = sessionCodeInput.value;
  issuePostStatusRequest(sessionCode, parsedCoords).then((session) => {});
}

function resetGame() {
  clearInterval(gameInterval);
  cells.forEach((cell) => {
    cell.removeEventListener("click", handleCellClick);
  });
  startButton.disabled = false;
  joinButton.disabled = false;
  sessionCodeInput.disabled = false;
  stopButton.disabled = true;
  sessionCodeInput.value = "";
}

sessionCodeInput.value = "";
