const predefinedData = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@test.test.test",
    age: 28,
    role: "Developer",
    status: "Active",
    location: "New York",
    department: "Engineering",
    joinDate: "2018-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@test.test.test",
    age: 34,
    role: "Manager",
    status: "Inactive",
    location: "London",
    department: "Operations",
    joinDate: "2015-03-23",
  },
  {
    id: 3,
    name: "Alice Johnson",
    email: "alice.johnson@test.test.test",
    age: 24,
    role: "Designer",
    status: "Active",
    location: "San Francisco",
    department: "Design",
    joinDate: "2020-06-12",
  },
  {
    id: 4,
    name: "Bob Brown",
    email: "bob.brown@test.test.test",
    age: 41,
    role: "Developer",
    status: "Active",
    location: "Berlin",
    department: "Engineering",
    joinDate: "2010-09-01",
  },
  {
    id: 5,
    name: "Charlie Black",
    email: "charlie.black@test.test.test",
    age: 29,
    role: "Tester",
    status: "Inactive",
    location: "Tokyo",
    department: "Quality Assurance",
    joinDate: "2019-04-30",
  },
  {
    id: 6,
    name: "Daisy White",
    email: "daisy.white@test.test.test",
    age: 26,
    role: "Developer",
    status: "Active",
    location: "Sydney",
    department: "Engineering",
    joinDate: "2021-07-20",
  },
  {
    id: 7,
    name: "Eve Green",
    email: "eve.green@test.test.test",
    age: 37,
    role: "Manager",
    status: "Inactive",
    location: "Dubai",
    department: "Sales",
    joinDate: "2014-11-18",
  },
  {
    id: 8,
    name: "Frank Gray",
    email: "frank.gray@test.test.test",
    age: 33,
    role: "Developer",
    status: "Active",
    location: "Toronto",
    department: "Engineering",
    joinDate: "2017-02-10",
  },
  {
    id: 9,
    name: "Grace Blue",
    email: "grace.blue@test.test.test",
    age: 45,
    role: "CEO",
    status: "Active",
    location: "New York",
    department: "Executive",
    joinDate: "2005-12-01",
  },
  {
    id: 10,
    name: "Hank Yellow",
    email: "hank.yellow@test.test.test",
    age: 50,
    role: "CTO",
    status: "Active",
    location: "London",
    department: "Executive",
    joinDate: "2000-08-15",
  },
  {
    id: 11,
    name: "Ivy Purple",
    email: "ivy.purple@test.test.test",
    age: 31,
    role: "HR",
    status: "Inactive",
    location: "San Francisco",
    department: "Human Resources",
    joinDate: "2016-05-05",
  },
  {
    id: 12,
    name: "Jack Red",
    email: "jack.red@test.test.test",
    age: 27,
    role: "Developer",
    status: "Active",
    location: "Berlin",
    department: "Engineering",
    joinDate: "2022-01-01",
  },
  {
    id: 13,
    name: "Karen Orange",
    email: "karen.orange@test.test.test",
    age: 39,
    role: "Manager",
    status: "Active",
    location: "Tokyo",
    department: "Operations",
    joinDate: "2013-10-11",
  },
  {
    id: 14,
    name: "Leo Violet",
    email: "leo.violet@test.test.test",
    age: 22,
    role: "Intern",
    status: "Active",
    location: "Sydney",
    department: "Design",
    joinDate: "2023-06-01",
  },
  {
    id: 15,
    name: "Molly Pink",
    email: "molly.pink@test.test.test",
    age: 30,
    role: "Designer",
    status: "Inactive",
    location: "Dubai",
    department: "Design",
    joinDate: "2017-08-15",
  },
  {
    id: 16,
    name: "Nathan Silver",
    email: "nathan.silver@test.test.test",
    age: 40,
    role: "Tester",
    status: "Active",
    location: "Toronto",
    department: "Quality Assurance",
    joinDate: "2012-03-20",
  },
  {
    id: 17,
    name: "Olivia Gold",
    email: "olivia.gold@test.test.test",
    age: 36,
    role: "HR",
    status: "Active",
    location: "New York",
    department: "Human Resources",
    joinDate: "2018-09-12",
  },
  {
    id: 18,
    name: "Paul Copper",
    email: "paul.copper@test.test.test",
    age: 28,
    role: "Developer",
    status: "Inactive",
    location: "London",
    department: "Engineering",
    joinDate: "2020-02-14",
  },
  {
    id: 19,
    name: "Quincy Azure",
    email: "quincy.azure@test.test.test",
    age: 23,
    role: "Intern",
    status: "Active",
    location: "San Francisco",
    department: "Quality Assurance",
    joinDate: "2023-05-01",
  },
  {
    id: 20,
    name: "Ruby Teal",
    email: "ruby.teal@test.test.test",
    age: 35,
    role: "Designer",
    status: "Active",
    location: "Berlin",
    department: "Design",
    joinDate: "2019-11-09",
  },
  {
    id: 21,
    name: "Steve Indigo",
    email: "steve.indigo@test.test.test",
    age: 42,
    role: "Manager",
    status: "Inactive",
    location: "Tokyo",
    department: "Sales",
    joinDate: "2011-04-25",
  },
  {
    id: 22,
    name: "Tina Cyan",
    email: "tina.cyan@test.test.test",
    age: 32,
    role: "Tester",
    status: "Active",
    location: "Sydney",
    department: "Quality Assurance",
    joinDate: "2018-01-30",
  },
  {
    id: 23,
    name: "Uma Magenta",
    email: "uma.magenta@test.test.test",
    age: 25,
    role: "Designer",
    status: "Inactive",
    location: "Dubai",
    department: "Design",
    joinDate: "2021-03-11",
  },
  {
    id: 24,
    name: "Victor White",
    email: "victor.white@test.test.test",
    age: 38,
    role: "Manager",
    status: "Active",
    location: "Toronto",
    department: "Operations",
    joinDate: "2013-12-17",
  },
  {
    id: 25,
    name: "Wendy Black",
    email: "wendy.black@test.test.test",
    age: 29,
    role: "Developer",
    status: "Inactive",
    location: "New York",
    department: "Engineering",
    joinDate: "2020-10-22",
  },
  {
    id: 26,
    name: "Xander Gray",
    email: "xander.gray@test.test.test",
    age: 26,
    role: "Tester",
    status: "Active",
    location: "London",
    department: "Quality Assurance",
    joinDate: "2021-11-01",
  },
  {
    id: 27,
    name: "Yara Olive",
    email: "yara.olive@test.test.test",
    age: 34,
    role: "HR",
    status: "Active",
    location: "San Francisco",
    department: "Human Resources",
    joinDate: "2016-07-08",
  },
  {
    id: 28,
    name: "Zane Navy",
    email: "zane.navy@test.test.test",
    age: 44,
    role: "CTO",
    status: "Active",
    location: "Berlin",
    department: "Executive",
    joinDate: "2004-02-20",
  },
  {
    id: 29,
    name: "Anna Black",
    email: "anna.black@test.test.test",
    age: 27,
    role: "Designer",
    status: "Inactive",
    location: "Toronto",
    department: "Design",
    joinDate: "2017-09-18",
  },
  {
    id: 30,
    name: "Brian Green",
    email: "brian.green@test.test.test",
    age: 33,
    role: "Manager",
    status: "Active",
    location: "Berlin",
    department: "Operations",
    joinDate: "2010-04-01",
  },
  {
    id: 31,
    name: "Clara White",
    email: "clara.white@test.test.test",
    age: 29,
    role: "Tester",
    status: "Active",
    location: "London",
    department: "Quality Assurance",
    joinDate: "2022-03-15",
  },
  {
    id: 32,
    name: "David Gray",
    email: "david.gray@test.test.test",
    age: 35,
    role: "HR",
    status: "Active",
    location: "San Francisco",
    department: "Human Resources",
    joinDate: "2015-07-07",
  },
  {
    id: 33,
    name: "Emma Blue",
    email: "emma.blue@test.test.test",
    age: 24,
    role: "Intern",
    status: "Inactive",
    location: "New York",
    department: "Design",
    joinDate: "2020-01-01",
  },
  {
    id: 34,
    name: "Frank Red",
    email: "frank.red@test.test.test",
    age: 37,
    role: "Developer",
    status: "Active",
    location: "Sydney",
    department: "Engineering",
    joinDate: "2019-11-01",
  },
  {
    id: 35,
    name: "Grace Yellow",
    email: "grace.yellow@test.test.test",
    age: 30,
    role: "Tester",
    status: "Inactive",
    location: "Dubai",
    department: "Quality Assurance",
    joinDate: "2021-06-12",
  },
  {
    id: 36,
    name: "Hannah Cyan",
    email: "hannah.cyan@test.test.test",
    age: 31,
    role: "HR",
    status: "Active",
    location: "Berlin",
    department: "Human Resources",
    joinDate: "2016-12-11",
  },
  {
    id: 37,
    name: "Ian Violet",
    email: "ian.violet@test.test.test",
    age: 26,
    role: "Manager",
    status: "Active",
    location: "Tokyo",
    department: "Sales",
    joinDate: "2018-05-10",
  },
  {
    id: 38,
    name: "Julia Orange",
    email: "julia.orange@test.test.test",
    age: 42,
    role: "Manager",
    status: "Active",
    location: "Sydney",
    department: "Operations",
    joinDate: "2012-02-09",
  },
  {
    id: 39,
    name: "Kevin Brown",
    email: "kevin.brown@test.test.test",
    age: 25,
    role: "Designer",
    status: "Inactive",
    location: "London",
    department: "Design",
    joinDate: "2019-04-01",
  },
  {
    id: 40,
    name: "Laura Silver",
    email: "laura.silver@test.test.test",
    age: 38,
    role: "Developer",
    status: "Active",
    location: "Dubai",
    department: "Engineering",
    joinDate: "2021-07-01",
  },
  {
    id: 41,
    name: "Michael Gold",
    email: "michael.gold@test.test.test",
    age: 50,
    role: "CTO",
    status: "Active",
    location: "Berlin",
    department: "Executive",
    joinDate: "2003-01-20",
  },
  {
    id: 42,
    name: "Nina Teal",
    email: "nina.teal@test.test.test",
    age: 28,
    role: "Intern",
    status: "Active",
    location: "Toronto",
    department: "Engineering",
    joinDate: "2023-03-05",
  },
  {
    id: 43,
    name: "Oscar Indigo",
    email: "oscar.indigo@test.test.test",
    age: 39,
    role: "Manager",
    status: "Active",
    location: "Tokyo",
    department: "Sales",
    joinDate: "2014-10-01",
  },
  {
    id: 44,
    name: "Paula Purple",
    email: "paula.purple@test.test.test",
    age: 32,
    role: "HR",
    status: "Inactive",
    location: "New York",
    department: "Human Resources",
    joinDate: "2017-08-22",
  },
  {
    id: 45,
    name: "Quentin Black",
    email: "quentin.black@test.test.test",
    age: 29,
    role: "Tester",
    status: "Active",
    location: "San Francisco",
    department: "Quality Assurance",
    joinDate: "2020-09-10",
  },
  {
    id: 46,
    name: "Rita Cyan",
    email: "rita.cyan@test.test.test",
    age: 40,
    role: "Designer",
    status: "Active",
    location: "Dubai",
    department: "Design",
    joinDate: "2015-06-05",
  },
  {
    id: 47,
    name: "Steven Orange",
    email: "steven.orange@test.test.test",
    age: 34,
    role: "Developer",
    status: "Inactive",
    location: "London",
    department: "Engineering",
    joinDate: "2021-03-01",
  },
  {
    id: 48,
    name: "Tina Violet",
    email: "tina.violet@test.test.test",
    age: 35,
    role: "Manager",
    status: "Active",
    location: "Berlin",
    department: "Operations",
    joinDate: "2019-04-20",
  },
  {
    id: 49,
    name: "Uma Brown",
    email: "uma.brown@test.test.test",
    age: 41,
    role: "Manager",
    status: "Inactive",
    location: "Tokyo",
    department: "Sales",
    joinDate: "2013-02-15",
  },
  {
    id: 50,
    name: "Victor Red",
    email: "victor.red@test.test.test",
    age: 30,
    role: "Tester",
    status: "Active",
    location: "San Francisco",
    department: "Quality Assurance",
    joinDate: "2018-01-01",
  },
  {
    id: 51,
    name: "William Yellow",
    email: "william.yellow@test.test.test",
    age: 45,
    role: "CEO",
    status: "Active",
    location: "New York",
    department: "Executive",
    joinDate: "2010-12-01",
  },
  {
    id: 52,
    name: "Xena Silver",
    email: "xena.silver@test.test.test",
    age: 28,
    role: "Developer",
    status: "Active",
    location: "Dubai",
    department: "Engineering",
    joinDate: "2020-07-01",
  },
  {
    id: 53,
    name: "Yvonne Gold",
    email: "yvonne.gold@test.test.test",
    age: 39,
    role: "HR",
    status: "Inactive",
    location: "Berlin",
    department: "Human Resources",
    joinDate: "2016-04-25",
  },
  {
    id: 54,
    name: "Zachary Blue",
    email: "zachary.blue@test.test.test",
    age: 31,
    role: "Tester",
    status: "Active",
    location: "Sydney",
    department: "Quality Assurance",
    joinDate: "2021-11-11",
  },
  {
    id: 55,
    name: "Anna Black",
    email: "",
    age: 27,
    role: "Designer",
    status: "Deleted",
    location: "Toronto",
    department: "Design",
    joinDate: "2017-09-18",
  },
  {
    id: 56,
    name: "Brian Green",
    email: "",
    age: 33,
    role: "Manager",
    status: "Active",
    location: "Berlin",
    department: "Operations",
    joinDate: "2010-04-01",
  },
  {
    id: 57,
    name: "Clara White",
    email: "",
    age: 29,
    role: "Tester",
    status: "Active",
    location: "London",
    department: "Quality Assurance",
    joinDate: "2022-03-15",
  },
  {
    id: 58,
    name: "David Gray",
    email: "",
    age: 35,
    role: "HR",
    status: "Active",
    location: "San Francisco",
    department: "Human Resources",
    joinDate: "2015-07-07",
  },
  {
    id: 59,
    name: "Emma Blue",
    email: "",
    age: 24,
    role: "Intern",
    status: "Inactive",
    location: "New York",
    department: "Design",
    joinDate: "2020-01-01",
  },
  {
    id: 60,
    name: "John Doe",
    email: "",
    age: 37,
    role: "Developer",
    status: "Active",
    location: "Sydney",
    department: "Engineering",
  },
  {
    id: 61,
    name: "Jane Doe",
    email: "",
    age: 50,
    role: "Manager",
    status: "Inactive",
    location: "Tokyo",
    department: "Operations",
  },
  {
    id: 62,
    name: "Jane Doe",
    email: "",
    age: 24,
    role: "Designer",
    status: "Active",
    location: "San Francisco",
    department: "Design",
  },
  {
    id: 63,
    name: "Bob Doe",
    email: "",
    age: 41,
    role: "Developer",
    status: "Active",
    location: "Berlin",
    department: "Engineering",
  },
  {
    id: 64,
    name: "John Doe",
    email: "",
    age: 29,
    role: "Tester",
    status: "Inactive",
    location: "Tokyo",
    department: "Quality Assurance",
  },
  {
    id: 65,
    name: "Alice Johnson",
    email: "",
    age: 26,
    role: "Developer",
    status: "Active",
    location: "Sydney",
    department: "Engineering",
  },
  {
    id: 66,
    name: "Alice Johnson",
    email: "",
    age: 37,
    role: "Manager",
    status: "Inactive",
    location: "Dubai",
    department: "Sales",
  },
  {
    id: 67,
    name: "Alice Johnson",
    email: "",
    age: 33,
    role: "Developer",
    status: "Active",
    location: "Toronto",
    department: "Engineering",
  },
  {
    id: 68,
    name: "Alice Johnson",
    email: "",
    age: 45,
    role: "CEO",
    status: "Active",
    department: "Executive",
  },
  {
    id: 69,
    name: "Bob Brown",
    email: "",
    age: 50,
  },
  {
    id: 70,
    name: "Charlie Black",
    email: "",
    age: 31,
  },
  {
    id: 71,
    name: "Daisy White",
    email: "",
    age: 27,
    role: "Developer",
    status: "Active",
    location: "Toronto",
    department: "Engineering",
  },
  {
    id: 72,
    name: "Eve Green",
    email: "",
    age: 34,
    role: "Manager",
    status: "Inactive",
    location: "Berlin",
    department: "Operations",
  },
  {
    id: 73,
    name: "Frank Gray",
    email: "",
    age: 32,
    role: "Developer",
    status: "Active",
    location: "Sydney",
    department: "Engineering",
  },
  {
    id: 74,
    name: "Grace Blue",
    email: "",
    age: 28,
    role: "Designer",
    status: "Active",
    location: "Dubai",
    department: "Design",
  },
  {
    id: 75,
    name: "Hank Yellow",
    email: "",
    age: 39,
    role: "Manager",
    status: "Active",
    location: "Tokyo",
    department: "Operations",
  },
  {
    id: 76,
    name: "Ivy Purple",
    email: "",
    age: 42,
    role: "Designer",
    status: "Inactive",
    location: "San Francisco",
  },
  {
    id: 77,
    name: "Jack Red",
    email: "",
    age: 29,
    role: "Developer",
    status: "Active",
    location: "London",
    department: "Engineering",
  },
  {
    id: 78,
    name: "Karen Orange",
    email: "",
    age: 25,
    status: "Active",
    location: "New York",
    department: "Operations",
  },
  {
    id: 79,
    name: "Leo Violet",
    email: "",
    age: 36,
    role: "Intern",
    status: "Active",
    location: "Tokyo",
    department: "Quality Assurance",
  },
  {
    id: 80,
    name: "Molly Pink",
    email: "",
    age: 30,
    role: "Designer",
    status: "Deleted",
    location: "Sydney",
    department: "Design",
  },
  {
    id: 81,
    name: "Nathan Silver",
    email: "",
    age: 43,
    role: "Tester",
    status: "Active",
    location: "Dubai",
    department: "Quality Assurance",
  },
  {
    id: 82,
    name: "John Doe",
  },
  {
    id: 83,
    name: "Jane Smith",
    age: 43,
    role: "Tester",
    status: "Active",
    location: "Dubai",
    department: "Quality Assurance",
  },
  {
    id: 84,
    name: "Alice Johnson",
    age: 27,
    role: "Developer",
    status: "Active",
    location: "Toronto",
    department: "Engineering",
  },
];

