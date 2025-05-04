// Shared language switcher and translation logic for all subpages
let translations = {};
let currentLang = "en";
async function loadLanguages() {
  const res = await fetch("/api/practice/lang/v1/languages");
  return res.json();
}
async function loadTranslations() {
  const res = await fetch("/api/practice/lang/v1/translations");
  return res.json();
}
function updateTexts() {
  const t = translations[currentLang] || {};
  for (const key in t) {
    const el = document.getElementById(key);
    if (el) el.textContent = t[key];
  }
  // Update placeholders for elements with data-translate-placeholder
  document.querySelectorAll("[data-translate-placeholder]").forEach((el) => {
    const placeholderKey = el.getAttribute("data-translate-placeholder");
    if (t[placeholderKey]) {
      el.placeholder = t[placeholderKey];
    }
  });
  document.title = t.title || "Practice Page";
}
function setLanguageCookie(lang) {
  document.cookie = `lang_gad_practice=${lang}; path=/; max-age=31536000`;
}
function getLanguageCookie() {
  const match = document.cookie.match(/(?:^|; )lang_gad_practice=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
window.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".langpr-container");
  const skeleton = document.getElementById("langpr-skeleton");
  if (container) container.style.display = "none";
  if (skeleton) skeleton.style.display = "";
  const select = document.getElementById("lang-select");
  if (!select) return;
  // Set initial language from cookie if available
  const cookieLang = getLanguageCookie();
  if (cookieLang) currentLang = cookieLang;
  select.addEventListener("change", function () {
    currentLang = this.value;
    setLanguageCookie(currentLang);
    updateTexts();
  });
  (async function init() {
    const langs = await loadLanguages();
    for (const code in langs) {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = langs[code];
      select.appendChild(opt);
    }
    translations = await loadTranslations();
    select.value = currentLang;
    updateTexts();
    if (container) container.style.display = "";
    if (skeleton) skeleton.style.display = "none";
  })();

  // Interactive translation logic
  const userText = document.getElementById("user_text");
  const outputBlock = document.getElementById("output_block");
  const reverseBtn = document.getElementById("reverse_btn");
  const clearBtn = document.getElementById("clear_btn");
  if (reverseBtn && userText && outputBlock) {
    reverseBtn.onclick = () => {
      outputBlock.textContent = userText.value.split("").reverse().join("");
    };
    clearBtn.onclick = () => {
      userText.value = "";
      outputBlock.textContent = "";
    };
  }

  // Simple language quiz logic
  const quizData = [
    {
      q: {
        en: "What is the Polish word for 'language'?",
        pl: "Jak jest po angielsku słowo 'język'?",
        de: "Was ist das polnische Wort für 'Sprache'?",
      },
      options: [
        { en: "język", pl: "language", de: "język" },
        { en: "książka", pl: "book", de: "książka" },
        { en: "dom", pl: "house", de: "dom" },
      ],
      answer: 0,
    },
    {
      q: {
        en: "Which language is this page available in?",
        pl: "W jakich językach dostępna jest ta strona?",
        de: "In welchen Sprachen ist diese Seite verfügbar?",
      },
      options: [
        { en: "English and Polish", pl: "Angielski i polski", de: "Englisch, Polnisch und Deutsch" },
        { en: "Only English", pl: "Tylko angielski", de: "Nur Englisch" },
        { en: "Only Polish", pl: "Tylko polski", de: "Nur Polnisch" },
      ],
      answer: 0,
    },
  ];
  let quizIndex = 0;
  function renderQuiz() {
    const quizTitle = document.getElementById("quiz_title");
    const quizQuestion = document.getElementById("quiz_question");
    const quizOptions = document.getElementById("quiz_options");
    const quizResult = document.getElementById("quiz_result");
    if (!quizQuestion || !quizOptions || !quizResult) return;
    quizResult.textContent = "";
    const q = quizData[quizIndex];
    // Use fallback to English if translation is missing
    quizQuestion.textContent = q.q[currentLang] || q.q["en"] || "";
    quizOptions.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt[currentLang] || opt["en"] || "";
      btn.style.margin = "0.5em";
      btn.classList.add("langpr-button");
      btn.onclick = () => {
        let correctMsg = translations[currentLang]?.quiz_correct || translations["en"]?.quiz_correct || "Correct!";
        let tryAgainMsg =
          translations[currentLang]?.quiz_try_again || translations["en"]?.quiz_try_again || "Try again.";
        quizResult.textContent = i === q.answer ? correctMsg : tryAgainMsg;
      };
      quizOptions.appendChild(btn);
    });
  }
  if (document.getElementById("quiz_title")) {
    renderQuiz();
  }
  // Update quiz on language change
  const origUpdateTexts = updateTexts;
  updateTexts = function () {
    origUpdateTexts();
    if (document.getElementById("quiz_title")) renderQuiz();
  };

  // Number guessing game logic
  let secret = Math.floor(Math.random() * 20) + 1;
  let attempts = 0;
  const guessInput = document.getElementById("guess_input");
  const guessBtn = document.getElementById("guess_btn");
  const resetGameBtn = document.getElementById("reset_game_btn");
  const gameResult = document.getElementById("game_result");
  function resetGame() {
    secret = Math.floor(Math.random() * 20) + 1;
    attempts = 0;
    if (guessInput) guessInput.value = "";
    if (gameResult) gameResult.textContent = "";
  }
  if (guessBtn && guessInput && gameResult) {
    guessBtn.onclick = () => {
      const val = parseInt(guessInput.value, 10);
      attempts++;
      if (isNaN(val) || val < 1 || val > 20) {
        gameResult.textContent = currentLang === "pl" ? "Podaj liczbę od 1 do 20." : "Enter a number from 1 to 20.";
      } else if (val === secret) {
        gameResult.textContent =
          (currentLang === "pl" ? "Brawo! Zgadłeś w " : "Congratulations! You guessed in ") +
          attempts +
          (currentLang === "pl" ? " próbach." : " attempts.");
      } else if (val < secret) {
        gameResult.textContent = currentLang === "pl" ? "Za mało!" : "Too low!";
      } else {
        gameResult.textContent = currentLang === "pl" ? "Za dużo!" : "Too high!";
      }
    };
    resetGameBtn.onclick = resetGame;
  }

  // Color picker logic
  const colorInput = document.getElementById("color_input");
  const colorPreview = document.getElementById("color_preview");
  const colorResult = document.getElementById("color_result");
  if (colorInput && colorPreview && colorResult) {
    colorPreview.style.background = colorInput.value;
    colorInput.oninput = function () {
      colorPreview.style.background = colorInput.value;
      colorResult.textContent = (currentLang === "pl" ? "Wybrany kolor: " : "Selected color: ") + colorInput.value;
    };
  }

  function drawAboutChart(customValues) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    let values = [20, 40, 60, 80, 100];
    if (Array.isArray(customValues) && customValues.length === 5) {
      values = customValues.map((v) => (isNaN(v) ? 0 : Number(v)));
    }
    const data = google.visualization.arrayToDataTable([
      [
        translations[currentLang]?.about_chart_month || "Month",
        translations[currentLang]?.about_chart_progress || "Progress",
      ],
      ...months.map((m, i) => [m, values[i]]),
    ]);
    const options = {
      title: translations[currentLang]?.about_chart_title || "Project Progress",
      legend: { position: "none" },
      colors: ["#2a6edb"],
      hAxis: { title: translations[currentLang]?.about_chart_month || "Month" },
      vAxis: { minValue: 0, maxValue: 100 },
    };
    const chart = new google.visualization.ColumnChart(document.getElementById("about_chart"));
    chart.draw(data, options);
  }

  // ABOUT PAGE INTERACTIVES (add chart and team)
  if (document.getElementById("about_chart")) {
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(() => drawAboutChart());
    const generateBtn = document.getElementById("about_chart_generate");
    if (generateBtn) {
      generateBtn.onclick = () => {
        const jan = parseInt(document.getElementById("progress_jan").value, 10);
        const feb = parseInt(document.getElementById("progress_feb").value, 10);
        const mar = parseInt(document.getElementById("progress_mar").value, 10);
        const apr = parseInt(document.getElementById("progress_apr").value, 10);
        const may = parseInt(document.getElementById("progress_may").value, 10);
        drawAboutChart([jan, feb, mar, apr, may]);
      };
    }
  }
  const aboutTeamBtn = document.getElementById("about_team_btn");
  const aboutTeamList = document.getElementById("about_team_list");
  if (aboutTeamBtn && aboutTeamList) {
    const team = [
      { name: "Anna", role: { en: "Developer", pl: "Programistka", de: "Entwicklerin" } },
      { name: "Jan", role: { en: "Tester", pl: "Tester", de: "Tester" } },
      { name: "Maria", role: { en: "Designer", pl: "Projektantka", de: "Designerin" } },
    ];
    let shown = false;
    aboutTeamBtn.onclick = () => {
      shown = !shown;
      aboutTeamList.style.display = shown ? "" : "none";
      aboutTeamBtn.textContent = shown
        ? translations[currentLang]?.about_team_hide || "Hide Team"
        : translations[currentLang]?.about_team_show || "Show Team";
      if (shown) {
        aboutTeamList.innerHTML = team
          .map((member) => `<li>${member.name} - ${member.role[currentLang] || member.role["en"]}</li>`)
          .join("");
      }
    };
  }

  // CONTACT PAGE INTERACTIVES (add poll and time)
  let contactPollVotes = { search: 0, friend: 0, other: 0 };
  document.querySelectorAll(".contact-poll-btn").forEach((btn) => {
    btn.onclick = () => {
      const poll = btn.dataset.poll;
      contactPollVotes[poll]++;
      const res = document.getElementById("contact_poll_result");
      if (res)
        res.textContent =
          (translations[currentLang]?.contact_poll_result || "Votes: ") +
          `${translations[currentLang]?.contact_poll_search || "Search Engine"}: ${contactPollVotes.search}, ` +
          `${translations[currentLang]?.contact_poll_friend || "Friend"}: ${contactPollVotes.friend}, ` +
          `${translations[currentLang]?.contact_poll_other || "Other"}: ${contactPollVotes.other}`;
    };
  });
  const contactTimeBtn = document.getElementById("contact_time_btn");
  const contactTimeResult = document.getElementById("contact_time_result");
  if (contactTimeBtn && contactTimeResult) {
    contactTimeBtn.onclick = () => {
      const now = new Date();
      contactTimeResult.textContent = now.toLocaleTimeString();
    };
  }

  // FAQ PAGE INTERACTIVES (add survey and joke)
  const faqSurveyBtn = document.getElementById("faq_survey_btn");
  const faqSurveyInput = document.getElementById("faq_survey_input");
  const faqSurveyResult = document.getElementById("faq_survey_result");
  if (faqSurveyBtn && faqSurveyInput && faqSurveyResult) {
    faqSurveyBtn.onclick = () => {
      if (faqSurveyInput.value) {
        faqSurveyResult.textContent = translations[currentLang]?.faq_survey_thanks || "Thank you for your suggestion!";
        faqSurveyInput.value = "";
      } else {
        faqSurveyResult.textContent = translations[currentLang]?.faq_survey_error || "Please enter a topic.";
      }
    };
  }
  const jokes = {
    en: [
      "Why did the developer go broke? Because he used up all his cache!",
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "How do you comfort a JavaScript bug? You console it.",
    ],
    pl: [
      "Dlaczego programista zbankrutował? Bo wyczerpał cały cache!",
      "Dlaczego programiści wolą tryb ciemny? Bo światło przyciąga bugi!",
      "Jak pocieszyć buga w JavaScript? Pociesz go w konsoli.",
    ],
    de: [
      "Warum ist der Entwickler pleite gegangen? Weil er seinen ganzen Cache verbraucht hat!",
      "Warum bevorzugen Programmierer den Dunkelmodus? Weil Licht Bugs anzieht!",
      "Wie tröstet man einen JavaScript-Bug? Man konsolet ihn.",
    ],
  };
  const faqJokeBtn = document.getElementById("faq_joke_btn");
  const faqJokeResult = document.getElementById("faq_joke_result");
  if (faqJokeBtn && faqJokeResult) {
    faqJokeBtn.onclick = () => {
      const arr = jokes[currentLang] || jokes["en"];
      faqJokeResult.textContent = arr[Math.floor(Math.random() * arr.length)];
    };
  }
});
