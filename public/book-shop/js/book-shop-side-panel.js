function openNav() {
  document.getElementById("book-shop-side-panel").style.width = "100px";
}

function closeNav() {
  document.getElementById("book-shop-side-panel").style.width = "0";
}

function populateLibrarySidePanel(links = []) {
  const librarySidePanel = document.getElementById("side-panel");
  librarySidePanel.innerHTML = "";
  const divElement = document.createElement("div");
  divElement.id = "book-shop-side-panel";
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
    if (link.accountRequired === true) {
      checkIfAuthorizedToBookShop().then((isAuthorized) => {
        if (isAuthorized !== undefined) {
          const aElement = document.createElement("a");
          aElement.href = link.link;
          aElement.innerHTML = `<div class="book-shop-side-panel-icons" id="${link.id}" alt="${link.name}" >${link.icon}</div>`;
          divElement.appendChild(aElement);
        }
      });
    } else {
      const aElement = document.createElement("a");
      aElement.href = link.link;
      aElement.innerHTML = `<div class="book-shop-side-panel-icons" id="${link.id}" alt="${link.name}" >${link.icon}</div>`;
      divElement.appendChild(aElement);
    }
  });
  librarySidePanel.appendChild(divElement);
  librarySidePanel.parentElement.appendChild(buttonElement);
}

const allLinks = [
  {
    link: "/book-shop/books.html",
    id: "book-shop-books",
    name: "Books",
    icon: `<i class="fa-solid fa-book"></i>`,
  },
  // {
  //   link: "/book-shop/dashboard.html",
  //   id: "home-dashboard",
  //   name: "Dashboard",
  //   icon: `<i class="fa-solid fa-house"></i>`,
  // },
  // {
  //   link: "/book-shop/dashboard.html",
  //   id: "book-shop-authors",
  //   name: "Authors",
  //   icon: `<i class="fa-solid fa-address-book"></i>`,
  // },
  {
    link: "/book-shop/orders.html",
    id: "book-shop-shopping",
    name: "Orders",
    icon: `<i class="fa-solid fa-cart-shopping"></i>`,
    accountRequired: true,
  },
  // {
  //   link: "/book-shop/dashboard.html",
  //   id: "book-shop-statistics",
  //   name: "Statistics",
  //   icon: `<i class="fa-solid fa-chart-column"></i>`,
  // },
  {
    link: "/book-shop/account.html",
    id: "book-shop-account",
    name: "Account",
    icon: `<i class="fa-solid fa-address-card"></i>`,
  },
];

function setIconActive(iconId) {
  const icons = document.querySelectorAll(".book-shop-side-panel-icons");
  icons.forEach((icon) => {
    icon.classList.remove("active");
  });

  const icon = document.getElementById(iconId);

  for (let i = 0; i < 5; i++) {
    if (icon && icon.id === iconId) {
      icon.classList.add("active");
      break;
    } else {
      setTimeout(() => {
        setIconActive(iconId);
      }, 250);
    }
  }
}

populateLibrarySidePanel(allLinks);
