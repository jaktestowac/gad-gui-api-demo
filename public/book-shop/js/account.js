const urlBookShopRoles = "/api/book-shop-roles";

const sections = [
  {
    name: "wishlisted",
    header: "wishlisted",
    fieldName: "wishlist_books_ids",
  },
  {
    name: "purchased",
    header: "purchased in 🦎GAD BookShop",
    fieldName: "purchased_book_ids",
  },
  {
    name: "favorite",
    header: "favorite",
    fieldName: "favorite_books_ids",
  },
  {
    name: "owned",
    header: "owned",
    fieldName: "owned_books_ids",
  },
  {
    name: "read",
    header: "read",
    fieldName: "read_books_ids",
  },
];

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

  const profileCard = document.createElement("div");
  profileCard.classList.add("profile-card");

  const imageColumn = document.createElement("div");
  imageColumn.classList.add("image-column");

  const profileImage = document.createElement("img");
  profileImage.src = `./../${userData.avatar}`;
  profileImage.alt = "Profile Image";
  profileImage.classList.add("profile-image");
  imageColumn.appendChild(profileImage);

  const editButton = document.createElement("span");
  editButton.innerHTML = `<i class="fa-solid fa-pen-to-square"></i>`;
  editButton.title = "Edit Account";
  editButton.classList.add("book-clickable-component");
  editButton.classList.add("clickable-btn");
  editButton.classList.add("edit-account-button");
  editButton.addEventListener("click", () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((accountData) => {
          createAccountEditPopup(accountData, updateAccountAddressData);
        });
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while getting account data. ${data.error?.message}`, 2);
        });
      }
    });
  });
  imageColumn.appendChild(editButton);

  const detailsColumn = document.createElement("div");
  detailsColumn.classList.add("details-column");

  const profileDetails = document.createElement("div");
  profileDetails.classList.add("profile-details");

  const name = document.createElement("h4");
  name.textContent = userData.firstname + " " + userData.lastname;
  name.classList.add("account-name");
  profileDetails.appendChild(name);

  const roleContainer = document.createElement("div");
  roleContainer.textContent = "Role: ";
  roleContainer.classList.add("account-role");
  const role = document.createElement("span");
  role.textContent = "";
  role.setAttribute("id", `role-${accountData.role_id}`);
  roleContainer.appendChild(role);
  profileDetails.appendChild(roleContainer);

  const fundsContainer = document.createElement("div");
  const funds = document.createElement("div");
  funds.textContent = `Funds: ${formatPrice(accountData.funds)} PLN`;
  funds.classList.add("account-funds");

  const fundsManagementContainer = document.createElement("div");
  const cardManagementButton = document.createElement("span");
  cardManagementButton.innerHTML = `<i class="fa-regular fa-credit-card"></i>`;
  cardManagementButton.classList.add("book-clickable-component");
  cardManagementButton.classList.add("clickable-btn");
  cardManagementButton.title = "Manage Card";
  cardManagementButton.addEventListener("click", () => {
    createAccountPaymentCardEditPopup(userData)
  });

  const fundsManagementButton = document.createElement("span");
  fundsManagementButton.innerHTML = `<i class="fa-solid fa-money-bill-transfer"></i>`;
  fundsManagementButton.classList.add("book-clickable-component");
  fundsManagementButton.classList.add("clickable-btn");
  fundsManagementButton.title = "Manage Funds";
  fundsManagementButton.addEventListener("click", () => {
    // TODO
  });

  fundsManagementContainer.appendChild(cardManagementButton);
  fundsManagementContainer.appendChild(fundsManagementButton);
  fundsContainer.appendChild(funds);
  fundsContainer.appendChild(fundsManagementContainer);

  profileDetails.appendChild(fundsContainer);
  profileDetails.appendChild(document.createElement("br"));

  const addressContainer = document.createElement("div");
  addressContainer.textContent = "Address: ";
  const address = document.createElement("div");
  address.classList.add("account-address");
  address.classList.add("hidden-data");

  const addressData = [accountData.country, accountData.city, accountData.street, accountData.postal_code];
  address.innerHTML = addressData.filter((data) => data).join(", ");

  if (!address.textContent) {
    address.textContent = "No address provided";
  }

  addressContainer.appendChild(address);
  profileDetails.appendChild(addressContainer);

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

function updateAccountAddressData(accountData) {
  const accountAddress = document.querySelector(".account-address");
  const addressData = [accountData.country, accountData.city, accountData.street, accountData.postal_code];

  accountAddress.innerHTML = addressData.filter((data) => data).join(", ");
  if (!accountAddress.textContent) {
    accountAddress.textContent = "No address provided";
  }
}

function displayBooks(booksData, type = "owned", sectionHeader = "owned") {
  const id = `${type}-books-container`;
  let booksContainer = document.getElementById(id);
  if (booksContainer) {
    booksContainer.innerHTML = "";
  }

  const onlyBooksContainer = document.createElement("div");
  onlyBooksContainer.classList.add(`books-container`);

  const booksHeader = document.createElement("h4");
  const typeCapital = sectionHeader.charAt(0).toUpperCase() + sectionHeader.slice(1);

  booksHeader.textContent = `${typeCapital} Books (${booksData.length})`;
  booksHeader.classList.add("books-header");
  booksContainer.appendChild(booksHeader);

  const booksList = document.createElement("div");
  booksList.classList.add(`books-list`);
  onlyBooksContainer.appendChild(booksList);
  booksContainer.appendChild(onlyBooksContainer);

  appendBooksData(booksData, booksList, true);
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

  const profileImage = document.createElement("img");
  profileImage.src = `./../${getCookieAvatar()}`;
  profileImage.alt = "Profile Image";
  profileImage.classList.add("profile-image");

  const bookShopImage = document.createElement("img");
  bookShopImage.src = `./../data/gad-bookshop-logo.png`;
  bookShopImage.alt = "BookShop Image";
  bookShopImage.classList.add("profile-image");

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

async function addBooksToolPanels() {
  const callbacks = {
    markAsOwned: () => {
      refreshSection("owned");
    },
    markAsRead: () => {
      refreshSection("read");
    },
    addToCart: () => {
      // TODO: add to cart
    },
    addToWishlist: () => {
      refreshSection("purchased");
    },
    markAsFav: () => {
      refreshSection("favorite");
    },
  };

  const bookIds = addBooksToolsPanel(true, callbacks);
  return issueGetBookShopMyBooksRequest(bookIds).then((response) => {
    if (response.status === 200) {
      return response.json().then((data) => {
        return markButtonsAsActive(data);
      });
    }
    return [];
  });
}

async function displayBookSection(response, type, sectionHeader) {
  if (response.status === 200) {
    return response.json().then((booksData) => {
      displayBooks(booksData, type, sectionHeader);

      const authorIds = getAuthorsMarkedAsRaw();
      const genresIds = getGenresMarkedAsRaw();

      getBookAuthorsAndGenres(authorIds, genresIds);
      return addBooksToolPanels();
    });
  } else {
    return async () => {};
  }
}

function refreshSection(sectionName) {
  return issueGetBookShopAccountRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((accountData) => {
        const section = sections.find((section) => section.name === sectionName);

        if (section === undefined) {
          return;
        }

        const bookIds = accountData[section.fieldName];

        issueGetBooksRequest(bookIds).then((response) => {
          displayBookSection(response, section.name, section.header).then(() => {
            getBookShopItemsInStockAndPrice(bookIds);
          });
        });
      });
    }
  });
}

function createBookSections(sectionId) {
  const allBooksContainer = document.getElementById("all-books-container");

  const booksContainer = document.createElement("div");
  booksContainer.id = `${sectionId}-books-container`;
  allBooksContainer.appendChild(booksContainer);
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

                sections.forEach((section) => {
                  createBookSections(section.name);
                });

                const ownedBooksIds = accountData.owned_books_ids;
                const favoriteBookIds = accountData.favorite_books_ids;
                const purchasedBookIds = accountData.purchased_book_ids;
                const readBooksIds = accountData.read_books_ids;
                const wishlistedBooksIds = accountData.wishlist_books_ids;

                Promise.all([
                  issueGetBooksRequest(wishlistedBooksIds).then((response) => {
                    return displayBookSection(response, "wishlisted", "wishlisted");
                  }),
                  issueGetBooksRequest(ownedBooksIds).then((response) => {
                    return displayBookSection(response, "owned", "owned");
                  }),
                  issueGetBooksRequest(purchasedBookIds).then((response) => {
                    return displayBookSection(response, "purchased", "purchased in 🦎GAD BookShop");
                  }),
                  issueGetBooksRequest(favoriteBookIds).then((response) => {
                    return displayBookSection(response, "favorite", "favorite");
                  }),
                  issueGetBooksRequest(readBooksIds).then((response) => {
                    return displayBookSection(response, "read", "read");
                  }),
                ]).then(() => {
                  const uniqueBookIds = [
                    ...new Set([
                      ...ownedBooksIds,
                      ...favoriteBookIds,
                      ...purchasedBookIds,
                      ...readBooksIds,
                      ...wishlistedBooksIds,
                    ]),
                  ];
                  return getBookShopItemsInStockAndPrice(uniqueBookIds);
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
