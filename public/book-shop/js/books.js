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

          checkIfAuthorizedToBookShop().then((isAuthorized) => {
            if (isAuthorized !== undefined) {
              addBooksToolsPanel(false);
              issueGetBookShopMyBooksRequest().then((response) => {
                if (response.status === 200) {
                  return response.json().then((data) => {
                    markButtonsAsActive(data);
                  });
                }
              });

              const bookIds1 = getPricesMarkedAsRaw();
              const bookIds2 = getInStockMarkedAsRaw();
              const uniqueBookIds = [...new Set([...bookIds1, ...bookIds2])];

              getBookShopItemsInStockAndPrice(uniqueBookIds);
            }
          });
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
