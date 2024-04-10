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

function changeLanguage(newLanguage) {
  addPrevLanguageCookie(getLanguageCookie());
  if (newLanguage === undefined || newLanguage === "" || newLanguage === null || newLanguage === "undefined") {
    newLanguage = "en";
  }
  addLanguageCookie(newLanguage);

  translateToLanguage(getPrevLanguageCookie(), getLanguageCookie());
}

function translateToLanguage(oldLanguage, newLanguage) {
  const newTranslation = translationsStored[newLanguage];
  if (newTranslation) {
    Object.keys(newTranslation).forEach((translationKey) => {
      const elements = getElementsById(translationKey);
      if (elements) {
        elements.forEach((element) => {
          element.textContent = newTranslation[translationKey];
          toggleDirAttribute(element, newLanguage);
        });
      }
      const elementsByTranslateId = getElementsByTranslateId(translationKey);
      if (elementsByTranslateId) {
        elementsByTranslateId.forEach((element) => {
          element.textContent = newTranslation[translationKey];
          toggleDirAttribute(element, newLanguage);
        });
      }
    });

    const elements = document.querySelectorAll("*");
    changeElementText(elements, oldLanguage, newLanguage);
    changeElementText(elements, "en", newLanguage);
  }
}

function changeElementText(elements, oldLanguage, newLanguage) {
  const mergedData = {};
  for (const subKey in translationsStored[oldLanguage]) {
    mergedData[translationsStored[oldLanguage][subKey]] = translationsStored[newLanguage][subKey];
  }

  elements.forEach((element) => {
    if (element.innerHTML === element.textContent) {
      const text = element.textContent.trim();
      if (text !== undefined && text !== "") {
        const replacementText = mergedData[text];

        if (replacementText !== undefined) {
          element.textContent = replacementText;
          toggleDirAttribute(element, newLanguage);
        } else {
          Object.keys(mergedData).forEach((key) => {
            if (text?.toLowerCase() === key?.toLowerCase()) {
              element.textContent = mergedData[key];
              toggleDirAttribute(element, newLanguage);
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
    addPrevLanguageCookie("en");
    addLanguageSelect(languagesStored, getLanguageCookie());
    translateToLanguage(getPrevLanguageCookie(), getLanguageCookie());
    detectDomChange((mutationList) => {
      mutationList.forEach((mutation) => {
        // TODO:
      });
    });
  });
});
