function openNav() {
  document.getElementById("projects-side-panel").style.width = "250px";
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
  buttonElement.innerHTML = "&#9776;";

  const closeElement = document.createElement("a");
  closeElement.href = "javascript:void(0)";
  closeElement.classList.add("closebtn");
  closeElement.onclick = closeNav;
  closeElement.innerHTML = `<i class="fa-regular fa-circle-xmark"></i>`;
  divElement.appendChild(closeElement);

  links.forEach((link) => {
    const aElement = document.createElement("a");
    aElement.href = link.id;
    aElement.textContent = link.name;
    divElement.appendChild(aElement);
  });
  projectsSidePanel.appendChild(divElement);
  projectsSidePanel.parentElement.appendChild(buttonElement);
}

const allLinks = [
  { id: "/projects/1", name: "Project 1" },
  { id: "/projects/2", name: "Project 2" },
  { id: "/projects/3", name: "Project 3" },
];

populateProjectsSidePanel(allLinks);
