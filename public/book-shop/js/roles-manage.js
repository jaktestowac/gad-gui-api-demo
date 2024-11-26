const urlBookShopManageAccounts = "/api/book-shop-manage/accounts";
const urlBookShopRoles = "/api/book-shop-roles";

async function issueGetAccountsRequest() {
  const url = urlBookShopManageAccounts;

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

async function issueUpdateAccountRole(roleId, accountId) {
  const url = `${urlBookShopManageAccounts}/${accountId}`;
  const body = {
    role_id: roleId,
  };

  const data = fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(body),
  });
  return data;
}

async function issueGetBookShopRoles() {
  let urlBook = `${urlBookShopRoles}`;
  const data = fetch(urlBook, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function updateAccountRole(roleId, accountId, buttonElement, callbackOnSave) {
  issueUpdateAccountRole(roleId, accountId).then((response) => {
    if (response.status === 200) {
      showSimpleAlert("Account updated successfully");
      buttonElement.textContent = "Saved";
      buttonElement.disabled = true;

      if (callbackOnSave !== undefined) {
        response.json().then((data) => {
          callbackOnSave();
        });
      }

      setTimeout(() => {
        document.getElementById("account-details-placeholder").innerHTML = "";
      }, 500);
    } else {
      saveButton.disabled = false;
      showSimpleAlert("Account update failed", 2);
      response.json().then((data) => {
        if (data.error?.message) {
          showSimpleAlert(data.error.message, 2);
        }
      });
    }
  });
}

function createEditRoleModal(itemData, callbackOnSave = undefined) {
  const placeholder = document.getElementById("account-details-placeholder");
  placeholder.innerHTML = "";

  const popup = document.createElement("div");
  popup.className = "book-popup";

  const popupContent = document.createElement("div");
  popupContent.className = "book-popup-content";

  const popupBody = document.createElement("div");
  popupBody.className = "popup-body";

  const bookPopupControls = document.createElement("div");
  bookPopupControls.className = "book-popup-controls";

  const closeButton = document.createElement("span");

  closeButton.className = "book-popup-close-button book-clickable-component";
  closeButton.innerHTML = `<i class="fa-solid fa-xmark book-button"></i>`;
  closeButton.addEventListener("click", () => {
    document.getElementById("account-details-placeholder").innerHTML = "";
  });

  bookPopupControls.appendChild(closeButton);

  const form = document.createElement("div");
  form.className = "account-edit-form";

  const titleElement = document.createElement("div");
  titleElement.textContent = itemData.user_name;
  titleElement.className = "item-edit-title";

  form.appendChild(titleElement);

  const roleLabel = document.createElement("label");
  roleLabel.textContent = "Role";
  roleLabel.className = "account-edit-label";

  const roleSelect = document.createElement("select");
  roleSelect.className = "account-edit-input";
  roleSelect.id = "role-select";

  issueGetBookShopRoles().then((response) => {
    if (response.status === 200) {
      response.json().then((rolesData) => {
        rolesData.forEach((role) => {
          const roleOption = document.createElement("option");
          roleOption.value = role.id;
          roleOption.textContent = role.name;
          roleSelect.appendChild(roleOption);
        });

        roleSelect.value = itemData.role_id;
      });
    }
  });

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.addEventListener("click", () => {
    updateAccountRole(roleSelect.value, itemData.id, saveButton, callbackOnSave);
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.className = "book-shop-button-primary";
  cancelButton.addEventListener("click", () => {
    document.getElementById("account-details-placeholder").innerHTML = "";
  });

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(roleLabel);

  rightColumn.appendChild(roleSelect);

  form.appendChild(leftColumn);
  form.appendChild(rightColumn);

  const columnsContainer = document.createElement("div");
  columnsContainer.className = "account-edit-columns";

  columnsContainer.appendChild(leftColumn);
  columnsContainer.appendChild(rightColumn);

  form.appendChild(columnsContainer);

  // create container for save and cancel button
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "account-edit-buttons";

  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(cancelButton);

  form.appendChild(buttonsContainer);

  popupBody.appendChild(bookPopupControls);

  popupBody.appendChild(form);
  popupContent.appendChild(popupBody);
  popup.appendChild(popupContent);
  placeholder.appendChild(popup);
}

function displayAccounts(accountsData, accountsContainer) {
  accountsData.forEach((account) => {
    const element = document.createElement("div");
    element.className = "team-card";
    element.setAttribute("roleId", account.id);
    element.classList.add(`team-card-role-${account.role_name}`);

    const profileImage = document.createElement("img");
    profileImage.src = `./../${account.avatar}`;
    profileImage.className = "team-card-avatar";
    element.appendChild(profileImage);

    const memberDetails = document.createElement("div");
    memberDetails.className = "team-card-details";

    const name = document.createElement("div");
    name.className = "team-card-name";
    name.textContent = account.user_name;
    memberDetails.appendChild(name);

    const roleContainer = document.createElement("div");
    roleContainer.className = "team-card-role-container";

    const role = document.createElement("span");
    role.className = "team-card-role";
    role.classList.add(`account-role-name`);
    role.classList.add(`account-role-${account.role_name}`);
    role.textContent = account.role_name;

    const roleEditButton = document.createElement("span");
    roleEditButton.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
    roleEditButton.title = "Edit Role";
    roleEditButton.classList.add("book-clickable-component");
    roleEditButton.classList.add("clickable-btn");
    roleEditButton.classList.add("edit-account-button");
    roleEditButton.addEventListener("click", () => {
      createEditRoleModal(account, getAndDisplayAccounts);
    });

    roleContainer.appendChild(role);
    roleContainer.appendChild(roleEditButton);

    memberDetails.appendChild(roleContainer);

    const registeredLabel = document.createElement("div");
    registeredLabel.className = "team-card-registered";
    registeredLabel.classList.add(`account-registered`);
    registeredLabel.textContent = `On BookShop since:`;
    memberDetails.appendChild(registeredLabel);

    const registeredDate = document.createElement("div");
    registeredDate.className = "team-card-registered";
    registeredDate.classList.add(`account-registered`);
    registeredDate.textContent = getYearMonthDayFromDateString(account.created_at);
    memberDetails.appendChild(registeredDate);

    element.appendChild(memberDetails);
    accountsContainer.appendChild(element);
  });
}

function createRolesFilteringControls(rolesData) {
  const roles = [...rolesData];
  roles.unshift({ id: "all", name: "All", icon: "fa-house" });

  const filteringControls = document.createElement("div");
  filteringControls.classList.add("manage-roles-filtering-controls");

  const filteringControlsRoles = document.createElement("div");
  filteringControlsRoles.classList.add("manage-roles-filtering-controls-statuses");

  roles.forEach((role) => {
    const roleElement = document.createElement("span");
    roleElement.classList.add("manage-roles-filtering-controls-status");
    roleElement.classList.add("book-clickable-component");
    roleElement.setAttribute("roleId", role.id);
    roleElement.setAttribute("roleName", role.name);
    roleElement.setAttribute("raw", "true");

    const statusNameElement = document.createElement("span");
    statusNameElement.innerHTML = role.name;

    const statusIconElement = document.createElement("span");
    if (role.icon) {
      statusIconElement.innerHTML = `<i class="fas ${role.icon}" title="${role.name}"></i>`;
    } else {
      statusIconElement.innerHTML = `<i class="fas fa-person-circle-question" title="${role.name}"></i>`;
    }

    roleElement.appendChild(statusIconElement);
    roleElement.appendChild(statusNameElement);

    roleElement.addEventListener("click", (event) => {
      const roleName = roleElement.getAttribute("roleName");
      const accountElements = document.querySelectorAll(".team-card");

      accountElements.forEach((accountElement) => {
        if (roleName.toLowerCase() === "all") {
          accountElement.style.display = "grid";
        } else {
          if (accountElement.classList.contains(`team-card-role-${roleName}`)) {
            accountElement.style.display = "grid";
          } else {
            accountElement.style.display = "none";
          }
        }
      });

      const ordersContainer = document.getElementById("manage-roles-accounts-container");
      const teamCards = ordersContainer.querySelectorAll(".team-card");
      let ordersToDisplay = 0;
      teamCards.forEach((teamCard) => {
        if (teamCard.style.display !== "none") {
          ordersToDisplay++;
        }
      });

      if (ordersToDisplay === 0) {
        const noOrderElements = document.querySelectorAll(".no-orders-message");
        if (noOrderElements.length !== 0) {
          return;
        }

        const ordersMessageContainer = document.querySelector("#manage-roles-messages");
        const noOrdersElement = document.createElement("div");
        noOrdersElement.classList.add("no-orders-message");
        noOrdersElement.innerHTML = "No accounts to display";
        ordersMessageContainer.appendChild(noOrdersElement);
      } else {
        const noOrderElements = document.querySelectorAll(".no-orders-message");
        noOrderElements.forEach((element) => {
          element.remove();
        });
      }
    });

    filteringControlsRoles.appendChild(roleElement);
  });

  filteringControls.appendChild(filteringControlsRoles);
  return filteringControls;
}

function populateManageControlsContainer() {
  issueGetBookShopRoles().then((response) => {
    if (response.status === 200) {
      response.json().then((rolesData) => {
        const filteringControlsContainer = document.getElementById("manage-roles-filtering-controls");
        filteringControlsContainer.innerHTML = "";
        const filteringControls = createRolesFilteringControls(rolesData);
        filteringControlsContainer.appendChild(filteringControls);
      });
    }
  });
}

function getAndDisplayAccounts() {
  populateManageControlsContainer();
  issueGetAccountsRequest().then((response) => {
    if (response.status === 200) {
      return response.json().then((data) => {
        const accountsContainer = document.getElementById("manage-roles-accounts-container");
        accountsContainer.innerHTML = "";
        displayAccounts(data, accountsContainer);
      });
    } else {
      if (response.status === 401) {
        const dashboardInfo = document.getElementById("dashboard-info");
        setBoxMessage(dashboardInfo, "You dont have permission to see accounts", "simpleInfoBox");
      } else {
        const teamContainer = document.getElementById("manage-roles-accounts-container");
        teamContainer.innerHTML = "";
        const element = document.createElement("div");
        element.classList.add("no-orders-message");
        element.textContent = "No accounts found";
        teamContainer.appendChild(element);
      }
    }
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        getAndDisplayAccounts();
      } else {
        response.json().then((data) => {
          const dashboardInfo = document.getElementById("dashboard-info");
          setBoxMessage(dashboardInfo, "Please log in (as Admin) to see the content", "simpleInfoBox");
        });
      }
    });
  },
  () => {}
);
