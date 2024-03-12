const translationsEndpoint = "../../api/translations";
let translationsStored = {};

async function issueGetTranslations() {
  const translations = await fetch(translationsEndpoint, {
    headers: { ...formatHeaders(), userid: getId() },
  }).then((r) => r.json());
  return translations;
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
  document.cookie = `lang=${value?.toLowerCase()}; path=/`;
}

function changeLanguage(language) {
  addLanguageCookie(language);
  const translation = translationsStored[language];
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

function detectDomChange(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document, { childList: true, subtree: true });
}

issueGetTranslations().then((translations) => {
  translationsStored = translations;
  addLanguageSelect(getLanguage());
  changeLanguage(getLanguage());
});
