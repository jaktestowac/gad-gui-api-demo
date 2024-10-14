const urlBooks = "/api/books";
const urlBookAuthors = "/api/book-authors";
const urlBookGenres = "/api/book-genres";

async function issueGetBooksRequest(
  limit = 6,
  page = 1,
  searchPhrase = undefined,
  sortingType = "published_at",
  sortingOrder = "desc"
) {
  let urlBooksPaged = `${urlBooks}?_limit=${limit}&_page=${page}&_sort=${sortingType}&_order=${sortingOrder}`;
  if (searchPhrase !== undefined && searchPhrase.length > 0) {
    urlBooksPaged += `&q=${searchPhrase}`;
  }
  const data = fetch(urlBooksPaged, {
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

  return authorsContainer.innerHTML;
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

  return genresContainer.innerHTML;
}

function createBookPopup(book) {
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
                    <h2>${book.title}</h2>
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
                                <h4 class="book-title">${book.title}</h4>
                                <div class="book-details">
                                    <span><strong>Author:</strong> ${formatAuthors(book.author_ids)}</span><br>
                                    <span><strong>Published:</strong> ${published_at}</span><br>
                                    <span><strong>Genre:</strong> ${formatGenres(book.genre_ids)}</span><br>
                                    <span><strong>Language:</strong> ${book.language}</span><br>
                                    <span><strong>Pages:</strong> ${book.pages}</span><br>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="book-tools">
                </div>
                <div class="book-description">
                    <p>${shortenedDescription}</p>
                </div>
            </div>
        </div>
        </div>
    </div>
    `;

  placeholder.appendChild(popup);
}

function appendBooksData(data, booksContainer) {
  data.forEach((book) => {
    const bookCard = document.createElement("div");
    bookCard.className = "book-card";

    const published_at = getYearMonthDayFromDateString(book.published_at);

    let shortenedDescription = "[No Description]";

    if (book.description) {
      shortenedDescription = book.description.length > 250 ? book.description.slice(0, 250) + "..." : book.description;
    }

    bookCard.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div align="center">
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
                                <h4 class="book-title book-clickable-component" onclick="showBookDetails(${book.id})">${
      book.title
    }</h4>
                                <div class="book-details">
                                    <span><strong>Author:</strong> ${formatAuthors(book.author_ids)}</span><br>
                                    <span><strong>Published:</strong> ${published_at}</span><br>
                                    <span><strong>Genre:</strong> ${formatGenres(book.genre_ids)}</span><br>
                                    <span><strong>Language:</strong> ${book.language}</span><br>
                                    <span><strong>Pages:</strong> ${book.pages}</span><br>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="book-tools">
                </div>
                <div class="book-description">
                    <p>${shortenedDescription}</p>
                </div>
            </div>
        </div>
    `;
    booksContainer.appendChild(bookCard);
  });
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

async function renderBooks(records_per_page, current_page, searchPhrase, sortingType, sortingOrder, clearData = false) {
  return issueGetBooksRequest(records_per_page, current_page, searchPhrase, sortingType, sortingOrder).then(
    (response) => {
      if (response.status === 200) {
        return response.json().then((data) => {
          const booksContainer = document.getElementById("books-container");
          if (clearData) {
            booksContainer.innerHTML = "";
          }

          appendBooksData(data, booksContainer);
          getBookAuthorsAndGenres();
          return data;
        });
      } else {
        noBooksFound();
        return [];
      }
    }
  );
}

function noBooksFound() {
  const booksContainer = document.getElementById("books-container");
  booksContainer.innerHTML = "";
  const element = document.createElement("div");
  element.className = "book-card";
  element.innerHTML = `<h3>No books found</h3> <p>Try searching for something else</p>`;
  booksContainer.appendChild(element);
}

let sortingType = "published_at";
let sortingOrder = "desc";
let current_page = 1;
let scrollLoading = false;
let searchPhrase = undefined;
let records_per_page = 9;

renderBooks(records_per_page, current_page, searchPhrase, sortingType, sortingOrder);

function seachByText() {
  let searchInput = document.getElementById("search-input");
  searchPhrase = searchInput.value;
  current_page = 1;
  renderBooks(records_per_page, current_page, searchPhrase, sortingType, sortingOrder, true).then((data) => {
    if (data.length > 0) {
      current_page++;
    } else {
      noBooksFound();
    }
  });
}

// sorting:
function updateSorting() {
  let options = document.getElementById("sorting");
  sortingType = options.value.split(" ")[0];
  sortingOrder = options.value.split(" ")[1];
}

function changeSorting() {
  updateSorting();
  current_page = 1;
  renderBooks(records_per_page, current_page, searchPhrase, sortingType, sortingOrder, true);
  current_page++;
}

/// infinite scroll:
function appendContent(newContent) {
  const booksContainer = document.getElementById("books-container");
  appendBooksData(newContent, booksContainer);
  scrollLoading = false;
}

function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function checkScroll() {
  const loadingElement = document.getElementById("scroll-loading");
  loadingElement.innerHTML = "Loading...";

  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5 && scrollLoading === false) {
    scrollLoading = true;
    loadingElement.style.display = "block";

    // Fetch new content and append it to the page
    // delay displaying next element:
    const randomTime = getRandomValue(200, 1000);

    await sleep(randomTime).then((msg) => {
      current_page++;
      renderBooks(records_per_page, current_page, searchPhrase, sortingType, sortingOrder).then((data) => {
        loadingElement.style.display = "none";
        scrollLoading = false;
        if (data.length > 0) {
          checkScroll();
        }
      });
    });
  }
}

document.addEventListener("scroll", checkScroll);
const sleep = (time) => new Promise((res) => setTimeout(res, time));
