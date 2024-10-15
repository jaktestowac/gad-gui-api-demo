const urlBooks = "/api/books";
const urlBooksOwned = "/api/books/owned";
const urlBooksWishlist = "/api/books/wishlist";
const urlBooksRead = "/api/books/read";
const urlBooksFavorites = "/api/books/favorites";
const urlBookAuthors = "/api/book-authors";
const urlBookGenres = "/api/book-genres";
const urlBookShopAccount = "/api/book-shop-accounts";
const urlUser = "/api/users";
const urlBookShopAuthorize = "/api/book-shop-authorize";

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

async function issueGetBooksRequest(booksIds) {
  const urlQueryIds = `${booksIds.join("&id=")}`;
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

function createBookToolsPanel(bookId) {
  const toolsPanel = document.createElement("div");
  toolsPanel.className = "tools-panel";

  const markAsOwnedButton = document.createElement("span");
  markAsOwnedButton.className = "book-clickable-component";
  markAsOwnedButton.classList.add("book-tools-button");
  markAsOwnedButton.setAttribute("aria-label", "Mark as owned");
  markAsOwnedButton.setAttribute("title", "Mark as owned");
  markAsOwnedButton.innerHTML = `<i class="fa-solid fa-house-user"></i>`;
  markAsOwnedButton.onclick = () => {
    toggleBookAsOwned(bookId).then((response) => {
      markAsOwnedButton.classList.toggle("active");
    });
  };

  const markAsReadButton = document.createElement("span");
  markAsReadButton.className = "book-clickable-component";
  markAsReadButton.classList.add("book-tools-button");
  markAsReadButton.setAttribute("aria-label", "Mark as read");
  markAsReadButton.setAttribute("title", "Mark as read");
  markAsReadButton.innerHTML = `<i class="fa-solid fa-book-open-reader"></i>`;
  markAsReadButton.onclick = () => {
    toggleAsRead(bookId).then((response) => {
      markAsReadButton.classList.toggle("active");
    });
  };

  const addToCartButton = document.createElement("span");
  addToCartButton.className = "book-clickable-component";
  addToCartButton.classList.add("book-tools-button");
  addToCartButton.setAttribute("aria-label", "Add to cart");
  addToCartButton.setAttribute("title", "Add to cart");
  addToCartButton.innerHTML = `<i class="fa-solid fa-cart-arrow-down"></i>`;
  addToCartButton.onclick = () => {
    // addToCart(bookId);
    addToCartButton.classList.toggle("active");
  };

  const wishlistButton = document.createElement("span");
  wishlistButton.className = "book-clickable-component";
  wishlistButton.classList.add("book-tools-button");
  wishlistButton.setAttribute("aria-label", "Add to wishlist");
  wishlistButton.setAttribute("title", "Add to wishlist");
  wishlistButton.innerHTML = `<i class="fa-solid fa-gift"></i>`;
  wishlistButton.onclick = () => {
    toggleBookAsWishlisted(bookId).then((response) => {
      wishlistButton.classList.toggle("active");
    });
  };

  const markAsFavButton = document.createElement("span");
  markAsFavButton.className = "book-clickable-component";
  markAsFavButton.classList.add("book-tools-button");
  markAsFavButton.setAttribute("aria-label", "Add to favorites");
  markAsFavButton.setAttribute("title", "Add to favorites");
  markAsFavButton.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  markAsFavButton.onclick = () => {
    toggleFavorites(bookId).then((response) => {
      wishlistButton.classList.toggle("active");
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

  toolsPanel.appendChild(wishlistButton);
  toolsPanel.appendChild(addToCartButton);
  toolsPanel.appendChild(markAsOwnedButton);
  toolsPanel.appendChild(markAsReadButton);
  toolsPanel.appendChild(markAsFavButton);

  return toolsPanel;
}

function formatAuthors(author_ids) {
  const authorsContainer = document.createElement("div");
  author_ids.forEach((author_id, index) => {
    const authorSpan = document.createElement("span");
    authorSpan.id = `author-${author_id}`;
    authorSpan.textContent = author_id;
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
  } else {
    return issueGetBookAuthorRequest(authorIds);
  }
}

async function getGenres(genreIds = undefined) {
  if (genreIds === undefined) {
    return issueGetBookGenresRequest();
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

function appendBooksData(data, booksContainer, skipDescription = false) {
  data.forEach((book) => {
    const bookCard = document.createElement("div");
    bookCard.className = "book-card";

    const published_at = getYearMonthDayFromDateString(book.published_at);

    let shortenedDescription = "[No Description]";

    if (book.description) {
      if (book.description.length > 250) {
        shortenedDescription = book.description.slice(0, 250) + "...";
        shortenedDescription += `<span class="book-clickable-component" title="Preview book" onclick="showBookDetails(${book.id})"><i class="fa-regular fa-eye"></i></span>`;
      } else {
        shortenedDescription = book.description;
      }
    }

    if (skipDescription) {
      shortenedDescription = "";
    }

    bookCard.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center;">
              <div align="center" style="width: 100%;">
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
                                  <h4 class="book-title book-clickable-component" onclick="showBookDetails(${
                                    book.id
                                  })">${book.title}</h4>
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
                  <div class="book-tools" id="book-tools-${book.id}" data-book-id="${book.id}">
                  </div>
                  <div class="book-description">
                      ${shortenedDescription}
                  </div>
              </div>
          </div>
      `;
    booksContainer.appendChild(bookCard);
  });
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
