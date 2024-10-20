const urlBooks = "/api/books";
const urlBooksOwned = "/api/books/owned";
const urlBooksWishlist = "/api/books/wishlist";
const urlBooksRead = "/api/books/read";
const urlBooksFavorites = "/api/books/favorites";
const urlBookAuthors = "/api/book-authors";
const urlBookGenres = "/api/book-genres";
const urlBookShopAccount = "/api/book-shop-accounts";
const urlBooksShopMyBooks = "/api/book-shop-accounts/my-books";
const urlUser = "/api/users";
const urlBookShopAuthorize = "/api/book-shop-authorize";
const urlBookShopItems = "/api/book-shop-items";
const urlBookShopOrders = "/api/book-shop-orders";
const urlBookShopOrderStatuses = "/api/book-shop-order-statuses";
const urlAddItemToOrder = "/api/book-shop-orders/items";

const showSimpleAlert = (message, type = 0, timeout = 3000) => {
  displaySimpleAlert(message, type, timeout);
};

async function issueUpdateAccountRequest(profileId, country, city, street, postalCode) {
  let urlBook = `${urlBookShopAccount}/${profileId}`;

  const body = {
    country: country,
    city: city,
    street: street,
    postal_code: postalCode,
  };

  const data = fetch(urlBook, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issuePostAuthorizeRequest() {
  const data = fetch(urlBookShopAuthorize, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function checkIfAuthorizedToBookShop() {
  return issuePostAuthorizeRequest().then((response) => {
    if (response.status === 200) {
      return response.json().then((userData) => {
        return userData;
      });
    } else {
      return undefined;
    }
  });
}

async function checkIfUserCanManageOtherUsers() {
  return issuePostAuthorizeRequest().then((response) => {
    if (response.status === 200) {
      return response.json().then((userData) => {
        return userData;
      });
    } else {
      return undefined;
    }
  });
}

async function issueCancelOrderRequest(orderId) {
  let urlBook = `${urlBookShopOrders}/${orderId}`;

  const body = {
    status_id: 20,
  };

  const data = fetch(urlBook, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueApproveAndSendOrderRequest(orderId) {
  let urlBook = `${urlBookShopOrders}/${orderId}`;

  const body = {
    status_id: 5,
  };

  const data = fetch(urlBook, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

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

async function issueCreateUserOrderRequest() {
  let urlOrders = `${urlBookShopOrders}`;
  const data = fetch(urlOrders, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetUserOrderRequest(orderId) {
  let urlOrders = `${urlBookShopOrders}/${orderId}`;
  const data = fetch(urlOrders, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetUserOrdersRequest() {
  let urlOrders = `${urlBookShopOrders}`;
  const data = fetch(urlOrders, {
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

async function issueGetBookShopMyBooksRequest(bookIds) {
  if (bookIds !== undefined && bookIds.length === 0) {
    return { status: 200, json: async () => {} };
  }

  let urlBook = `${urlBooksShopMyBooks}`;
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

async function issueGetBookShopItemsRequest(bookIds) {
  const urlQueryIds = `${bookIds.join("&book_id=")}`;
  const urlQuery = `${urlBookShopItems}?book_id=${urlQueryIds}`;
  const data = fetch(urlQuery, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBooksRequest(bookIds) {
  if (bookIds !== undefined && bookIds.length === 0) {
    return { status: 200, json: async () => [] };
  }

  const urlQueryIds = `${bookIds.join("&id=")}`;
  const urlQuery = `${urlBooks}?id=${urlQueryIds}`;
  const data = fetch(urlQuery, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookAuthorRequest(authorIds) {
  const urlQueryIds = `${authorIds.join("&id=")}`;
  const urlQuery = `${urlBookAuthors}?id=${urlQueryIds}`;
  const data = fetch(urlQuery, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookGenreRequest(genreIds) {
  const urlQueryIds = `${genreIds.join("&id=")}`;
  const urlQuery = `${urlBookGenres}?id=${urlQueryIds}`;
  const data = fetch(urlQuery, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookShopOrderStatusesRequest() {
  const data = fetch(urlBookShopOrderStatuses, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueAddItemToOrderRequest(bookId) {
  const body = {
    book_id: bookId,
  };

  const data = fetch(urlAddItemToOrder, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueRemoveItemFromOrderRequest(bookId) {
  const body = {
    book_id: bookId,
  };

  const data = fetch(urlAddItemToOrder, {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookRequest(bookId) {
  let urlBook = `${urlBooks}/${bookId}`;
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

async function issueGetBookAuthorsRequest() {
  const data = fetch(urlBookAuthors, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookGenresRequest() {
  const data = fetch(urlBookGenres, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function toggleBookAsOwned(bookId) {
  let urlBook = `${urlBooksOwned}/${bookId}`;
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

function toggleBookAsWishlisted(bookId) {
  let urlBook = `${urlBooksWishlist}/${bookId}`;
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

function toggleAsRead(bookId) {
  let urlBook = `${urlBooksRead}/${bookId}`;
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

function toggleWishlist(bookId) {
  let urlBook = `${urlBooksWishlist}/${bookId}`;
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

function toggleFavorites(bookId) {
  let urlBook = `${urlBooksFavorites}/${bookId}`;
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

function createBookToolsPanel(
  bookId,
  callbacks = {
    markAsOwned: undefined,
    markAsRead: undefined,
    addToCart: undefined,
    addToWishlist: undefined,
    markAsFav: undefined,
  }
) {
  const toolsPanel = document.createElement("div");
  toolsPanel.className = "all-tools-panel";
  const topToolsPanel = document.createElement("div");
  topToolsPanel.className = "tools-panel";

  const markAsOwnedButton = document.createElement("span");
  markAsOwnedButton.className = "book-clickable-component";
  markAsOwnedButton.classList.add("book-tools-button");
  markAsOwnedButton.setAttribute("aria-label", "Mark as owned");
  markAsOwnedButton.setAttribute("title", "Mark as owned");
  markAsOwnedButton.setAttribute("id", `owned-button-${bookId}`);
  markAsOwnedButton.innerHTML = `<i class="fa-solid fa-house-user"></i>`;
  markAsOwnedButton.onclick = () => {
    toggleBookAsOwned(bookId).then((response) => {
      markAsOwnedButton.classList.toggle("active");

      if (callbacks.markAsOwned !== undefined) {
        callbacks.markAsOwned();
      }
      showSimpleAlert("Book marked as owned!", 0, 3000);
    });
  };

  const markAsReadButton = document.createElement("span");
  markAsReadButton.className = "book-clickable-component";
  markAsReadButton.classList.add("book-tools-button");
  markAsReadButton.setAttribute("aria-label", "Mark as read");
  markAsReadButton.setAttribute("title", "Mark as read");
  markAsReadButton.setAttribute("id", `read-button-${bookId}`);
  markAsReadButton.innerHTML = `<i class="fa-solid fa-book-open-reader"></i>`;
  markAsReadButton.onclick = () => {
    toggleAsRead(bookId).then((response) => {
      markAsReadButton.classList.toggle("active");

      if (callbacks.markAsRead !== undefined) {
        callbacks.markAsRead();
      }
      showSimpleAlert("Book marked as read!", 0, 3000);
    });
  };

  const addToCartButton = document.createElement("span");
  addToCartButton.className = "book-clickable-component";
  addToCartButton.classList.add("book-tools-button");
  addToCartButton.setAttribute("aria-label", "Add to cart");
  addToCartButton.setAttribute("title", "Add to cart");
  addToCartButton.innerHTML = `<i class="fa-solid fa-cart-arrow-down"></i>`;
  addToCartButton.onclick = () => {
    const parent = addToCartButton.parentElement;
    const inStock = parent.querySelector(".in-stock");
    if (inStock === null) {
      return;
    }

    const inStockValue = inStock.textContent;
    if (inStockValue === "0") {
      const bookTitleElement = document.querySelector(`.book-title-${bookId}`);
      if (bookTitleElement !== null) {
        const bookTitle = bookTitleElement.textContent;
        showSimpleAlert(`Book <i>"${bookTitle}"</i> is out of stock`, 2);
      } else {
        showSimpleAlert("Book is out of stock", 2);
      }
      return;
    }

    issueAddItemToOrderRequest(bookId).then((response) => {
      if (response.status === 200) {
        showSimpleAlert("Book added to order!<br><a href='/book-shop/orders.html'>Go to orders</a>");
        if (callbacks.addToCart !== undefined) {
          callbacks.addToCart();
        }
      } else if (response.status === 201) {
        showSimpleAlert("Book added to new order!<br><a href='/book-shop/orders.html'>Go to orders</a>");
        if (callbacks.addToCart !== undefined) {
          callbacks.addToCart();
        }
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while adding book to cart. ${data.error?.message}`, 2);
        });
      }
    });
  };

  const wishlistButton = document.createElement("span");
  wishlistButton.className = "book-clickable-component";
  wishlistButton.classList.add("book-tools-button");
  wishlistButton.setAttribute("aria-label", "Add to wishlist");
  wishlistButton.setAttribute("title", "Add to wishlist");
  wishlistButton.setAttribute("id", `wishlist-button-${bookId}`);
  wishlistButton.innerHTML = `<i class="fa-solid fa-gift"></i>`;
  wishlistButton.onclick = () => {
    toggleBookAsWishlisted(bookId).then((response) => {
      wishlistButton.classList.toggle("active");

      if (callbacks.addToWishlist !== undefined) {
        callbacks.addToWishlist();
      }
      showSimpleAlert("Book added to wishlist!", 0, 3000);
    });
  };

  const markAsFavButton = document.createElement("span");
  markAsFavButton.className = "book-clickable-component";
  markAsFavButton.classList.add("book-tools-button");
  markAsFavButton.setAttribute("aria-label", "Add to favorites");
  markAsFavButton.setAttribute("title", "Add to favorites");
  markAsFavButton.setAttribute("id", `favorite-button-${bookId}`);
  markAsFavButton.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  markAsFavButton.onclick = () => {
    toggleFavorites(bookId).then((response) => {
      markAsFavButton.classList.toggle("active");

      if (callbacks.markAsFav !== undefined) {
        callbacks.markAsFav();
      }
      showSimpleAlert("Book added to favorites!", 0, 3000);
    });
  };

  const previewButton = document.createElement("span");
  previewButton.className = "book-clickable-component";
  previewButton.classList.add("book-tools-button");
  previewButton.setAttribute("aria-label", "Preview book");
  previewButton.setAttribute("title", "Preview book");
  previewButton.innerHTML = `<i class="fa-regular fa-eye"></i>`;
  previewButton.onclick = () => {
    showBookDetails(bookId);
  };

  topToolsPanel.appendChild(wishlistButton);
  topToolsPanel.appendChild(markAsOwnedButton);
  topToolsPanel.appendChild(markAsReadButton);
  topToolsPanel.appendChild(markAsFavButton);

  const cartToolsPanel = document.createElement("div");
  cartToolsPanel.classList.add("tools-panel");
  cartToolsPanel.classList.add("book-tools-shopping");

  const itemInfo = document.createElement("span");
  itemInfo.className = "item-shop-info";

  const cartItemsContainer = document.createElement("span");
  cartItemsContainer.className = "cart-info-container";
  const cartItems = document.createElement("span");
  cartItems.className = "in-stock";
  cartItems.textContent = "-";
  cartItems.setAttribute("id", `in-stock-${bookId}`);
  cartItems.setAttribute("bookId", bookId);
  cartItems.setAttribute("raw", "true");
  const cartItemsDescription = document.createElement("span");
  cartItemsDescription.className = "cart-item-description";
  cartItemsDescription.textContent = "In stock:";
  cartItemsContainer.appendChild(cartItemsDescription);
  cartItemsContainer.appendChild(cartItems);

  const cartPriceContainer = document.createElement("span");
  cartPriceContainer.className = "cart-info-container";
  const cartPrice = document.createElement("span");
  cartPrice.className = "cart-price";
  cartPrice.textContent = "-.--";
  cartPrice.setAttribute("id", `cart-price-${bookId}`);
  cartPrice.setAttribute("bookId", bookId);
  cartPrice.setAttribute("raw", "true");

  const cartPriceDescription = document.createElement("span");
  cartPriceDescription.className = "cart-item-description";
  cartPriceDescription.textContent = "Price:";
  cartPriceContainer.appendChild(cartPriceDescription);
  cartPriceContainer.appendChild(cartPrice);

  itemInfo.appendChild(cartItemsContainer);
  itemInfo.appendChild(cartPriceContainer);

  cartToolsPanel.appendChild(itemInfo);

  cartToolsPanel.appendChild(addToCartButton);
  toolsPanel.appendChild(topToolsPanel);
  toolsPanel.appendChild(cartToolsPanel);

  return toolsPanel;
}

function formatPrice(price) {
  return (price / 100).toFixed(2);
}

async function getBookShopItemsInStockAndPrice(booksIds) {
  return issueGetBookShopItemsRequest(booksIds).then((response) => {
    if (response.status === 200) {
      return response.json().then((data) => {
        booksIds.forEach((bookId) => {
          const book = data.find((book) => `${book.book_id}` === `${bookId}`);
          const cartItems = document.querySelectorAll(`#in-stock-${bookId}`);
          const cartPrices = document.querySelectorAll(`#cart-price-${bookId}`);

          cartItems.forEach((cartItem) => {
            if (book !== undefined) {
              cartItem.textContent = book.quantity;
            } else {
              cartItem.textContent = "0";
            }
          });
          cartPrices.forEach((cartPrice) => {
            if (book !== undefined) {
              cartPrice.textContent = formatPrice(book.price);
            } else {
              cartPrice.textContent = "-.--";
            }
          });
        });
      });
    }
  });
}

function markButtonsAsActive(userBooks) {
  const keys = {
    wishlist_books_ids: "wishlist-button-",
    favorite_books_ids: "favorite-button-",
    read_books_ids: "read-button-",
    owned_books_ids: "owned-button-",
  };

  if (userBooks === undefined) {
    return;
  }

  Object.keys(keys).forEach((key) => {
    if (userBooks[key] !== undefined) {
      userBooks[key].forEach((bookId) => {
        const buttons = document.querySelectorAll(`#${keys[key]}${bookId}`);
        buttons.forEach((button) => {
          button.classList.add("active");
        });
      });
    }
  });
}

function addBooksToolsPanel(
  overwrite = true,
  callbacks = {
    markAsOwned: undefined,
    markAsRead: undefined,
    addToCart: undefined,
    addToWishlist: undefined,
    markAsFav: undefined,
  }
) {
  const bookIds = [];
  const toolsPanels = document.querySelectorAll(".book-tools");
  toolsPanels.forEach((panel) => {
    const bookId = panel.getAttribute("data-book-id");
    bookIds.push(bookId);
    if (overwrite) {
      panel.innerHTML = "";
    } else {
      const children = panel.children;
      if (children.length > 0) {
        return;
      }
    }
    const toolsPanel = createBookToolsPanel(bookId, callbacks);
    panel.appendChild(toolsPanel);
  });

  return bookIds;
}

function formatAuthors(author_ids) {
  const authorsContainer = document.createElement("div");
  author_ids.forEach((author_id, index) => {
    const authorSpan = document.createElement("span");
    authorSpan.id = `author-${author_id}`;
    authorSpan.textContent = author_id;
    authorSpan.classList.add("author-component");
    authorSpan.setAttribute("author", author_id);
    authorSpan.setAttribute("raw", "true");
    authorsContainer.appendChild(authorSpan);
    if (index < author_ids.length - 1) {
      const commaSpan = document.createElement("span");
      commaSpan.textContent = ", ";
      authorsContainer.appendChild(commaSpan);
    }
  });

  return authorsContainer;
}

async function getAuthors(authorIds = undefined) {
  if (authorIds === undefined) {
    return issueGetBookAuthorsRequest();
  } else if (authorIds.length === 0) {
    return [];
  } else {
    return issueGetBookAuthorRequest(authorIds);
  }
}

async function getGenres(genreIds = undefined) {
  if (genreIds === undefined) {
    return issueGetBookGenresRequest();
  } else if (genreIds.length === 0) {
    return [];
  } else {
    return issueGetBookGenreRequest(genreIds);
  }
}

function showBookDetails(bookId) {
  issueGetBookRequest(bookId).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        createBookPopup(data);
        getBookAuthorsAndGenres(data.author_ids, data.genre_ids);
      });
    }
  });
}

async function getBookAuthorsAndGenres(authorsIds, genresIds) {
  getAuthors(authorsIds).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        data.forEach((author) => {
          const authorSpans = document.querySelectorAll(`#author-${author.id}`);
          authorSpans.forEach((span) => {
            span.innerHTML = author.name;
          });
        });
      });
    }
  });

  getGenres(genresIds).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        data.forEach((genre) => {
          const genreSpans = document.querySelectorAll(`#genre-${genre.id}`);
          genreSpans.forEach((span) => {
            span.innerHTML = genre.name;
          });
        });
      });
    }
  });
}

function formatGenres(genres_ids) {
  const genresContainer = document.createElement("div");
  genres_ids.forEach((genre_id, index) => {
    const genreSpan = document.createElement("span");
    genreSpan.id = `genre-${genre_id}`;
    genreSpan.classList.add("genre-component");
    genreSpan.setAttribute("genre", genre_id);
    genreSpan.setAttribute("raw", "true");
    genreSpan.textContent = genre_id;
    genresContainer.appendChild(genreSpan);
    if (index < genres_ids.length - 1) {
      const commaSpan = document.createElement("span");
      commaSpan.textContent = ", ";
      genresContainer.appendChild(commaSpan);
    }
  });

  return genresContainer;
}

function getPricesMarkedAsRaw() {
  const prices = document.querySelectorAll(".cart-price");
  const bookIds = [];
  prices.forEach((price) => {
    if (price.getAttribute("raw") === "true") {
      bookIds.push(price.getAttribute("bookId"));
      price.removeAttribute("raw");
    }
  });
  return bookIds;
}

function getInStockMarkedAsRaw() {
  const instock = document.querySelectorAll(".in-stock");
  const bookIds = [];
  instock.forEach((item) => {
    if (item.getAttribute("raw") === "true") {
      bookIds.push(item.getAttribute("bookId"));
      item.removeAttribute("raw");
    }
  });
  return bookIds;
}

function getAuthorsMarkedAsRaw() {
  const authors = document.querySelectorAll(".author-component");
  const authorsIds = [];
  authors.forEach((author) => {
    if (author.getAttribute("raw") === "true") {
      authorsIds.push(author.getAttribute("author"));
      author.removeAttribute("raw");
    }
  });

  return authorsIds;
}

function getGenresMarkedAsRaw() {
  const genres = document.querySelectorAll(".genre-component");
  const genresIds = [];
  genres.forEach((genre) => {
    if (genre.getAttribute("raw") === "true") {
      genresIds.push(genre.getAttribute("genre"));
      genre.removeAttribute("raw");
    }
  });

  return genresIds;
}

function appendBooksData(data, booksContainer, skipDescription = false) {
  data.forEach((book) => {
    const bookCard = document.createElement("div");
    bookCard.className = "book-card";

    const published_at = getYearMonthDayFromDateString(book.published_at);

    let shortenedDescription = "[No Description]";

    if (book.description) {
      if (book.description.length > 250) {
        shortenedDescription = book.description.slice(0, 250) + "...";
        shortenedDescription += ` <span class="book-clickable-component" title="Preview book" onclick="showBookDetails(${book.id})"><i class="fa-regular fa-eye"></i></span>`;
      } else {
        shortenedDescription = book.description;
      }
    }

    let displayType = "";
    if (skipDescription) {
      shortenedDescription = "";
      displayType = 'style="display: none;"';
    }

    bookCard.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
              <div align="center" style="width: 100%; height: 100%;">
              <table class="book-table">
                <tr>
                <td>
                  <div align="center" class="book-top-details">
                      <table class="book-table-details">
                          <tr>
                              <td style="text-align: center; ">
                                  <div style="display: flex; align-items: center; justify-content: center; height: 100px;">
                                      <img src="${book.cover}" alt="${
      book.title
    }" style="max-width: 100px; max-height: 100px;">
                                  </div>
                              </td>
                              <td>
                                  <h4 class="book-title book-clickable-component book-title-${
                                    book.id
                                  }" onclick="showBookDetails(${book.id})">${book.title}</h4>
                                  <div class="book-details">
                                      <span><strong>Author:</strong> ${
                                        formatAuthors(book.author_ids).innerHTML
                                      }</span><br>
                                      <span><strong>Published:</strong> ${published_at}</span><br>
                                      <span><strong>Genre:</strong> ${formatGenres(book.genre_ids).innerHTML}</span><br>
                                      <span><strong>Language:</strong> ${book.language}</span><br>
                                      <span><strong>Pages:</strong> ${book.pages}</span><br>
                                  </div>
                              </td>
                          </tr>
                      </table>
                  </div>
                  </td>
                  </tr>
                <tr>
                  <td>
                    <div class="book-tools" id="book-tools-${book.id}" data-book-id="${book.id}">
                    </div>
                    </td>
                </tr>
                <tr ${displayType}>
                <td>
                  <div class="book-description">
                      ${shortenedDescription}
                  </div>
                  </td>
                  </tr>
                  </table>
              </div>
          </div>
      `;
    booksContainer.appendChild(bookCard);
  });
}

function createAccountPaymentCardEditPopup(userData, callbackOnSave = undefined) {
  const placeholder = document.getElementById("book-details-placeholder");
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
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  bookPopupControls.appendChild(closeButton);

  const form = document.createElement("div");
  form.className = "account-edit-form";

  const description = document.createElement("div");
  description.className = "account-edit-description";
  description.innerHTML = `Edit your payment card details.<br>Please provide your card number, expiration date, and CVV.<br>
   <ul>
   <li>Card number must be 20 characters long.</li>
   <li>Expiration date must be in format YYYY-MM-DD.</li>
   <li>CVV must be 5 characters long.</li>
   <li>All fields are required.</li></ul>
   New card will overwrite your old card.<br>
   <strong>Remember values provided!</strong><br>
   You will need them for account top up.
   `;

  const cardNumberLabel = document.createElement("label");
  cardNumberLabel.textContent = "Card Number";
  cardNumberLabel.className = "account-edit-label";

  const cardNumberInput = document.createElement("input");
  cardNumberInput.type = "password";
  cardNumberInput.placeholder = "Card Number";
  cardNumberInput.value = userData.card_number;
  cardNumberInput.className = "account-edit-input";
  cardNumberInput.id = "card-number-input";
  cardNumberInput.classList.add("wide");
  cardNumberInput.maxLength = 20;
  cardNumberInput.value = "";
  cardNumberInput.addEventListener("blur", () => {
    const cardNumberInput = document.getElementById("card-number-input");
    const expirationDateInput = document.getElementById("expiration-date-input");
    const cvvInput = document.getElementById("cvv-input");
    checkCardValidity(cardNumberInput.value, expirationDateInput.value, cvvInput.value);
  });

  const expirationDateLabel = document.createElement("label");
  expirationDateLabel.textContent = "Expiration Date";
  expirationDateLabel.className = "account-edit-label";

  const expirationDateInput = document.createElement("input");
  expirationDateInput.type = "text";
  expirationDateInput.placeholder = "YYYY-MM-DD";
  expirationDateInput.value = userData.expiration_date;
  expirationDateInput.className = "account-edit-input";
  expirationDateInput.maxLength = 10;
  expirationDateInput.id = "expiration-date-input";
  expirationDateInput.classList.add("wide");
  expirationDateInput.value = "";
  expirationDateInput.addEventListener("blur", () => {
    const cardNumberInput = document.getElementById("card-number-input");
    const expirationDateInput = document.getElementById("expiration-date-input");
    const cvvInput = document.getElementById("cvv-input");
    checkCardValidity(cardNumberInput.value, expirationDateInput.value, cvvInput.value);
  });

  const cvvLabel = document.createElement("label");
  cvvLabel.textContent = "CVV";
  cvvLabel.className = "account-edit-label";

  const cvvInput = document.createElement("input");
  cvvInput.type = "password";
  cvvInput.placeholder = "CVV";
  cvvInput.value = userData.cvv;
  cvvInput.maxLength = 5;
  cvvInput.className = "account-edit-input";
  cvvInput.classList.add("wide");
  cvvInput.id = "cvv-input";
  cvvInput.value = "";
  cvvInput.addEventListener("blur", () => {
    const cardNumberInput = document.getElementById("card-number-input");
    const expirationDateInput = document.getElementById("expiration-date-input");
    const cvvInput = document.getElementById("cvv-input");
    checkCardValidity(cardNumberInput.value, expirationDateInput.value, cvvInput.value);
  });

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.id = "save-card-button";

  saveButton.addEventListener("click", () => {
    // TODO:
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";

  cancelButton.className = "book-shop-button-primary";

  cancelButton.addEventListener("click", () => {
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(cardNumberLabel);
  leftColumn.appendChild(expirationDateLabel);
  leftColumn.appendChild(cvvLabel);

  rightColumn.appendChild(cardNumberInput);
  rightColumn.appendChild(expirationDateInput);
  rightColumn.appendChild(cvvInput);

  form.appendChild(leftColumn);
  form.appendChild(rightColumn);

  const columnsContainer = document.createElement("div");
  columnsContainer.className = "account-edit-columns";

  columnsContainer.appendChild(leftColumn);
  columnsContainer.appendChild(rightColumn);

  form.appendChild(description);
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

  disableAddNewCardButton();
  return popup;
}

function checkCardValidity(cardNumber, expirationDate, cvv) {
  const actualCardNumber = cardNumber.replace(/[^0-9]/g, "");
  const actualExpirationDate = expirationDate.replace(/[^0-9-]/g, "");
  const dateParts = actualExpirationDate.split("-");

  if (dateParts.length !== 3) {
    disableAddNewCardButton();
    return;
  }

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    disableAddNewCardButton();
    return;
  }

  const currentDate = new Date();
  const expirationDateValue = new Date(year, month - 1, day);

  if (expirationDateValue < currentDate) {
    disableAddNewCardButton();
    return;
  }

  const actualCvv = cvv.replace(/[^0-9]/g, "");

  if (actualCardNumber.length === 20 && actualExpirationDate.length === 10 && actualCvv.length === 5) {
    enableAddNewCardButton();
  } else {
    disableAddNewCardButton();
  }
}

function disableAddNewCardButton() {
  const createCardButton = document.getElementById("save-card-button");
  createCardButton.disabled = true;
  createCardButton.classList.add("disabled");
}

function enableAddNewCardButton() {
  const createCardButton = document.getElementById("save-card-button");
  createCardButton.disabled = false;
  createCardButton.classList.remove("disabled");
}

function createAccountEditPopup(userData, callbackOnSave = undefined) {
  const placeholder = document.getElementById("book-details-placeholder");
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
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  bookPopupControls.appendChild(closeButton);

  const form = document.createElement("div");
  form.className = "account-edit-form";

  const countryLabel = document.createElement("label");
  countryLabel.textContent = "Country";
  countryLabel.className = "account-edit-label";

  const countryInput = document.createElement("input");
  countryInput.type = "text";
  countryInput.placeholder = "Country";
  countryInput.value = userData.country;
  countryInput.className = "account-edit-input";
  countryInput.maxLength = 256;

  const cityLabel = document.createElement("label");
  cityLabel.textContent = "City";
  cityLabel.className = "account-edit-label";

  const cityInput = document.createElement("input");
  cityInput.type = "text";
  cityInput.placeholder = "City";
  cityInput.value = userData.city;
  cityInput.className = "account-edit-input";
  cityInput.maxLength = 256;

  const streetLabel = document.createElement("label");
  streetLabel.textContent = "Street";
  streetLabel.className = "account-edit-label";

  const streetInput = document.createElement("input");
  streetInput.type = "text";
  streetInput.placeholder = "Street";
  streetInput.value = userData.street;
  streetInput.className = "account-edit-input";
  streetInput.maxLength = 256;

  const postalCodeLabel = document.createElement("label");
  postalCodeLabel.textContent = "Postal Code";
  postalCodeLabel.className = "account-edit-label";

  const postalCodeInput = document.createElement("input");
  postalCodeInput.type = "text";
  postalCodeInput.placeholder = "Postal Code";
  postalCodeInput.value = userData.postal_code;
  postalCodeInput.className = "account-edit-input";
  postalCodeInput.maxLength = 256;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.addEventListener("click", () => {
    issueUpdateAccountRequest(
      userData.id,
      countryInput.value,
      cityInput.value,
      streetInput.value,
      postalCodeInput.value
    ).then((response) => {
      if (response.status === 200) {
        showSimpleAlert("Account updated successfully");
        saveButton.disabled = true;

        if (callbackOnSave !== undefined) {
          response.json().then((data) => {
            callbackOnSave(data);
          });
        }

        setTimeout(() => {
          document.getElementById("book-details-placeholder").innerHTML = "";
        }, 2000);
      } else {
        showSimpleAlert("Account update failed", 2);
      }
    });
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.className = "book-shop-button-primary";
  cancelButton.addEventListener("click", () => {
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(countryLabel);
  leftColumn.appendChild(cityLabel);
  leftColumn.appendChild(postalCodeLabel);
  leftColumn.appendChild(streetLabel);

  rightColumn.appendChild(countryInput);
  rightColumn.appendChild(cityInput);
  rightColumn.appendChild(postalCodeInput);
  rightColumn.appendChild(streetInput);

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

function createBookPopup(book, additionalToolsHTML = false) {
  const placeholder = document.getElementById("book-details-placeholder");
  placeholder.innerHTML = "";

  const popup = document.createElement("div");
  popup.className = "book-popup";

  const published_at = getYearMonthDayFromDateString(book.published_at);
  let shortenedDescription = "[No Description]";

  if (book.description) {
    shortenedDescription = book.description;
  }
  popup.innerHTML = `
      <div class="book-popup-content">
          <div class="popup-body">
              <div class="book-popup-controls">
                  <span class="book-popup-close-button book-clickable-component" onclick="document.getElementById('book-details-placeholder').innerHTML = '';"><i class="fa-solid fa-xmark book-button"></i></span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
              
              <div align="center">
                  <div class="popup-header">
                      <h4 class="book-title">${book.title}</h4>
                  </div>
                  <div align="center" class="book-top-details">
                      <table>
                          <tr>
                              <td style="text-align: center; ">
                                  <div style="display: flex; align-items: center; justify-content: center; height: 100px;">
                                              <img src="${book.cover}" alt="${
    book.title
  }" style="max-width: 100px; max-height: 100px;">
                                  </div>
                              </td>
                              <td>
                                  <div class="book-details">
                                      <span><strong>Author:</strong> ${
                                        formatAuthors(book.author_ids).innerHTML
                                      }</span><br>
                                      <span><strong>Published:</strong> ${published_at}</span><br>
                                      <span><strong>Genre:</strong> ${formatGenres(book.genre_ids).innerHTML}</span><br>
                                      <span><strong>Language:</strong> ${book.language}</span><br>
                                      <span><strong>Pages:</strong> ${book.pages}</span><br>
                                  </div>
                              </td>
                          </tr>
                      </table>
                  </div>
                  <div class="book-tools" data-book-id="${book.id}">
                  </div>
                  <div class="book-description">
                      <p>${shortenedDescription}</p>
                  </div>
              </div>
          </div>
          </div>
      </div>
      `;

  if (additionalToolsHTML === true) {
    popup.querySelector(".book-tools").appendChild(createBookToolsPanel(book.id));
  }

  placeholder.appendChild(popup);
}

function questionToCreateAnAccountWithRedirection() {
  const accountInfo = document.getElementById("account-info");
  const createAccountQuestion = document.createElement("h4");
  createAccountQuestion.innerHTML = "You don't have an account yet.<br>Do you want to create one?";
  createAccountQuestion.classList.add("create-account-question");
  accountInfo.appendChild(createAccountQuestion);

  const createAccountButton = document.createElement("button");
  createAccountButton.textContent = "Create Account";
  createAccountButton.classList.add("book-shop-button-primary");
  createAccountButton.addEventListener("click", () => {
    window.location.href = "/book-shop/account.html";
  });
  accountInfo.appendChild(createAccountButton);
}