let data = predefinedData;

let currentPage = 1;
const rowsPerPage = 10;
let filteredData = [];
let selectedFilters = { name: [], role: [], status: [] };
let sortColumn = null;
let sortDirection = "asc";
const possibleTypes = ["name", "role", "status"];

const dropdownNamesHeader = document.querySelector(".dropdown-names-header");
const dropdownRolesHeader = document.querySelector(".dropdown-roles-header");
const dropdownStatusHeader = document.querySelector(".dropdown-status-header");
const dropdownNamesList = document.querySelector(".dropdown-names-list");
const dropdownRolesList = document.querySelector(".dropdown-roles-list");
const dropdownStatusList = document.querySelector(".dropdown-status-list");
const dropdownNamesArrow = document.querySelector(".dropdown-names-arrow");
const dropdownRolesArrow = document.querySelector(".dropdown-roles-arrow");
const dropdownStatusArrow = document.querySelector(".dropdown-status-arrow");
const dropdownItemsNamesContainer = document.getElementById("dropdownItemsNames");
const dropdownItemsRolesContainer = document.getElementById("dropdownItemsRoles");
const dropdownItemsStatusContainer = document.getElementById("dropdownItemsStatus");
const dataGridBody = document.getElementById("dataGridBody");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const dropdownSearchName = document.getElementById("dropdownSearchName");
const dropdownSearchRole = document.getElementById("dropdownSearchRole");
const dropdownSearchStatus = document.getElementById("dropdownSearchStatus");
const selectedItemsContainer = document.getElementById("selectedItems");
const elementsCount = document.getElementById("elementsCount");
const collapseAllButton = document.getElementById("collapseAllButton");

