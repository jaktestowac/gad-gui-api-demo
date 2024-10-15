const urlBookShopRoles = "/api/book-shop-roles";

async function issuePostBookShopAccountRequest() {
  let urlBook = `${urlBookShopAccount}`;
  const data = fetch(urlBook, {
    method: "POST",
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

  const addressData = [accountData.country, accountData.city, accountData.street, accountData.postal_code];
  address.innerHTML = addressData.filter((data) => data).join(", ");

  if (!address.textContent) {
    address.textContent = "No address provided";
  }

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

function questionToCreateAnAccount() {
  const accountInfo = document.getElementById("account-info");
  const createAccountQuestion = document.createElement("h4");
  createAccountQuestion.innerHTML = "You don't have an account yet.<br>Do you want to create one?";
  createAccountQuestion.classList.add("create-account-question");
  accountInfo.appendChild(createAccountQuestion);

  const createAccountButton = document.createElement("button");
  createAccountButton.textContent = "Create Account";
  createAccountButton.classList.add("book-shop-button-primary");
  createAccountButton.addEventListener("click", () => {
    createAccountPopup();
  });
  accountInfo.appendChild(createAccountButton);
}

function createAccountPopup() {
  const accountInfo = document.getElementById("book-shop-modal");

  const popup = document.createElement("div");
  popup.className = "book-popup";

  const popupContent = document.createElement("div");
  popupContent.className = "book-popup-content";

  const popupBody = document.createElement("div");
  popupBody.className = "popup-body";

  const popupControls = document.createElement("div");
  popupControls.className = "book-popup-controls";

  const closeButton = document.createElement("span");
  closeButton.className = "book-popup-close-button book-clickable-component";
  closeButton.addEventListener("click", () => {
    document.getElementById("book-shop-modal").innerHTML = "";
  });
  closeButton.innerHTML = `<i class="fa-solid fa-xmark book-button"></i>`;
  popupControls.appendChild(closeButton);

  const mainBody = document.createElement("div");
  mainBody.className = "popup-main-content";

  const createAccountQuestion = document.createElement("h4");
  createAccountQuestion.innerHTML = "BookShop account creation";
  createAccountQuestion.classList.add("create-account-question");
  mainBody.appendChild(createAccountQuestion);

  const userProfileConnectorContainer = document.createElement("div");
  userProfileConnectorContainer.classList.add("user-profile-connector-container");

  // Create profile image
  const profileImage = document.createElement("img");
  profileImage.src = `./../${getCookieAvatar()}`;
  profileImage.alt = "Profile Image";
  profileImage.classList.add("profile-image");

  // Create gad image
  const bookShopImage = document.createElement("img");
  bookShopImage.src = `./../data/gad-bookshop-logo.png`;
  bookShopImage.alt = "BookShop Image";
  bookShopImage.classList.add("profile-image");

  // create connection green tick and a line
  const connectionLine = document.createElement("div");
  connectionLine.classList.add("connection-line");
  connectionLine.innerHTML = `----`;

  const connectionLine2 = document.createElement("div");
  connectionLine2.classList.add("connection-line");
  connectionLine2.innerHTML = `----`;

  const connectionTick = document.createElement("div");
  connectionTick.classList.add("green-tick");
  connectionTick.id = "connection-tick";
  connectionTick.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;

  userProfileConnectorContainer.appendChild(profileImage);
  userProfileConnectorContainer.appendChild(connectionLine);
  userProfileConnectorContainer.appendChild(connectionTick);
  userProfileConnectorContainer.appendChild(connectionLine2);
  userProfileConnectorContainer.appendChild(bookShopImage);

  mainBody.appendChild(userProfileConnectorContainer);

  const accountCreationProcess = document.createElement("div");
  accountCreationProcess.classList.add("account-creation-process");

  // Process is that account is created automatically based on You user profile and may take a while
  // To create an account You need to agree that BookShop will access Your user account

  accountCreationProcess.innerHTML = `
    <h4>Step 1</h4>
    <p>Account is created automatically based on Your user profile</p>
    <h4>Step 2</h4>
    <p>To create an account You need to agree that:</p>
    
    BookShop will access Your <strong>user account</strong><br>
    BookShop will have access to Your <strong>user data</strong><br>
    BookShop will have access to Your <strong>user avatar</strong><br>
  `;

  mainBody.appendChild(accountCreationProcess);

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  const createAccountButton = document.createElement("button");
  createAccountButton.textContent = "I agree - create my account";
  createAccountButton.classList.add("book-shop-button-primary");
  createAccountButton.classList.add("green");
  createAccountButton.addEventListener("click", () => {
    // create new modal with loading spinner
    document.getElementById("book-shop-modal").innerHTML = "";
    const loadingModal = document.createElement("div");
    loadingModal.className = "book-popup";
    const loadingContent = document.createElement("div");
    loadingContent.className = "book-popup-content";
    const loadingBody = document.createElement("div");
    loadingBody.className = "popup-body";
    const loadingSpinner = document.createElement("div");
    loadingSpinner.className = "loading-spinner-2";

    const loadingDescription = document.createElement("div");
    loadingDescription.className = "loading-description";
    loadingDescription.textContent = "Creating account. Please wait...";
    loadingBody.appendChild(loadingDescription);

    const loadingError = document.createElement("div");
    loadingError.className = "loading-error";
    loadingBody.appendChild(loadingError);

    loadingBody.appendChild(loadingSpinner);
    loadingContent.appendChild(loadingBody);
    loadingModal.appendChild(loadingContent);
    document.getElementById("book-shop-modal").appendChild(loadingModal);

    issuePostBookShopAccountRequest().then((response) => {
      if (response.status === 201) {
        response.json().then((data) => {
          document.getElementById("book-shop-modal").innerHTML = "";
          location.reload();
        });
      } else {
        response.json().then((data) => {
          // remove loadingSpinner
          loadingSpinner.remove();
          let errorMessage = data.error?.message ? data.error?.message : JSON.stringify(data);

          loadingError.innerHTML = `Error while creating account. Please try again later.<br>`;

          // Create gad image
          const bookShopImage = document.createElement("img");
          bookShopImage.src = `./../data/gad-bookshop-logo.jpg`;
          bookShopImage.alt = "BookShop Image";
          bookShopImage.classList.add("profile-image");

          const loadingErrorDescription = document.createElement("div");
          loadingErrorDescription.textContent = errorMessage;
          loadingErrorDescription.className = "loading-error-description";
          loadingError.appendChild(bookShopImage);
          loadingError.appendChild(loadingErrorDescription);

          // add close button
          const closeButton = document.createElement("button");
          closeButton.textContent = "Close";
          closeButton.classList.add("book-shop-button-primary");
          closeButton.classList.add("red");
          closeButton.addEventListener("click", () => {
            document.getElementById("book-shop-modal").innerHTML = "";
            location.reload();
          });
          loadingBody.appendChild(closeButton);
        });
      }
    });
  });

  const disagreeButton = document.createElement("button");
  disagreeButton.textContent = "I disagree - cancel";
  disagreeButton.classList.add("book-shop-button-primary");
  disagreeButton.classList.add("red");
  disagreeButton.addEventListener("click", () => {
    document.getElementById("book-shop-modal").innerHTML = "";
  });

  buttonContainer.appendChild(createAccountButton);
  buttonContainer.appendChild(disagreeButton);

  mainBody.appendChild(buttonContainer);

  popupBody.appendChild(popupControls);
  popupBody.appendChild(mainBody);
  popupContent.appendChild(popupBody);
  popup.appendChild(popupContent);
  accountInfo.appendChild(popup);
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
                  .then(() => {
                    const purchasedBookIds = accountData.purchased_book_ids;
                    issueGetBooksRequest(purchasedBookIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "purchased in 🦎GAD BookShop");
                        });
                      }
                    });
                  })
                  .then(() => {
                    const favoriteBookIds = accountData.favorite_books_ids;
                    issueGetBooksRequest(favoriteBookIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "favorite");
                        });
                      }
                    });
                  })
                  .then(() => {
                    const readBooksIds = accountData.read_books_ids;
                    issueGetBooksRequest(readBooksIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "read");
                        });
                      }
                    });
                  })
                  .then(() => {
                    const wishlistedBooksIds = accountData.wishlist_books_ids;
                    issueGetBooksRequest(wishlistedBooksIds).then((response) => {
                      if (response.status === 200) {
                        response.json().then((booksData) => {
                          displayBooks(booksData, "wishlisted");
                        });
                      }
                    });
                  })
                  .then(() => {
                    getBookAuthorsAndGenres();
                  });
              });
            } else if (response.status === 404) {
              // no account - create one
              questionToCreateAnAccount();
            }
          });
        });
      }
    });

    // get profile info
  },
  () => {}
);
