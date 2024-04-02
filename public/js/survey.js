const surveyQuestionsEndpoint = "../../api/surveys";
const surveyResponsesEndpoint = "../../api/surveys/responses";

const responses = {};

async function issueGetSurveyQuestions(type, id) {
  const surveyQuestionsData = await fetch(`${surveyQuestionsEndpoint}/${type}/questions/${id}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return surveyQuestionsData;
}

function pad(num, size = 2) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

async function issuePostSurveyResponses(responses) {
  const today = new Date();
  const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(
    today.getHours()
  )}:${pad(today.getMinutes())}:${pad(today.getSeconds())}Z`;

  const data = {
    answers: responses,
    type: surveyType,
    date: date,
    user_id: getId(),
  };
  fetch(surveyResponsesEndpoint, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
      userid: getId(),
    },
    body: JSON.stringify(data),
  }).then((response) => {
    if (response.status === 201 || response.status === 200) {
      showMessage(`<span translateId="thankYouMessage">Thank You!<span>`, false);
    } else {
      showMessage(`<span translateId="anErrorOccurredMessage">An error occurred!<span>`, true);
    }
  });
}

const showMessage = (message, isError = false) => {
  let alertElement = document.querySelector(".alert");
  alertElement.innerHTML = message;
  alertElement.classList.remove("alert-error", "alert-success");
  if (isError) {
    alertElement.classList.add("alert-error");
  } else {
    alertElement.classList.add("alert-success");
  }
  let newMessageElement = alertElement.cloneNode(true);
  alertElement.parentNode.replaceChild(newMessageElement, alertElement);
  alertElement = newMessageElement;
};

function parseQuestion(currentId) {
  const currentQuestion = document.getElementById("question-" + currentId);
  const key = currentQuestion.getAttribute("value");
  let inputValues = [];
  let nextQuestions = [];
  let textResponse = false;

  const inputElements = currentQuestion.querySelectorAll("input:checked");
  if (inputElements) {
    inputElements.forEach((inputElement) => {
      inputValues.push(inputElement.value);
      nextQuestions.push(inputElement.getAttribute("next"));
      inputElement.classList.add("selected");
      const labelElement = inputElement.nextElementSibling;
      labelElement.classList.add("selected");
    });
  }

  const textareaElement = currentQuestion.querySelector("textarea.body");
  if (textareaElement) {
    textResponse = true;
    inputValues = [textareaElement.value];
    nextQuestions.push(textareaElement.getAttribute("next"));

    textareaElement.disabled = true;
    textareaElement.innerHTML = textareaElement.value;
  }

  if (nextQuestions.length === 0 || inputValues.length === 0) {
    showMessage("Please select an option", true);
    return;
  }

  if (textResponse) {
    if (responses["Open-Ended Questions"] === undefined) {
      responses["Open-Ended Questions"] = {};
    }
    responses["Open-Ended Questions"][key] = inputValues;
  } else {
    responses[key] = inputValues;
  }

  const currentQuestionInputs = document.querySelectorAll(`#question-${currentId} input`);
  currentQuestionInputs.forEach((input) => {
    input.disabled = true;
  });

  const buttonNextElements = document.querySelectorAll("#buttonNext");
  buttonNextElements.forEach((element) => {
    element.style.display = "none";
  });

  const toRemoveElements = document.querySelectorAll("#toRemove");
  toRemoveElements.forEach((element) => {
    element.style.display = "none";
  });

  const uniqueNextQuestions = [...new Set(nextQuestions)];
  const lowestNextQuestions = Math.min(...uniqueNextQuestions);

  getQuestion(surveyType, lowestNextQuestions);
}

function finish() {
  const buttonFinish = document.getElementById("buttonFinish");
  buttonFinish.disabled = true;
  issuePostSurveyResponses(responses);
}

function start() {
  const buttonStart = document.getElementById("buttonStart");
  buttonStart.style.display = "none";
  getQuestion(surveyType, 1);
}

async function getQuestion(surveyType, id) {
  issueGetSurveyQuestions(surveyType, id).then((surveyQuestionsData) => {
    const questionContainer = document.getElementById("questionContainer");
    questionContainer.innerHTML += surveyQuestionsData.question;
  });
}

async function getSurveyDetails(surveyType) {
  issueGetSurveyQuestions(surveyType, 0).then((surveyQuestionsData) => {
    const surveyDetails = document.getElementById("surveyDetails");

    if (surveyQuestionsData.error?.message !== undefined) {
      surveyDetails.innerHTML = surveyQuestionsData.error?.message;
      const buttonStart = document.getElementById("buttonStart");
      buttonStart.style.display = "none";
      return;
    }

    if (surveyQuestionsData === undefined || Object.keys(surveyQuestionsData).length === 0) {
      surveyDetails.innerHTML = "<h3>Survey does not exists or was not published yet.</h3>";
      const buttonStart = document.getElementById("buttonStart");
      buttonStart.style.display = "none";
      return;
    }

    surveyDetails.innerHTML += surveyQuestionsData.question;
  });
}

let surveyType = getParams()["type"];
showMessage(`<span translateId="toStartSurveyMessage">To start press <strong>Start Survey</strong><span>`, false);
getSurveyDetails(surveyType);
