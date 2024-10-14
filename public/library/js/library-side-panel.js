function openNav() {
  document.getElementById("library-side-panel").style.width = "100px";
}

function closeNav() {
  document.getElementById("library-side-panel").style.width = "0";
}

function populateLibrarySidePanel(links = []) {
  const librarySidePanel = document.getElementById("side-panel");
  librarySidePanel.innerHTML = "";
  const divElement = document.createElement("div");
  divElement.id = "library-side-panel";
  divElement.classList.add("sidepanel");
  const buttonElement = document.createElement("button");
  buttonElement.classList.add("openbtn");
  buttonElement.onclick = openNav;
  buttonElement.innerHTML = `<i class="fa-solid fa-gear"></i>`;

  const closeElement = document.createElement("a");
  closeElement.href = "javascript:void(0)";
  closeElement.classList.add("closebtn");
  closeElement.onclick = closeNav;
  closeElement.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`;
  divElement.appendChild(closeElement);

  links.forEach((link) => {
    const aElement = document.createElement("a");
    aElement.href = link.link;
    aElement.innerHTML = `<div class="library-side-panel-icons" id="${link.id}" alt="${link.name}" >${link.icon}</div>`;
    divElement.appendChild(aElement);
  });
  librarySidePanel.appendChild(divElement);
  librarySidePanel.parentElement.appendChild(buttonElement);
}

const allLinks = [
  {
    link: "/library/books.html",
    id: "library-books",
    name: "Books",
    icon: `<i class="fa-solid fa-book"></i>`,
  },
  {
    link: "/library/dashboard.html",
    id: "home-dashboard",
    name: "Library Dashboard",
    icon: `<i class="fa-solid fa-house"></i>`,
  },
  {
    link: "/library/dashboard.html",
    id: "library-authors",
    name: "Authors",
    icon: `<i class="fa-solid fa-address-book"></i>`,
  },
  {
    link: "/library/dashboard.html",
    id: "library-shopping",
    name: "Shopping",
    icon: `<i class="fa-solid fa-cart-shopping"></i>`,
  },
  {
    link: "/library/dashboard.html",
    id: "library-statistics",
    name: "Statistics",
    icon: `<i class="fa-solid fa-chart-column"></i>`,
  },
  {
    link: "/library/dashboard.html",
    id: "library-profile",
    name: "Profile",
    icon: `<i class="fa-solid fa-address-card"></i>`,
  },
];

populateLibrarySidePanel(allLinks);
