function openNav() {
  document.getElementById("book-shop-side-panel").style.width = "80px";
}

function closeNav() {
  document.getElementById("book-shop-side-panel").style.width = "0";
}

function populateLibrarySidePanel(links = []) {
  const librarySidePanel = document.getElementById("side-panel");
  librarySidePanel.innerHTML = "";
  const innerSidePanelElement = document.createElement("div");
  innerSidePanelElement.id = "book-shop-side-panel";
  innerSidePanelElement.classList.add("sidepanel");
  const buttonElement = document.createElement("button");
  buttonElement.classList.add("openbtn");

  buttonElement.onclick = openNav;
  buttonElement.innerHTML = `<i class="fa-solid fa-gear"></i>`;

  const closeElement = document.createElement("a");
  closeElement.href = "javascript:void(0)";
  closeElement.classList.add("closebtn");
  closeElement.onclick = closeNav;
  closeElement.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`;
  innerSidePanelElement.appendChild(closeElement);

  function prepareElement(link) {
    const aElement = document.createElement("a");
    aElement.href = link.link;
    aElement.innerHTML = `<div class="book-shop-side-panel-icons" title="${link.name}" id="${link.id}" alt="${link.name}" >${link.icon}</div>`;
    return aElement;
  }

  checkIfAuthorizedToBookShop().then((userData) => {
    links.forEach((link) => {
      if (link.accountRequired === true && userData !== undefined) {
        if (link.role_ids !== undefined) {
          if (link.role_ids.includes(parseInt(userData.role_id))) {
            innerSidePanelElement.appendChild(prepareElement(link));
          }
        } else {
          innerSidePanelElement.appendChild(prepareElement(link));
        }
      } else if (link.accountRequired === undefined && link.role_ids === undefined) {
        innerSidePanelElement.appendChild(prepareElement(link));
      }
      librarySidePanel.appendChild(innerSidePanelElement);
      librarySidePanel.parentElement.appendChild(buttonElement);
    });
  });

  window.onclick = function (event) {
    if (!event.target.matches(".sidepanel") && !event.target.matches(".openbtn")) {
      closeNav();
    }
  };
}

const allLinks = [
  {
    link: "/book-shop/dashboard.html",
    id: "book-shop-dashboard",
    name: "Dashboard",
    icon: `<i class="fa-solid fa-house"></i>`,
  },
  {
    link: "/book-shop/books.html",
    id: "book-shop-books",
    name: "Books",
    icon: `<i class="fa-solid fa-book"></i>`,
  },
  {
    link: "/book-shop/orders.html",
    id: "book-shop-orders",
    name: "Orders",
    icon: `<i class="fa-solid fa-cart-shopping"></i>`,
    accountRequired: true,
  },
  {
    link: "/book-shop/manage-items.html",
    id: "book-shop-manage-items",
    name: "Manage Items",
    icon: `<span class="fa-stack">
    <i class="fa-solid fa-box-open  fa-stack-1x"></i>
    <i class="fa-solid fa-pencil fa-stack-1x  fa-edit-icon" ></i>
    </span>
    `,
    accountRequired: true,
    role_ids: [1, 16],
  },
  {
    link: "/book-shop/manage-orders.html",
    id: "book-shop-manage-orders",
    name: "Manage Orders",
    icon: `<span class="fa-stack">
    <i class="fa-solid fa-cart-shopping  fa-stack-1x"></i>
    <i class="fa-solid fa-pencil  fa-stack-1x  fa-edit-icon" ></i>
    </span>
    `,
    accountRequired: true,
    role_ids: [1, 16],
  },
  {
    link: "/book-shop/orders-full-stats.html",
    id: "book-shop-orders-full-stats",
    name: "Orders Full Stats",
    icon: `<span class="fa-stack">
    <i class="fa-solid fa-chart-line  fa-stack-1x"></i>
    <i class="fa-solid fa-user-tie  fa-stack-1x  fa-edit-icon" ></i>
    </span>
    `,
    accountRequired: true,
    role_ids: [1],
  },
  {
    link: "/book-shop/manage-roles.html",
    id: "book-shop-manage-roles",
    name: "Manage Roles",
    icon: `<span class="fa-stack">
    <i class="fa-solid fa-address-book  fa-stack-1x"></i>
    <i class="fa-solid fa-user-tie  fa-stack-1x  fa-edit-icon" ></i>
    </span>
    `,
    accountRequired: true,
    role_ids: [1],
  },
  {
    link: "/book-shop/team.html",
    id: "book-shop-team",
    name: "Book Shop Team",
    icon: `<i class="fa-solid fa-people-group"></i>`,
    accountRequired: true,
  },
  // {
  //   link: "/book-shop/manage-items.html",
  //   id: "book-shop-manage-items",
  //   name: "Manage Items",
  //   icon: `<span class="fa-stack">
  //   <i class="fa-solid fa-shop  fa-stack-1x"></i>
  //   <i class="fa-solid fa-pencil  fa-stack-1x  fa-edit-icon" ></i>
  //   </span>
  //   `,
  //   accountRequired: true,
  //   role_ids: [1, 10],
  // },
  // {
  //   link: "/book-shop/dashboard.html",
  //   id: "book-shop-statistics",
  //   name: "Statistics",
  //   icon: `<i class="fa-solid fa-chart-column"></i>`,
  //   accountRequired: true,
  //   role_ids: [1],
  // },
  {
    link: "/book-shop/account.html",
    id: "book-shop-account",
    name: "Account",
    icon: `<i class="fa-solid fa-address-card"></i>`,
  },
];

function _setIconActive(iconId) {
  const icon = document.getElementById(iconId);
  if (icon === null) {
    return;
  }
  icon.classList.add("active");
}

function setIconActive(iconId) {
  const icons = document.querySelectorAll(".book-shop-side-panel-icons");
  icons.forEach((icon) => {
    icon.classList.remove("active");
  });

  const icon = document.getElementById(iconId);

  for (let i = 0; i < 5; i++) {
    if (icon && icon.id === iconId) {
      _setIconActive(iconId);
      break;
    } else {
      setTimeout(() => {
        _setIconActive(iconId);
      }, 250);
    }
  }
}

populateLibrarySidePanel(allLinks);
