function getLanguage() {
  let lang = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("lang=")) {
      lang = cookie.split("=")[1];
    }
  }
  return lang;
}

function addLanguageCookie(value) {
  document.cookie = `lang=${value?.toLowerCase()}; path=/`;
}

const translations = {
  en: {
    surveyStatsTitle: "Survey Stats",
    languageLabel: "Language:",
    englishOption: "🇬🇧 English",
    polishOption: "🇵🇱 Polish",
    categoryHeader: "Category",
    countHeader: "Count",
    btnArticles: "Articles",
    btnComments: "Comments",
    btnUsers: "Users",
    btnStats: "Stats",
    logoutBtn: "Logout",
    surveysHeader: "Surveys",
    btnSurveyStatistics: "Statistics",
    surveyStatisticsHeader: "Survey Statistics",
    btnTakeSurvey: "Take Survey",
    testingApiLabel: "Testing REST API",
  },
  pl: {
    surveyStatsTitle: "Statystyki Ankiet",
    languageLabel: "Język:",
    englishOption: "🇬🇧 Angielski",
    polishOption: "🇵🇱 Polski",
    categoryHeader: "Kategoria",
    countHeader: "Liczba",
    btnArticles: "Artykuły",
    btnComments: "Komentarze",
    btnUsers: "Użytkownicy",
    btnStats: "Statystyki",
    logoutBtn: "Wyloguj",
    surveysHeader: "Ankiety",
    btnSurveyStatistics: "Statystyki",
    surveyStatisticsHeader: "Statystyki Ankiet",
    btnTakeSurvey: "Wypełnij",
    testingApiLabel: "Testowanie REST API",
  },
};

function changeLanguage(language) {
  addLanguageCookie(language);
  const translation = translations[language];
  if (translation) {
    Object.keys(translation).forEach((translationKey) => {
      const elements = getElementsById(translationKey);
      if (elements) {
        elements.forEach((element) => {
          element.textContent = translation[translationKey];
        });
      }
    });
  }
}

function getElementsById(id) {
  return Array.from(document.querySelectorAll(`[id="${id}"]`));
}

addLanguageSelect(getLanguage());
changeLanguage(getLanguage());
