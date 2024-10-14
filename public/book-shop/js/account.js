const urlBookShopAccount = "/api/book-shop-accounts";
const urlBookShopRoles = "/api/book-shop-roles";
const urlUser = "/api/users";

async function issueGetUserRequest() {
  const id = getId();
  let urlBook = `${urlUser}/${id}`;
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

async function issueGetBookShopAccountRequest() {
  let urlBook = `${urlBookShopAccount}`;
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

async function formatRoles() {
  issueGetBookShopRoles().then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        data.forEach((role) => {
          const genreSpans = document.querySelectorAll(`#role-${role.id}`);
          genreSpans.forEach((span) => {
            span.innerHTML = role.name;
          });
        });
      });
    }
  });
}

function displayAccountInfo(accountData, userData) {
  const accountInfo = document.getElementById("account-info");

  const profileImageAndDetails = document.createElement("div");
  profileImageAndDetails.classList.add("profile-image-and-details");

  // Create profile card
  const profileCard = document.createElement("div");
  profileCard.classList.add("profile-card");

  // Create profile image column
  const imageColumn = document.createElement("div");
  imageColumn.classList.add("image-column");

  // Create profile image
  const profileImage = document.createElement("img");
  profileImage.src = `./../${userData.avatar}`;
  profileImage.alt = "Profile Image";
  profileImage.classList.add("profile-image");
  imageColumn.appendChild(profileImage);

  // Create account details column
  const detailsColumn = document.createElement("div");
  detailsColumn.classList.add("details-column");

  // Create profile details
  const profileDetails = document.createElement("div");
  profileDetails.classList.add("profile-details");

  // Create name
  const name = document.createElement("h4");
  name.textContent = userData.firstname + " " + userData.lastname;
  name.classList.add("account-name");
  profileDetails.appendChild(name);

  // Create role
  const roleContainer = document.createElement("div");
  roleContainer.textContent = "Role: ";
  roleContainer.classList.add("account-role");
  const role = document.createElement("span");
  role.textContent = "";
  role.setAttribute("id", `role-${accountData.role_id}`);
  roleContainer.appendChild(role);
  profileDetails.appendChild(roleContainer);

  // Create founds
  const funds = document.createElement("div");
  funds.textContent = `Funds: ${accountData.funds} PLN`;
  funds.classList.add("account-funds");
  profileDetails.appendChild(funds);

  profileDetails.appendChild(document.createElement("br"));

  // Create address
  const addressContainer = document.createElement("div");
  addressContainer.textContent = "Address: ";
  const address = document.createElement("div");
  address.textContent = `${accountData.country}, ${accountData.city}, ${accountData.street}, ${accountData.postal_code}`;
  address.classList.add("account-address");
  address.classList.add("hidden-data");
  addressContainer.appendChild(address);
  profileDetails.appendChild(addressContainer);

  // Create button to show/hide address
  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Show Address";
  toggleButton.classList.add("toggle-button");
  toggleButton.classList.add("book-shop-button-primary");
  toggleButton.addEventListener("click", () => {
    address.classList.toggle("hidden-data");
    toggleButton.textContent = address.classList.contains("hidden-data") ? "Show Address" : "Hide Address";
  });
  profileDetails.appendChild(toggleButton);

  detailsColumn.appendChild(profileDetails);

  profileImageAndDetails.appendChild(imageColumn);
  profileImageAndDetails.appendChild(detailsColumn);

  profileCard.appendChild(profileImageAndDetails);
  accountInfo.appendChild(profileCard);
}

function displayBooks(booksData, type = "owned") {
  const accountInfo = document.getElementById("account-info");
  const ownedBooksContainer = document.createElement("div");
  ownedBooksContainer.classList.add(`books-container`);

  const ownedBooksHeader = document.createElement("h4");
  const typeCapital = type.charAt(0).toUpperCase() + type.slice(1);

  ownedBooksHeader.textContent = `${typeCapital} Books (${booksData.length})`;
  ownedBooksHeader.classList.add("books-header");
  accountInfo.appendChild(ownedBooksHeader);

  const ownedBooksList = document.createElement("div");
  ownedBooksList.classList.add(`books-list`);
  ownedBooksContainer.appendChild(ownedBooksList);
  accountInfo.appendChild(ownedBooksContainer);

  appendBooksData(booksData, ownedBooksList, true);
}

checkIfAuthenticated(
  "authentication-info",
  () => {
    issueGetUserRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((userData) => {
          issueGetBookShopAccountRequest().then((response) => {
            if (response.status === 200) {
              response.json().then((accountData) => {
                displayAccountInfo(accountData, userData);
                formatRoles();

                // get books
                const ownedBooksIds = accountData.owned_books_ids;
                issueGetBooksRequest(ownedBooksIds)
                  .then((response) => {
                    if (response.status === 200) {
                      response.json().then((booksData) => {
                        displayBooks(booksData, "owned");
                      });
                    }
                  })
                  .then((response) => {
                    const readBooksIds = accountData.read_books_ids;
                    issueGetBooksRequest(readBooksIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "read");
                        });
                      }
                    });
                  })
                  .then((response) => {
                    const borrowedBooksIds = accountData.borrowed_books_ids;
                    issueGetBooksRequest(borrowedBooksIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "borrowed");
                        });
                      }
                    });
                  })
                  .then((response) => {
                    getBookAuthorsAndGenres();
                  });
              });
            }
          });
        });
      }
    });

    // get profile info
  },
  () => {}
);
