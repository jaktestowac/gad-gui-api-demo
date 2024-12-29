const steps = document.querySelectorAll(".step");
const nextButton = document.getElementById("nextButton");
const prevButton = document.getElementById("prevButton");
const submitButton = document.getElementById("submitButton");
const summaryDiv = document.getElementById("summary");
const confirmationCheckbox = document.getElementById("confirmationCheckbox");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
let currentStep = 0;

const countrySelect = document.getElementById("country");
const citySelect = document.getElementById("city");
const citiesByCountry = {
  usa: [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Twin Peaks",
  ],
  canada: [
    "Toronto",
    "Vancouver",
    "Montreal",
    "Calgary",
    "Ottawa",
    "Edmonton",
    "Winnipeg",
    "Quebec City",
    "Hamilton",
    "London",
  ],
  poland: ["Warsaw", "Krakow", "Wroclaw", "Poznan", "Gdansk", "Szczecin", "Lublin", "Katowice", "Bialystok", "Gdynia"],
  germany: [
    "Berlin",
    "Hamburg",
    "Munich",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Dusseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
  ],
  france: [
    "Paris",
    "Marseille",
    "Lyon",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Montpellier",
    "Bordeaux",
    "Lille",
  ],
  italy: ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Catania"],
  spain: [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Seville",
    "Zaragoza",
    "Malaga",
    "Murcia",
    "Palma",
    "Las Palmas",
    "Bilbao",
  ],
  UK: [
    "London",
    "Birmingham",
    "Glasgow",
    "Liverpool",
    "Bristol",
    "Manchester",
    "Sheffield",
    "Leeds",
    "Edinburgh",
    "Leicester",
  ],
  japan: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama"],
  china: [
    "Shanghai",
    "Beijing",
    "Guangzhou",
    "Shenzhen",
    "Wuhan",
    "Dongguan",
    "Chongqing",
    "Chengdu",
    "Nanjing",
    "Tianjin",
  ],
  india: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"],
  brazil: [
    "Sao Paulo",
    "Rio de Janeiro",
    "Salvador",
    "Brasilia",
    "Fortaleza",
    "Belo Horizonte",
    "Manaus",
    "Curitiba",
    "Recife",
    "Porto Alegre",
  ],
  russia: [
    "Moscow",
    "Saint Petersburg",
    "Novosibirsk",
    "Yekaterinburg",
    "Nizhny Novgorod",
    "Kazan",
    "Chelyabinsk",
    "Omsk",
    "Samara",
    "Rostov-on-Don",
  ],
  australia: [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Gold Coast",
    "Newcastle",
    "Canberra",
    "Sunshine Coast",
    "Wollongong",
  ],
  mexico: [
    "Mexico City",
    "Ecatepec",
    "Guadalajara",
    "Puebla",
    "Juarez",
    "Tijuana",
    "Leon",
    "Zapopan",
    "Monterrey",
    "Nezahualcoyotl",
  ],
  indonesia: [
    "Jakarta",
    "Surabaya",
    "Bandung",
    "Medan",
    "Semarang",
    "Palembang",
    "Makassar",
    "Tangerang",
    "South Tangerang",
    "Depok",
  ],
  turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya", "Eskisehir", "Diyarbakir"],
  netherlands: [
    "Amsterdam",
    "Rotterdam",
    "The Hague",
    "Utrecht",
    "Eindhoven",
    "Tilburg",
    "Groningen",
    "Almere",
    "Breda",
    "Nijmegen",
  ],
  saudiArabia: [
    "Riyadh",
    "Jeddah",
    "Mecca",
    "Medina",
    "Dammam",
    "Tabuk",
    "Buraidah",
    "Khamis Mushait",
    "Abha",
    "Al-Kharj",
  ],
  switzerland: [
    "Zurich",
    "Geneva",
    "Basel",
    "Lausanne",
    "Bern",
    "Winterthur",
    "Lucerne",
    "St. Gallen",
    "Lugano",
    "Biel",
  ],
  sweden: [
    "Stockholm",
    "Gothenburg",
    "Malmo",
    "Uppsala",
    "Vasteras",
    "Orebro",
    "Linkoping",
    "Helsingborg",
    "Jonkoping",
    "Norrkoping",
  ],
  austria: [
    "Vienna",
    "Graz",
    "Linz",
    "Salzburg",
    "Innsbruck",
    "Klagenfurt",
    "Villach",
    "Wels",
    "Sankt Polten",
    "Dornbirn",
  ],
  norway: [
    "Oslo",
    "Bergen",
    "Stavanger",
    "Trondheim",
    "Drammen",
    "Fredrikstad",
    "Kristiansand",
    "Sandnes",
    "Tromso",
    "Sarpsborg",
  ],
  denmark: [
    "Copenhagen",
    "Aarhus",
    "Odense",
    "Aalborg",
    "Esbjerg",
    "Randers",
    "Kolding",
    "Horsens",
    "Vejle",
    "Roskilde",
  ],
  finland: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyvaskyla", "Lahti", "Kuopio", "Pori"],
  belgium: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liege", "Bruges", "Namur", "Leuven", "Mons", "Mechelen"],
  greece: [
    "Athens",
    "Thessaloniki",
    "Patras",
    "Heraklion",
    "Larissa",
    "Volos",
    "Rhodes",
    "Ioannina",
    "Chania",
    "Chalcis",
  ],
  portugal: [
    "Lisbon",
    "Porto",
    "Vila Nova de Gaia",
    "Amadora",
    "Braga",
    "Funchal",
    "Coimbra",
    "Setubal",
    "Queluz",
    "Aveiro",
  ],
  czechRepublic: [
    "Prague",
    "Brno",
    "Ostrava",
    "Plzen",
    "Liberec",
    "Olomouc",
    "Usti nad Labem",
    "Hradec Kralove",
    "Ceske Budejovice",
    "Pardubice",
  ],
  hungary: [
    "Budapest",
    "Debrecen",
    "Szeged",
    "Miskolc",
    "Pecs",
    "Gyor",
    "Nyiregyhaza",
    "Kecskemet",
    "Szekesfehervar",
    "Szombathely",
  ],
  ukraine: [
    "Kyiv",
    "Kharkiv",
    "Odesa",
    "Dnipro",
    "Donetsk",
    "Zaporizhzhia",
    "Lviv",
    "Kryvyi Rih",
    "Mykolaiv",
    "Mariupol",
  ],
  romania: [
    "Bucharest",
    "Cluj-Napoca",
    "Timisoara",
    "Iasi",
    "Craiova",
    "Constanta",
    "Galati",
    "Brasov",
    "Ploiesti",
    "Oradea",
  ],
  slovakia: [
    "Bratislava",
    "Kosice",
    "Presov",
    "Zilina",
    "Nitra",
    "Banska Bystrica",
    "Trnava",
    "Martin",
    "Trencin",
    "Poprad",
  ],
  croatia: [
    "Zagreb",
    "Split",
    "Rijeka",
    "Osijek",
    "Zadar",
    "Slavonski Brod",
    "Pula",
    "Sesvete",
    "Karlovac",
    "Varazdin",
  ],
  bulgaria: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven", "Dobrich", "Shumen"],
  serbia: [
    "Belgrade",
    "Novi Sad",
    "Nis",
    "Zemun",
    "Kragujevac",
    "Cacak",
    "Subotica",
    "Leskovac",
    "Novi Pazar",
    "Kraljevo",
  ],
  slovenia: ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj", "Trbovlje", "Kamnik"],
  lithuania: [
    "Vilnius",
    "Kaunas",
    "Klaipeda",
    "Siauliai",
    "Panevezys",
    "Alytus",
    "Marijampole",
    "Mazeikiai",
    "Jonava",
    "Utena",
  ],
  latvia: [
    "Riga",
    "Daugavpils",
    "Liepaja",
    "Jelgava",
    "Jurmala",
    "Ventspils",
    "Rezekne",
    "Jekabpils",
    "Valmiera",
    "Ogre",
  ],
  estonia: [
    "Tallinn",
    "Tartu",
    "Narva",
    "Parnu",
    "Kohtla-Jarve",
    "Viljandi",
    "Rakvere",
    "Maardu",
    "Sillamae",
    "Kuressaare",
  ],
  cyprus: [
    "Nicosia",
    "Limassol",
    "Larnaca",
    "Famagusta",
    "Paphos",
    "Kyrenia",
    "Protaras",
    "Morphou",
    "Aradippou",
    "Paralimni",
  ],
  malta: ["Valletta", "Birkirkara", "Mosta", "Qormi", "Zabbar", "Rabat", "San Gwann", "Fgura", "Zejtun", "Sliema"],
  iceland: [
    "Reykjavik",
    "Kopavogur",
    "Hafnarfjordur",
    "Akureyri",
    "Garðabaer",
    "Mosfellsbær",
    "Akranes",
    "Selfoss",
    "Seltjarnarnes",
    "Vestmannaeyjar",
  ],
  luxembourg: [
    "Luxembourg",
    "Esch-sur-Alzette",
    "Differdange",
    "Dudelange",
    "Ettelbruck",
    "Diekirch",
    "Wiltz",
    "Echternach",
    "Rumelange",
    "Grevenmacher",
  ],
  monaco: [
    "Monaco",
    "Monte-Carlo",
    "La Condamine",
    "Fontvieille",
    "Les Moneghetti",
    "Larvotto",
    "Saint-Roman",
    "Saint Michel",
    "Moneghetti",
    "La Rousse",
  ],
  andorra: [
    "Andorra la Vella",
    "Escaldes-Engordany",
    "Encamp",
    "Sant Julia de Loria",
    "La Massana",
    "Santa Coloma",
    "Ordino",
    "Canillo",
    "Arinsal",
    "El Pas de la Casa",
  ],
  liechtenstein: [
    "Vaduz",
    "Schaan",
    "Triesen",
    "Balzers",
    "Eschen",
    "Mauren",
    "Triesenberg",
    "Ruggell",
    "Gamprin",
    "Schellenberg",
  ],
  sanMarino: [
    "San Marino",
    "Serravalle",
    "Borgo Maggiore",
    "Domagnano",
    "Fiorentino",
    "Acquaviva",
    "Chiesanuova",
    "Montegiardino",
    "Faetano",
    "Poggio di Chiesanuova",
  ],
  vaticanCity: [
    "Vatican City",
    "Vatican Gardens",
    "Vatican Museums",
    "St. Peter's Basilica",
    "Sistine Chapel",
    "St. Peter's Square",
    "Vatican Library",
    "Vatican Apostolic Library",
    "Vatican Pinacoteca",
    "Vatican Necropolis",
  ],
  argentina: [
    "Buenos Aires",
    "Cordoba",
    "Rosario",
    "Mendoza",
    "La Plata",
    "Tucuman",
    "Mar del Plata",
    "Salta",
    "Santa Fe",
    "San Juan",
  ],
  colombia: [
    "Bogota",
    "Medellin",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Cucuta",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Ibague",
  ],
  chile: [
    "Santiago",
    "Puente Alto",
    "Antofagasta",
    "Vina del Mar",
    "Valparaiso",
    "Talcahuano",
    "San Bernardo",
    "Temuco",
    "Concepcion",
    "Rancagua",
  ],
};

