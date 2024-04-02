const translationsEndpoint = "../../api/languages/translations";
const languagesEndpoint = "../../api/languages";

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

function getPrevLanguageCookie() {
  return getCookie("langPrev=");
}

function getLanguageCookie() {
  return getCookie("lang=");
}

function getCookie(cookieName) {
  let lang = undefined;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(cookieName)) {
      lang = cookie.split("=")[1];
    }
  }
  return lang;
}

function addCookie(cookieName, value) {
  document.cookie = `${cookieName}=${value?.toLowerCase()}; SameSite=Lax; path=/`;
}

function addPrevLanguageCookie(value) {
  addCookie("langPrev", value);
}

function addLanguageCookie(value) {
  addCookie("lang", value);
}

function toggleDirAttribute(element, language) {
  if (language === "fa") {
    element.setAttribute("dir", "rtl");
  } else {
    element.removeAttribute("dir");
  }
}

function changeLanguage(language) {
  addLanguageCookie(language);
  const translation = translationsStored[language];
  if (translation) {
    replaceLanguageText(translationsStored, getPrevLanguageCookie(), language);
    Object.keys(translation).forEach((translationKey) => {
      const elements = getElementsById(translationKey);
      if (elements) {
        elements.forEach((element) => {
          element.textContent = translation[translationKey];
          toggleDirAttribute(element, language);
        });
      }
      const elementsByTranslateId = getElementsByTranslateId(translationKey);
      if (elementsByTranslateId) {
        elementsByTranslateId.forEach((element) => {
          element.textContent = translation[translationKey];
          toggleDirAttribute(element, language);
        });
      }
    });
  }
  addPrevLanguageCookie(language);
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

function replaceLanguageText(languageData, previousLanguage, language) {
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
          toggleDirAttribute(element, language);
        } else {
          Object.keys(mergedData).forEach((key) => {
            if (text?.toLowerCase() === key?.toLowerCase()) {
              element.textContent = mergedData[key];
              toggleDirAttribute(element, language);
            }
          });
        }
      }
    }
  });
}

issueGetTranslations().then((translations) => {
  issueGetLanguages().then((languages) => {
    languagesStored = languages;
    translationsStored = translations;
    addLanguageSelect(languagesStored, getLanguageCookie());
    changeLanguage(getLanguageCookie());
    detectDomChange(() => replaceLanguageText(translationsStored, getPrevLanguageCookie(), getLanguageCookie()));
  });
});
