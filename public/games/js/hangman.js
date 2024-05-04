const maxAttempts = 6;
const gameContainer = document.getElementById("game-container");
const lettersContainer = document.getElementById("letters");
const infoContainer = document.getElementById("info-container");
const startButton = document.getElementById("start-button");
const hangmanEndpoint = "../../api/hangman/random";
const hangmanScoreEndpoint = "../../api/hangman/score";

let selectedWord = "";
let hiddenWord = [];
let wrongAttempts = 0;

async function selectWord() {
  const questionsUrl = hangmanEndpoint;
  let selectedWordData = await Promise.all(
    [questionsUrl].map((url) =>
      fetch(url, { headers: formatHeaders() }).then((r) => {
        return r.json().then((json) => {
          return {
            json,
            status: r.status,
          };
        });
      })
    )
  );
  selectedWordData = selectedWordData[0];

  if (selectedWordData.status !== 200) {
    gameContainer.innerHTML = "<strong>⛔ Please log in and return to this page ⛔</strong>";
    return false;
  } else {
    selectedWord = selectedWordData.json.word;
    hiddenWord = Array(selectedWord.length).fill("_");
    return true;
  }
}

function updateWordDisplay() {
  const wordDisplay = document.getElementById("word");
  wordDisplay.textContent = hiddenWord.join(" ");
}

function updateHangmanDisplay() {
  const hangmanDisplay = document.getElementById("hangman");
  const hangmanAscii = [
    " _________",
    " |       |",
    ` |       ${wrongAttempts >= 1 ? "O" : ""}`,
    ` |      ${wrongAttempts >= 3 ? "/" : " "}${wrongAttempts >= 2 ? "|" : " "}${wrongAttempts >= 4 ? "\\" : " "}`,
    ` |      ${wrongAttempts >= 5 ? "/" : " "} ${wrongAttempts >= 6 ? "\\" : " "}`,
    "_|_",
  ];
  hangmanDisplay.textContent = hangmanAscii.join("\n");
}

function handleLetterClick(letter) {
  if (selectedWord.toLowerCase().includes(letter.toLowerCase())) {
    for (let i = 0; i < selectedWord.length; i++) {
      if (selectedWord[i].toLowerCase() === letter.toLowerCase()) {
        hiddenWord[i] = letter;
      }
    }
  } else {
    wrongAttempts++;
    updateHangmanDisplay();
  }

  updateWordDisplay();

  if (hiddenWord.join("").toLowerCase() === selectedWord.toLowerCase()) {
    displayFinalScore(true, wrongAttempts, selectedWord);
  } else if (wrongAttempts === maxAttempts) {
    displayFinalScore(false, wrongAttempts, selectedWord);
  }
}

function resetGame() {
  selectWord();
  wrongAttempts = 0;
  updateHangmanDisplay();
  updateWordDisplay();
  updateLetterButtons();
}

function updateLetterButtons() {
  lettersContainer.innerHTML = "";

  for (let letter = 65; letter <= 90; letter++) {
    const letterButton = document.createElement("button");
    letterButton.textContent = String.fromCharCode(letter);
    letterButton.id = `btn-${letterButton.textContent}`;
    letterButton.classList.add("letter");
    letterButton.addEventListener("click", () => handleLetterClick(letterButton.textContent));
    lettersContainer.appendChild(letterButton);
  }
  // add space:
  const letterButton = document.createElement("button");
  letterButton.textContent = String.fromCharCode(32);
  letterButton.id = `btn-SPACE`;
  letterButton.classList.add("letter");
  letterButton.addEventListener("click", () => handleLetterClick(letterButton.textContent));
  lettersContainer.appendChild(letterButton);
  gameContainer.style.height = "visible";
}

async function issuePostScoreRequest(score) {
  fetch(hangmanScoreEndpoint, {
    method: "POST",
    body: JSON.stringify({ score }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

async function displayFinalScore(success, attempts, selectedWord) {
  infoContainer.style.visibility = "visible";
  if (success) {
    let score = (maxAttempts - attempts) * 5 + selectedWord.length * 3;
    infoContainer.innerHTML = `<strong>Congratulations! Only ${attempts} attempts! Score: ${score}</strong>`;
    issuePostScoreRequest(score);
  } else {
    infoContainer.innerHTML = `<strong>You failed! Selected word was: ${selectedWord}</strong>`;
    issuePostScoreRequest(0);
  }
  startButton.style.visibility = "visible";
  lettersContainer.style.visibility = "collapse";
}

async function startQuiz() {
  infoContainer.innerHTML = `<strong>_</strong>`;
  wrongAttempts = 0;
  selectWord().then((result) => {
    if (result) {
      updateWordDisplay();
      updateLetterButtons();
      updateHangmanDisplay();
      gameContainer.style.visibility = "visible";
      startButton.style.visibility = "collapse";
      infoContainer.style.visibility = "collapse";
      lettersContainer.style.visibility = "visible";
    }
  });
}

gameContainer.style.visibility = "collapse";