function validateEmail() {
  const emailValue = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(emailValue);

  if (!isValid) {
    emailError.style.display = "block";
    emailInput.style.border = "1px solid red";
  } else {
    emailError.style.display = "none";
    emailInput.style.border = "1px solid #ccc";
  }

  return isValid;
}

emailInput.addEventListener("input", validateEmail);
emailInput.addEventListener("blur", validateEmail);

nextButton.addEventListener("click", () => {
  if (currentStep === 0 && !validateEmail()) {
    displaySimpleAlertWithCustomMessage("😢 Please enter a valid email address.", "red", true);
    return;
  }

  if (validateStep() && currentStep < steps.length - 1) {
    currentStep++;
    updateSteps();
  }
});

prevButton.addEventListener("click", () => {
  if (currentStep > 0) currentStep--;
  updateSteps();
});

confirmationCheckbox.addEventListener("change", () => {
  submitButton.disabled = !confirmationCheckbox.checked;
});

function validateStep() {
  const activeStep = steps[currentStep];
  const inputs = activeStep.querySelectorAll("input, select");
  let valid = true;

  const missingFields = [];
  inputs.forEach((input) => {
    if (input.required && !input.value.trim()) {
      valid = false;
      input.style.border = "1px solid red";
      missingFields.push(input.id);
    } else {
      input.style.border = "1px solid #ccc";
    }
  });

  if (missingFields.length) {
    displaySimpleAlertWithCustomMessage(`😢 Missing fields: ${missingFields.join(", ")}`, "red", true);
  }

  return valid;
}

