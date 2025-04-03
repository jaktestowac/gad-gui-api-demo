let data = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalRecords = 0;
let totalPages = 0;
let selectedFilters = { name: [], role: [], status: [] };
let sortColumn = null;
let sortDirection = "asc";

const dropdownRolesHeader = document.querySelector(".dropdown-roles-header");
const dropdownStatusHeader = document.querySelector(".dropdown-status-header");
const dropdownRolesList = document.querySelector(".dropdown-roles-list");
const dropdownStatusList = document.querySelector(".dropdown-status-list");
const dropdownRolesArrow = document.querySelector(".dropdown-roles-arrow");
const dropdownStatusArrow = document.querySelector(".dropdown-status-arrow");
const dropdownItemsRolesContainer = document.getElementById("dropdownItemsRoles");
const dropdownItemsStatusContainer = document.getElementById("dropdownItemsStatus");
const dropdownSearchRole = document.getElementById("dropdownSearchRole");
const dropdownSearchStatus = document.getElementById("dropdownSearchStatus");
const selectedItemsContainer = document.getElementById("selectedItems");

const dataGridBody = document.getElementById("dataGridBody");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const elementsCount = document.getElementById("elementsCount");

async function getRandomEmployeesDataV2(page = 1, pageSize = 10, seed, details) {
  let url = `/api/v2/data/random/employees?page=${page}&pageSize=${pageSize}`;

  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }

  if (details === true) {
    url += `&details=true`;
  }

  Object.entries(selectedFilters).forEach(([type, values]) => {
    if (values.length > 0) {
      url += `&${type}=${values.join(",")}`;
    }
  });

  return fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

function populateDataFromAPIV2(page = 1, random = false) {
  let seed = undefined;
  if (random === false) {
    seed = "test";
  }

  getRandomEmployeesDataV2(page, rowsPerPage, seed, true)
    .then((response) => response.json())
    .then((json) => {
      data = json.data;
      currentPage = json.page;
      totalRecords = json.total;
      totalPages = json.totalPages;

      // Use server-provided roles and status options
      populateDropdownFromServerOptions(dropdownItemsRolesContainer, "role", json.allRoles);
      populateDropdownFromServerOptions(dropdownItemsStatusContainer, "status", json.allStatus);

      renderTable();
      updatePagination();
    });
}

function renderTable() {
  dataGridBody.innerHTML = "";

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.classList.add("expandable-row");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.name ?? "[NOT SET]"}</td>
      <td>${row.age ?? "[NOT SET]"}</td>
      <td>${row.role ?? "[NOT SET]"}</td>
      <td>${row.location ?? "[NOT SET]"}</td>
      <td>${row.department ?? "[NOT SET]"}</td>
      <td>${row.status ?? "[NOT SET]"}</td>
    `;

    const expandedTr = document.createElement("tr");
    expandedTr.classList.add("expanded-content");
    expandedTr.style.display = "none";
    const skillsStr = row.additionalData?.skills?.join(", ") ?? "[NOT SET]";

    expandedTr.innerHTML = `
      <td colspan="7">
        <div class="expanded-info">
          <p><strong>Email:</strong> ${row.email ?? "[NOT SET]"}</p>
          <p><strong>Join Date:</strong> ${row.joinDate ?? "[NOT SET]"}</p>
          <p><strong>Employment type:</strong> ${row.employmentType ?? "[NOT SET]"}</p>
          <p><strong>Vacation Days:</strong> ${row.additionalData?.vacationDays ?? "[NOT SET]"}</p>
          <p><strong>Sick Days:</strong> ${row.additionalData?.sickDays ?? "[NOT SET]"}</p>
          <p><strong>Salary:</strong> ${
            row.additionalData?.salary ? `${row.additionalData.salary} USD` : "[NOT SET]"
          }</p>
          <p><strong>Performance:</strong> ${
            row.additionalData?.performance ? `${row.additionalData.performance}%` : "[NOT SET]"
          }</p>
          <p><strong>Skills:</strong> ${skillsStr}</p>
        </div>
      </td>
    `;

    tr.addEventListener("click", () => {
      const isExpanded = expandedTr.classList.contains("show");
      expandedTr.style.display = isExpanded ? "table-row" : "table-row";

      setTimeout(() => {
        expandedTr.classList.toggle("show");
      }, 10);

      tr.classList.toggle("expanded");

      if (isExpanded) {
        setTimeout(() => {
          if (!expandedTr.classList.contains("show")) {
            expandedTr.style.display = "none";
          }
        }, 300);
      }
    });

    dataGridBody.appendChild(tr);
    dataGridBody.appendChild(expandedTr);
  });
}

function updatePagination() {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalRecords} total records)`;
  prevPageButton.disabled = currentPage <= 1;
  nextPageButton.disabled = currentPage >= totalPages;
  prevPageButton.classList.toggle("disabled", currentPage <= 1);
  nextPageButton.classList.toggle("disabled", currentPage >= totalPages);
  elementsCount.textContent = `Showing ${data.length} of ${totalRecords} records`;
}