function toggleDropdownNames() {
  dropdownNamesList.classList.toggle("show");
  dropdownNamesArrow.classList.toggle("open");
}

function toggleDropdownRoles() {
  dropdownRolesList.classList.toggle("show");
  dropdownRolesArrow.classList.toggle("open");
}

function toggleDropdownStatus() {
  dropdownStatusList.classList.toggle("show");
  dropdownStatusArrow.classList.toggle("open");
}

function populateDropdownItems(dropdownItemsContainer, type, filter = "") {
  dropdownItemsContainer.innerHTML = "";
  const filteredOptions = data
    .map((row) => row[type])
    .filter((value, index, self) => self.indexOf(value) === index)
    .filter((value) => value?.toLowerCase().includes(filter.toLowerCase()));

  // sort alphabetically
  filteredOptions.sort((a, b) => a.localeCompare(b));

  filteredOptions.forEach((value) => {
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

function toggleSelection(type, name) {
  if (selectedFilters[type].includes(name)) {
    selectedFilters[type] = selectedFilters[type].filter((selected) => selected !== name);
  } else {
    selectedFilters[type].push(name);
  }
  populateDropdownItems(dropdownItemsNamesContainer, "name", dropdownSearchName.value);
  populateDropdownItems(dropdownItemsRolesContainer, "role", dropdownSearchRole.value);
  populateDropdownItems(dropdownItemsStatusContainer, "status", dropdownSearchStatus.value);
  updateSelectedItems();
  filterTableByAll();
}

function filterTableByAll() {
  filteredData = data.filter(
    (row) =>
      (selectedFilters.name.length === 0 || selectedFilters.name.includes(row.name)) &&
      (selectedFilters.role.length === 0 || selectedFilters.role.includes(row.role)) &&
      (selectedFilters.status.length === 0 || selectedFilters.status.includes(row.status))
  );
  currentPage = 1;
  renderTableGlobalCallback();
}

function filterTableByType(type) {
  filteredData = data.filter((row) => selectedFilters[type].length === 0 || selectedFilters[type].includes(row[type]));
  currentPage = 1;
  renderTableGlobalCallback();
}

document.querySelectorAll(".data-grid th").forEach((header) => {
  header.addEventListener("click", () => {
    const column = header.dataset.column; // Column name
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

function sortTable() {
  filteredData.sort((a, b) => {
    const aTemp = a[sortColumn] ?? "";
    const bTemp = b[sortColumn] ?? "";

    if (aTemp < bTemp) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aTemp > bTemp) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });
  renderTableGlobalCallback();
}

function updateSortIcons() {
  document.querySelectorAll(".data-grid th").forEach((header) => {
    const column = header.dataset.column;
    const icon = header.querySelector(".sort-icon");
    if (column === sortColumn) {
      icon.textContent = sortDirection === "asc" ? "▲" : "▼";
    } else {
      icon.textContent = "";
    }
  });
}

function renderSimpleTable() {
  dataGridBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const rows = filteredData.slice(start, end);

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.name ?? "[NOT SET]"}</td>
                <td>${row.age ?? "[NOT SET]"}</td>
                <td>${row.role ?? "[NOT SET]"}</td>
                <td>${row.location ?? "[NOT SET]"}</td>
                <td>${row.department ?? "[NOT SET]"}</td>
                <td>${row.status ?? "[NOT SET]"}</td>
            `;
    dataGridBody.appendChild(tr);
  });

  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredData.length / rowsPerPage)}`;
  prevPageButton.classList.toggle("disabled", currentPage === 1);
  nextPageButton.classList.toggle("disabled", currentPage === Math.ceil(filteredData.length / rowsPerPage));
  updateElementsCount(filteredData.length);
}

function renderTableWithAdditionalInfo() {
  dataGridBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const rows = filteredData.slice(start, end);

  rows.forEach((row) => {
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
                <p><strong>Vacation Days:</strong> ${row.additionalData?.sickDays ?? "[NOT SET]"}</p>
                <p><strong>Salary:</strong> ${`${row.additionalData?.salary} USD` ?? "[NOT SET]"}</p> 
                <p><strong>Performance:</strong> ${`${row.additionalData?.performance}%` ?? "[NOT SET]"}</p> 
                <p><strong>Preferred Working Hours:</strong> ${
                  row.additionalData?.preferredWorkingHours ?? "[NOT SET]"
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

  pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredData.length / rowsPerPage)}`;
  prevPageButton.classList.toggle("disabled", currentPage === 1);
  nextPageButton.classList.toggle("disabled", currentPage === Math.ceil(filteredData.length / rowsPerPage));
  updateElementsCount(filteredData.length);
}

function updateElementsCount(count) {
  if (count === 0) {
    elementsCount.textContent = "No elements found";
    return;
  }
  elementsCount.textContent = `Found ${count} elements`;
}

prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTableGlobalCallback();
  }
});

nextPageButton.addEventListener("click", () => {
  if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
    currentPage++;
    renderTableGlobalCallback();
  }
});

dropdownNamesHeader.addEventListener("click", toggleDropdownNames);
dropdownRolesHeader.addEventListener("click", toggleDropdownRoles);
dropdownStatusHeader.addEventListener("click", toggleDropdownStatus);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-names-container") && !e.target.closest(".dropdown-name-item")) {
    dropdownNamesList.classList.remove("show");
    dropdownNamesArrow.classList.remove("open");
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-roles-container") && !e.target.closest(".dropdown-role-item")) {
    dropdownRolesList.classList.remove("show");
    dropdownRolesArrow.classList.remove("open");
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-status-container") && !e.target.closest(".dropdown-status-item")) {
    dropdownStatusList.classList.remove("show");
    dropdownStatusArrow.classList.remove("open");
  }
});

dropdownSearchName.addEventListener("input", (e) =>
  populateDropdownItems(dropdownItemsNamesContainer, "name", e.target.value)
);

dropdownSearchRole.addEventListener("input", (e) =>
  populateDropdownItems(dropdownItemsRolesContainer, "role", e.target.value)
);

dropdownSearchStatus.addEventListener("input", (e) =>
  populateDropdownItems(dropdownItemsStatusContainer, "status", e.target.value)
);

function updateSelectedItems() {
  selectedItemsContainer.innerHTML = "";

  possibleTypes.forEach((type) => {
    selectedFilters[type].forEach((item) => {
      const selectedItem = document.createElement("div");
      selectedItem.classList.add("selected-item");
      selectedItem.classList.add(`selected-${type}-item`);
      selectedItem.textContent = item;

      const removeButton = document.createElement("span");
      removeButton.textContent = "×";
      removeButton.classList.add("remove-item");
      removeButton.addEventListener("click", () => {
        toggleSelection(type, item);
      });

      selectedItem.appendChild(removeButton);
      selectedItemsContainer.appendChild(selectedItem);
    });
  });
}

async function getRandomEmployeesData(seed, details) {
  let url = `/api/v1/data/random/employees`;

  if (seed !== undefined) {
    url += `?seed=${seed}`;
  }

  if (details === true) {
    url += url.includes("?") ? "&details=true" : "?details=true";
  }

  return fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
}

function populateDataFromAPI(random = false) {
  let seed = undefined;
  if (random === false) {
    seed = "test";
  }

  getRandomEmployeesData(seed)
    .then((response) => response.json())
    .then((json) => {
      populateData(json, false, renderSimpleTable);
    });
}

function populateDataFromAPIWithRenderCallback(renderCallback, random = false) {
  let seed = undefined;
  if (random === false) {
    seed = "test";
  }

  getRandomEmployeesData(seed, true)
    .then((response) => response.json())
    .then((json) => {
      populateData(json, false, renderCallback);
    });
}

let renderTableGlobalCallback = renderSimpleTable;

function setRenderTableGlobalCallback(callback) {
  renderTableGlobalCallback = callback;
}

function populateData(customData, usePredefinedData = true, renderTableCallback) {
  if (usePredefinedData === true) {
    data = predefinedData;
  } else {
    data = customData;
  }

  if (renderTableCallback !== undefined) {
    renderTableGlobalCallback = renderTableCallback;
  }

  filteredData = [...data];
  populateDropdownItems(dropdownItemsNamesContainer, "name");
  populateDropdownItems(dropdownItemsRolesContainer, "role");
  populateDropdownItems(dropdownItemsStatusContainer, "status");
  renderTableGlobalCallback();
}

function collapseAllRows() {
  const expandedRows = document.querySelectorAll(".expanded-content.show");
  const expandedParentRows = document.querySelectorAll(".expandable-row.expanded");

  expandedRows.forEach((row) => {
    row.classList.remove("show");
    setTimeout(() => {
      if (!row.classList.contains("show")) {
        row.style.display = "none";
      }
    }, 300);
  });

  expandedParentRows.forEach((row) => {
    row.classList.remove("expanded");
  });
}

collapseAllButton.addEventListener("click", collapseAllRows);
