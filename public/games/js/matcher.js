const categories = document.querySelectorAll(".category");
const checkButton = document.getElementById("checkButton");
const descriptions = document.getElementById("descriptions");

const questionsAndAnswers = {
  "unit tests": ["Checking individual functions"],
  "functional tests": ["Testing user interactions"],
  "performance tests": ["Measuring system response time", "Assessing system speed"],
  "integration tests": ["Ensuring multiple components work together"],
  "acceptance tests": ["Validating if the software meets requirements"],
  "regression tests": ["Verifying that recent changes didn't break existing functionality"],
  "load tests": ["Testing system performance under heavy workloads"],
  "usability tests": ["Evaluating user-friendliness and user experience"],
  "compatibility tests": ["Ensuring software works on various platforms"],
  "security tests": [
    "Identifying vulnerabilities in the system",
    "Ensuring data protection",
    "Testing system security measures",
  ],
  "white-box tests": ["Testing with knowledge of internal code", "Verifying internal logic"],
  "black-box tests": ["Testing without knowledge of internal code", "Focusing on external functionality"],
  "smoke tests": [
    "Quick checks to identify major issues",
    "Verifying basic functionality",
    "Running after code changes",
  ],
};

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

const questions = Object.keys(questionsAndAnswers);
let questionsShuffled = shuffleArray(questions);
questionsShuffled = questionsShuffled.slice(0, 3);

questionsShuffled.forEach((question, index) => {
  const category = document.querySelector(`#category${index + 1}`);
  category.setAttribute("value", question);
  const categoryName = document.querySelector(`#category${index + 1} .name`);
  categoryName.innerText = question;
});

questionsShuffled.forEach((question, index) => {
  const answers = questionsAndAnswers[question];
  answers.forEach((answer, index) => {
    const description = document.createElement("div");
    description.textContent = answer;
    description.classList.add("test-description");
    description.setAttribute("draggable", "true");
    descriptions.appendChild(description);
  });
});

document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("test-description")) {
    e.dataTransfer.setData("text/plain", e.target.textContent);
  }
});

categories.forEach((category) => {
  category.addEventListener("dragover", (e) => {
    e.preventDefault();
    category.classList.add("highlight");
  });

  category.addEventListener("dragleave", () => {
    category.classList.remove("highlight");
  });

  category.addEventListener("drop", (e) => {
    e.preventDefault();
    category.classList.remove("highlight");
    const descriptionText = e.dataTransfer.getData("text/plain");
    const description = document.createElement("div");
    description.classList.add("test-answer");
    description.textContent = descriptionText;
    category.appendChild(description);

    const descriptions = document.querySelectorAll(".test-description");
    descriptions.forEach((description) => {
      const answerText = description.innerText;
      if (answerText === descriptionText) {
        description.remove();
      }
    });
  });
});

const includesAll = (arr, values) => values.every((v) => arr.includes(v));

checkButton.addEventListener("click", () => {
  categories.forEach((category) => {
    const categoryText = category.getAttribute("value");
    const answers = category.querySelectorAll(".test-answer");
    const correctAnswers = questionsAndAnswers[categoryText];

    // const answerTexts = Array.from(answers).map((x) => x.innerText);

    answers.forEach((answer) => {
      const answerText = answer.innerText;
      if (correctAnswers.includes(answerText)) {
        answer.classList.toggle("correct", answer.textContent.includes(answerText));
      } else {
        answer.classList.toggle("incorrect", answer.textContent.includes(answerText));
      }
    });
    const descriptions = document.querySelectorAll(".test-description");
    if (descriptions.length === 0) {
      const infoContainer = document.getElementById("info-container");
      const correct = document.querySelectorAll(".correct");
      const incorrect = document.querySelectorAll(".incorrect");
      const total = correct.length + incorrect.length;
      infoContainer.innerHTML = `<h2><strong>🎯Your score: ${correct.length} / ${total} answers were correct!🎯</strong></h2>`;
    }
  });
});
