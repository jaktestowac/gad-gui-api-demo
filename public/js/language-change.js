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

function getPrevLanguage() {
  // return getCookie("langPrev=");
  const langData = getSession("languagePrevious");
  return langData?.langPrevious;
}

function getLanguage() {
  // return getCookie("lang=");
  const langData = getSession("language");
  return langData?.lang;
}

function addPrevLanguage(value) {
  // addCookie("langPrev", value);
  const langData = { langPrevious: value };
  saveSession("languagePrevious", langData);
}

function addLanguage(value) {
  // addCookie("lang", value);
  const langData = { lang: value };
  saveSession("language", langData);
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
  addPrevLanguage(getLanguage());
  if (newLanguage === undefined || newLanguage === "" || newLanguage === null || newLanguage === "undefined") {
    newLanguage = "en";
  }
  addLanguage(newLanguage);

  translateToLanguage(getPrevLanguage(), getLanguage());
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
    addPrevLanguage("en");
    addLanguageSelect(languagesStored, getLanguage());
    translateToLanguage(getPrevLanguage(), getLanguage());
    detectDomChange((mutationList) => {
      mutationList.forEach((mutation) => {
        // TODO:
      });
    });
  });
});
