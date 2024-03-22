const translationsEndpoint = "../../api/languages/translations";
const languagesEndpoint = "../../api/languages";
let previousLanguage = undefined;

let translationsStored = {};
let languagesStored = {};

async function issueGetTranslations() {
  const translations = await fetch(translationsEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return translations;
}

async function issueGetLanguages() {
  const languages = await fetch(languagesEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return languages;
}

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
  document.cookie = `lang=${value?.toLowerCase()}; SameSite=Lax; path=/`;
}

function changeLanguage(language) {
  addLanguageCookie(language);
  const translation = translationsStored[language];
  if (translation) {
    replaceLanguageText(translationsStored, previousLanguage, language);
    Object.keys(translation).forEach((translationKey) => {
      const elements = getElementsById(translationKey);
      if (elements) {
        elements.forEach((element) => {
          element.textContent = translation[translationKey];
        });
      }
      const elementsByTranslateId = getElementsByTranslateId(translationKey);
      if (elementsByTranslateId) {
        elementsByTranslateId.forEach((element) => {
          element.textContent = translation[translationKey];
        });
      }
    });
  }
  previousLanguage = getLanguage();
}

function getElementsById(id) {
  return Array.from(document.querySelectorAll(`[id="${id}"]`));
}

function getElementsByTranslateId(id) {
  return Array.from(document.querySelectorAll(`[translateId="${id}"]`));
}

function detectDomChange(callback) {
  var config = { attributes: false, childList: true, characterData: false, subtree: true };

  const observer = new MutationObserver(callback);
  observer.observe(document, config);
}

function getTranslatedText(elementId) {
  return translationsStored[elementId];
}

issueGetTranslations().then((translations) => {
  issueGetLanguages().then((languages) => {
    languagesStored = languages;
    translationsStored = translations;
    addLanguageSelect(languagesStored, getLanguage());
    changeLanguage(getLanguage());
    detectDomChange(() => replaceLanguageText(translationsStored, "en", getLanguage()));
  });
});

function replaceLanguageText(languageData, previousLanguage, language) {
  console.log("replacing language text", previousLanguage, language);
  if (previousLanguage === undefined) {
    previousLanguage = "en";
  }
  if (previousLanguage === language) {
    return;
  }
  const elements = document.querySelectorAll("*");

  const mergedData = {};
  for (const subKey in languageData[previousLanguage]) {
    mergedData[languageData[previousLanguage][subKey]] = languageData[language][subKey];
  }

  elements.forEach((element) => {
    if (element.innerHTML === element.textContent) {
      const text = element.textContent.trim();

      if (text !== undefined && text !== "") {
        const replacementText = mergedData[text];

        if (replacementText !== undefined) {
          element.textContent = replacementText;
        } else {
          Object.keys(mergedData).forEach((key) => {
            if (text?.toLowerCase() === key?.toLowerCase()) {
              element.textContent = mergedData[key];
            }
          });
        }
      }
    }
  });
}