function updateSteps() {
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });

  prevButton.classList.toggle("disabled", currentStep === 0);
  nextButton.style.display = currentStep === steps.length - 1 ? "none" : "inline-block";
  submitButton.style.display = currentStep === steps.length - 1 ? "inline-block" : "none";

  if (currentStep === steps.length - 1) populateSummary();
}

Object.keys(citiesByCountry).forEach((country) => {
  const option = document.createElement("option");
  option.value = country;
  option.textContent = country[0].toUpperCase() + country.slice(1);
  countrySelect.appendChild(option);
});

countrySelect.addEventListener("change", () => {
  citySelect.innerHTML = '<option value="">Select a city</option>';
  if (countrySelect.value) {
    citySelect.disabled = false;
    citiesByCountry[countrySelect.value].forEach((city) => {
      const option = document.createElement("option");
      option.value = city.toLowerCase();
      option.textContent = city;
      citySelect.appendChild(option);
    });
  } else {
    citySelect.disabled = true;
  }
});

function populateSummary() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const favoriteFood = document.getElementById("autocomplete").value;
  const country = document.getElementById("country").value;
  const city = document.getElementById("city").value;
  const jobTitle = document.getElementById("jobTitle").value;
  const yearsExperience = document.getElementById("yearsExperience").value;
  const hobbies = document.getElementById("hobbies").value;
  const interests = document.getElementById("interests").value;

  summaryDiv.innerHTML = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Favorite Food:</strong> ${favoriteFood}</p>
    <p><strong>Country:</strong> ${country}</p>
    <p><strong>City:</strong> ${city}</p>
    <p><strong>Job Title:</strong> ${jobTitle}</p>
    <p><strong>Years of Experience:</strong> ${yearsExperience}</p>
    <p><strong>Hobbies:</strong> ${hobbies}</p>
    <p><strong>Interests:</strong> ${interests}</p>
`;
}

submitButton.addEventListener("click", () => {
  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    favoriteFood: document.getElementById("autocomplete").value,
    country: document.getElementById("country").value,
    city: document.getElementById("city").value,
    jobTitle: document.getElementById("jobTitle").value,
    yearsExperience: document.getElementById("yearsExperience").value,
    hobbies: document.getElementById("hobbies").value,
    interests: document.getElementById("interests").value,
  };

  if (confirmationCheckbox.checked) {
    displaySimpleAlertWithCustomMessage(
      "Thank You! 🎉 Your information has been successfully submitted.",
      "green",
      true
    );
    document.querySelector(".form-container").innerHTML = `
        <div align="center">
        <h2>Thank You! 🎉</h2>
        </div>
        <p>Your information has been successfully submitted. We will contact you shortly.</p>
        <span>You will be redirected to the homepage in 3 seconds...</span>
        `;

    const params = "&data=" + btoa(JSON.stringify(formData));

    setTimeout(() => {
      window.location.href = "./internal/thank-you.html?ref=multi-step-form" + params;
    }, 3000);
  } else {
    displaySimpleAlertWithCustomMessage("Please confirm the information before proceeding.", "red", true);
    alert("Please confirm the information before proceeding.");
  }
});
