const questionsEndpoint = "../../api/quiz/questions";
const questionsCheckEndpoint = "../../api/quiz/questions/check";
const quizStartEndpoint = "../../api/quiz/start";
const quizStopEndpoint = "../../api/quiz/stop";

let questionsData = [];

const questionContainer = document.getElementById("question-container");
const startButton = document.getElementById("start-button");
const quizContainer = document.getElementById("quiz-container");
const questionText = document.getElementById("question-text");
const optionCheckboxes = document.querySelectorAll(".option-checkbox");
const optionTexts = document.querySelectorAll(".option-text");
const scoreElement = document.getElementById("score");
const currentQuestionElement = document.getElementById("current-question");
const totalQuestionsElement = document.getElementById("total-questions");

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

let currentQuestionIndex = 0;
let score = 0;

function getQuestionText(idx) {
  return questionsData[idx].question;
}
function getQuestionOptions(idx) {
  return questionsData[idx].options;
}

async function issueGetRequest() {
  const questionsUrl = questionsEndpoint;
  questionsData = await Promise.all(
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
  questionsData = questionsData[0];
  if (questionsData.status !== 200) {
    quizContainer.innerHTML = "<strong>⛔ Please log in and return to this page ⛔</strong>";
  } else {
    questionsData = questionsData.json;
    showQuestion();
  }
}

async function issueStartRequest() {
  fetch(quizStartEndpoint, {
    method: "GET",
    headers: {
      Authorization: getBearerToken(),
    },
  });
}

async function issueStopRequest() {
  fetch(quizStopEndpoint, {
    method: "GET",
    headers: {
      Authorization: getBearerToken(),
    },
  });
}

function showQuestion() {
  const currentQuestionText = getQuestionText(currentQuestionIndex);
  questionText.textContent = currentQuestionText;

  const shuffledOptions = shuffleArray([...getQuestionOptions(currentQuestionIndex)]);

  for (let i = 0; i < optionTexts.length; i++) {
    optionTexts[i].textContent = shuffledOptions[i];
    optionCheckboxes[i].checked = false;
  }

  currentQuestionElement.textContent = currentQuestionIndex + 1;
  totalQuestionsElement.textContent = questionsData.length;
}

async function checkAnswer() {
  const selectedAnswers = [];
  for (let i = 0; i < optionCheckboxes.length; i++) {
    if (optionCheckboxes[i].checked) {
      selectedAnswers.push(optionTexts[i].textContent);
    }
  }
  const data = {
    questionText: getQuestionText(currentQuestionIndex),
    selectedAnswers,
  };
  fetch(questionsCheckEndpoint, {
    method: "post",
    body: JSON.stringify(data),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((response) => {
    if (response.status !== 200) {
      // TODO:
    }

    response.json().then((json) => {
      // Old logic with score on UI:
      // const isCorrect = json["isCorrect"] ?? false;
      // if (isCorrect) {
      //   score++;
      //   scoreElement.textContent = score;
      // }
      score = json["score"];
      scoreElement.textContent = score;
      currentQuestionIndex++;
      if (currentQuestionIndex < questionsData.length) {
        showQuestion();
      } else {
        issueStopRequest().then(() => {
          displayFinalScore(score);
        });
      }
    });
  });
}

function displayFinalScore(score) {
  questionContainer.innerHTML = `<strong>Congratulations! You've completed the quiz. Your score: ${score} points!</strong><br><br>`;
  if (score === questionsData.length) {
    questionContainer.innerHTML += `Congratulations!<br>You got a perfect score!<br>You're a true expert in this field!🏆🥇`;
  } else if (score >= questionsData.length * 0.8) {
    questionContainer.innerHTML += `Great job!<br>You scored excellently on the quiz.<br>Your knowledge is impressive!🥈`;
  } else if (score >= questionsData.length * 0.5) {
    questionContainer.innerHTML += `Well done!<br>You've got a good score on the quiz.<br>Keep up the good work!🥉`;
  } else if (score >= questionsData.length * 0.3) {
    questionContainer.innerHTML += `Nice effort!<br>Your score shows a decent understanding of the topic.<br>Keep learning!👏`;
  } else {
    questionContainer.innerHTML += `Good start!<br>There's room for improvement.<br>Keep studying and practicing for better results next time!📚`;
  }
}

questionContainer.style.visibility = "collapse";

async function startQuiz() {
  await issueStartRequest();
  await issueGetRequest();
  questionContainer.style.visibility = "visible";
  startButton.style.visibility = "collapse";
}