prevPageButton.addEventListener("click", () => {
  if (!prevPageButton.disabled) {
    populateDataFromAPIV2(currentPage - 1, true);
  }
});

nextPageButton.addEventListener("click", () => {
  if (!nextPageButton.disabled) {
    populateDataFromAPIV2(currentPage + 1, true);
  }
});

document.querySelectorAll(".data-grid th").forEach((header) => {
  header.addEventListener("click", () => {
    const column = header.dataset.column;
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
    updateSortIcons();
    sortTable();
  });
});

function updateSortIcons() {
  document.querySelectorAll(".data-grid th").forEach((header) => {
    const icon = header.querySelector(".sort-icon");
    if (header.dataset.column === sortColumn) {
      icon.textContent = sortDirection === "asc" ? "▲" : "▼";
    } else {
      icon.textContent = "";
    }
  });
}

function sortTable() {
  data.sort((a, b) => {
    const aVal = a[sortColumn] ?? "";
    const bVal = b[sortColumn] ?? "";
    return sortDirection === "asc"
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });
  renderTable();
}

function populateDropdownFromServerOptions(dropdownItemsContainer, type, options) {
  dropdownItemsContainer.innerHTML = "";
  const filteredOptions = options.filter((value) =>
    value?.toLowerCase().includes((type === "role" ? dropdownSearchRole : dropdownSearchStatus).value.toLowerCase())
  );

  filteredOptions.sort((a, b) => a?.localeCompare(b));

  filteredOptions.forEach((value) => {
    if (!value) return;
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    item.classList.add(`dropdown-${type}-item`);
    item.textContent = value;
    if (selectedFilters[type].includes(value)) {
      item.classList.add("selected");
    }

    item.addEventListener("click", () => toggleSelection(type, value));
    dropdownItemsContainer.appendChild(item);
  });
}

function toggleSelection(type, value) {
  if (selectedFilters[type].includes(value)) {
    selectedFilters[type] = selectedFilters[type].filter((selected) => selected !== value);
  } else {
    selectedFilters[type].push(value);
  }
  updateSelectedItems();
  populateDropdownFromServerOptions(
    dropdownItemsRolesContainer,
    "role",
    Array.from(dropdownItemsRolesContainer.querySelectorAll(".dropdown-item")).map((item) => item.textContent)
  );
  populateDropdownFromServerOptions(
    dropdownItemsStatusContainer,
    "status",
    Array.from(dropdownItemsStatusContainer.querySelectorAll(".dropdown-item")).map((item) => item.textContent)
  );
  populateDataFromAPIV2(1, true);
}

function updateSelectedItems() {
  selectedItemsContainer.innerHTML = "";
  Object.entries(selectedFilters).forEach(([type, values]) => {
    values.forEach((value) => {
      const selectedItem = document.createElement("div");
      selectedItem.classList.add("selected-item", `selected-${type}-item`);
      selectedItem.textContent = value;

      const removeButton = document.createElement("span");
      removeButton.textContent = "×";
      removeButton.classList.add("remove-item");
      removeButton.addEventListener("click", () => toggleSelection(type, value));

      selectedItem.appendChild(removeButton);
      selectedItemsContainer.appendChild(selectedItem);
    });
  });
}

dropdownRolesHeader.addEventListener("click", () => {
  dropdownRolesList.classList.toggle("show");
  dropdownRolesArrow.classList.toggle("open");
});

dropdownStatusHeader.addEventListener("click", () => {
  dropdownStatusList.classList.toggle("show");
  dropdownStatusArrow.classList.toggle("open");
});

dropdownSearchRole.addEventListener("input", (e) => {
  const container = dropdownItemsRolesContainer;
  const lastOptions = Array.from(container.querySelectorAll(".dropdown-item")).map((item) => item.textContent);
  populateDropdownFromServerOptions(container, "role", lastOptions);
});

dropdownSearchStatus.addEventListener("input", (e) => {
  const container = dropdownItemsStatusContainer;
  const lastOptions = Array.from(container.querySelectorAll(".dropdown-item")).map((item) => item.textContent);
  populateDropdownFromServerOptions(container, "status", lastOptions);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-roles-container")) {
    dropdownRolesList.classList.remove("show");
    dropdownRolesArrow.classList.remove("open");
  }
  if (!e.target.closest(".dropdown-status-container")) {
    dropdownStatusList.classList.remove("show");
    dropdownStatusArrow.classList.remove("open");
  }
});
