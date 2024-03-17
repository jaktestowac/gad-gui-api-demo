const surveyResponsesEndpoint = "../../api/surveys/responses";

async function issueGetSurveyResponses() {
  const surveyResponsesData = await fetch(`${surveyResponsesEndpoint}`, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());

  return surveyResponsesData;
}

function createTable(surveyResponsesData) {
  const table = document.createElement("table");
  table.classList.add("table-bor");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const questionHeader = document.createElement("th");
  const answerHeader = document.createElement("th");

  questionHeader.textContent = "Question";
  answerHeader.textContent = "Answer";

  headerRow.appendChild(questionHeader);
  headerRow.appendChild(answerHeader);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const question in surveyResponsesData) {
    const answer = surveyResponsesData[question];

    const row = document.createElement("tr");
    const questionCell = document.createElement("td");
    const answerCell = document.createElement("td");

    questionCell.textContent = question;

    if (!Array.isArray(answer)) {
      console.log("Answer is an array", answer);

      let innerTable = createTable(answer);
      answerCell.innerHTML = innerTable.outerHTML;
    } else {
      answerCell.textContent = Array.isArray(answer) ? answer.join(", ") : JSON.stringify(answer);
    }

    row.appendChild(questionCell);
    row.appendChild(answerCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  return table;
}

function displaySurveyResponses() {
  issueGetSurveyResponses().then((surveyResponsesData) => {
    for (const data of surveyResponsesData) {
      const table = createTable(data.answers);
      const surveyResponsesContainer = document.getElementById("surveyResponsesContainer");
      surveyResponsesContainer.appendChild(table);
    }
  });
}

displaySurveyResponses();
