function openNav() {
  document.getElementById("projects-side-panel").style.width = "100px";
}

function closeNav() {
  document.getElementById("projects-side-panel").style.width = "0";
}

function populateProjectsSidePanel(links = []) {
  const projectsSidePanel = document.getElementById("side-panel");
  projectsSidePanel.innerHTML = "";
  const divElement = document.createElement("div");
  divElement.id = "projects-side-panel";
  divElement.classList.add("sidepanel");
  const buttonElement = document.createElement("button");
  buttonElement.classList.add("openbtn");
  buttonElement.onclick = openNav;
  buttonElement.innerHTML = `<i class="fa-solid fa-diagram-project"></i>`;

  const closeElement = document.createElement("a");
  closeElement.href = "javascript:void(0)";
  closeElement.classList.add("closebtn");
  closeElement.onclick = closeNav;
  closeElement.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`;
  divElement.appendChild(closeElement);

  links.forEach((link) => {
    const aElement = document.createElement("a");
    aElement.href = link.link;
    aElement.innerHTML = `<div class="projects-side-panel-icons" id="${link.id}" alt="${link.name}" >${link.icon}</div>`;
    divElement.appendChild(aElement);
  });
  projectsSidePanel.appendChild(divElement);
  projectsSidePanel.parentElement.appendChild(buttonElement);
}

const allLinks = [
  {
    link: "/projects/dashboard.html",
    id: "home-dashboard",
    name: "Team and Projects Dashboard",
    icon: `<i class="fa-solid fa-house"></i>`,
  },
  {
    link: "/projects/dashboard.html",
    id: "team-management",
    name: "Team management",
    icon: `<i class="fa-solid fa-people-group"></i>`,
  },
  {
    link: "/projects/dashboard.html",
    id: "project-management",
    name: "Project management",
    icon: `<i class="fa-solid fa-diagram-project"></i>`,
  },
  {
    link: "/projects/dashboard.html",
    id: "projects-statistics",
    name: "Statistics",
    icon: `<i class="fa-solid fa-chart-column"></i>`,
  },
  {
    link: "/projects/simple-roi.html",
    id: "projects-simple-roi",
    name: "Simple ROI Calculator",
    icon: `<div style="color: green;"><i class="fa-solid fa-calculator"></i></div>`,
  },
  {
    link: "/projects/roi.html",
    id: "projects-roi",
    name: "ROI Calculator",
    icon: `<div style="color: orange;"><i class="fa-solid fa-calculator"></i></div>`,
  },
];

populateProjectsSidePanel(allLinks);
