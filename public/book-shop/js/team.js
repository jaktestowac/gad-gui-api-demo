const urlBookShopTeam = "/api/book-shop-manage/team";

async function issueGetTeamRequest() {
  const url = urlBookShopTeam;

  const data = fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function displayTeamMembers(teamMembersData, teamContainer) {
  teamMembersData.forEach((teamMember) => {
    const element = document.createElement("div");
    element.className = "team-card";

    const profileImage = document.createElement("img");
    profileImage.src = `./../${teamMember.avatar}`;
    profileImage.className = "team-card-avatar";
    element.appendChild(profileImage);

    const memberDetails = document.createElement("div");
    memberDetails.className = "team-card-details";

    const name = document.createElement("div");
    name.className = "team-card-name";
    name.textContent = teamMember.user_name;
    memberDetails.appendChild(name);

    const role = document.createElement("div");
    role.className = "team-card-role";
    role.classList.add(`account-role-name`);
    role.classList.add(`account-role-${teamMember.role_name}`);
    role.textContent = teamMember.role_name;
    memberDetails.appendChild(role);

    const registeredLabel = document.createElement("div");
    registeredLabel.className = "team-card-registered";
    registeredLabel.classList.add(`account-registered`);
    registeredLabel.textContent = `On BookShop since:`;
    memberDetails.appendChild(registeredLabel);

    const registeredDate = document.createElement("div");
    registeredDate.className = "team-card-registered";
    registeredDate.classList.add(`account-registered`);
    registeredDate.textContent = getYearMonthDayFromDateString(teamMember.created_at);
    memberDetails.appendChild(registeredDate);

    element.appendChild(memberDetails);
    teamContainer.appendChild(element);
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        issueGetTeamRequest().then((response) => {
          if (response.status === 200) {
            return response.json().then((data) => {
              const teamContainer = document.getElementById("team-container");
              teamContainer.innerHTML = "";
              displayTeamMembers(data, teamContainer);
            });
          } else {
            if (response.status === 401) {
              const dashboardInfo = document.getElementById("dashboard-info");
              setBoxMessage(dashboardInfo, "Please login to see team members", "simpleInfoBox");
            } else {
              const teamContainer = document.getElementById("team-container");
              teamContainer.innerHTML = "";
              const element = document.createElement("div");
              element.classList.add("no-orders-message");
              element.textContent = "No team found";
              teamContainer.appendChild(element);
            }
          }
        });
      } else {
        const dashboardInfo = document.getElementById("dashboard-info");
        setBoxMessage(dashboardInfo, "Please create an Account to see team members", "simpleInfoBox");
      }
    });
  },
  () => {},
  { defaultRedirect: true }
);
