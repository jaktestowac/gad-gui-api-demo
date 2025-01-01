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
const urlBookShopAccountPaymentCard = "/api/book-shop-account-payment-cards";
const urlBookShopBookReviews = "/api/book-shop-book-reviews";

const showSimpleAlert = (message, type = 0, timeout = 5000) => {
  displaySimpleAlert(message, type, timeout);
};

async function issueGetReviewsStatsRequest(bookIds) {
  const url = `${urlBookShopBookReviews}?book_ids=${bookIds.join(",")}&mean=true`;

  const data = fetch(`${url}?book_ids=&mean=true`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

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

async function issueGetBookReviewsRequest(bookId) {
  const urlQuery = `${urlBookShopBookReviews}?book_id=${bookId}`;
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

async function issuePostAuthorizeRequest(roleIds = undefined) {
  let body = undefined;
  if (roleIds === undefined) {
    body = {};
  } else {
    body = {
      role_ids: roleIds,
    };
  }

  const data = fetch(urlBookShopAuthorize, {
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

async function issuePostAuthorizeRoleRequest(roleIds) {
  const body = {
    role_ids: roleIds,
  };

  const data = fetch(urlBookShopAuthorize, {
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

async function checkIfAuthorizedToBookShop(roleIds = undefined) {
  return issuePostAuthorizeRequest(roleIds).then((response) => {
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

async function issueUpdateAccountBalanceRequest(amount, cvv) {
  const body = {
    amount: amount,
    cvv: cvv,
  };
  const data = fetch(`${urlBookShopAccountPaymentCard}/topup`, {
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

async function issueAddCouponToOrderRequest(orderId, coupon) {
  const body = {
    order_id: orderId,
    coupon_code: coupon,
  };
  const data = fetch(`${urlBookShopOrders}/coupon`, {
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

async function issueGetAccountPaymentCardsRequest() {
  const data = fetch(urlBookShopAccountPaymentCard, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueUpdateAccountPaymentCardRequest(cardNumber, cvv, expirationDate) {
  const body = {
    card_number: cardNumber,
    cvv: cvv,
    expiration_date: expirationDate,
  };
  const data = fetch(urlBookShopAccountPaymentCard, {
    method: "PUT",
    body: JSON.stringify(body),
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

async function issueGetItemRequest(itemId) {
  let urlItems = `${urlBookShopItems}/${itemId}`;
  const data = fetch(urlItems, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetAllBooksRequest() {
  const urlQuery = `${urlBooks}`;
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

function createBookToolsPanelForUnauthorizedUser(bookId) {
  const toolsPanel = document.createElement("div");
  toolsPanel.className = "all-tools-panel";
  const topToolsPanel = document.createElement("div");
  topToolsPanel.className = "tools-panel";

  const reviewsGeneralInfoContainer = document.createElement("div");
  reviewsGeneralInfoContainer.setAttribute("data-book-id", bookId);
  reviewsGeneralInfoContainer.classList.add("book-review-general-info");
  reviewsGeneralInfoContainer.classList.add("book-reviews-container");

  const meanRating = document.createElement("span");
  meanRating.classList.add("book-review-rating");
  meanRating.classList.add("book-reviews-spacing");
  const meanRatingValue = document.createElement("span");
  meanRatingValue.classList.add("book-review-rating");
  meanRatingValue.textContent = "Rating: ";
  const meanRatingValueValue = document.createElement("span");
  meanRatingValueValue.classList.add("book-review-rating-value");
  meanRatingValueValue.classList.add("book-review-mean-rating");
  meanRatingValueValue.setAttribute("id", `mean-rating-${bookId}`);
  meanRatingValueValue.setAttribute("bookId", bookId);
  meanRatingValueValue.setAttribute("raw", "true");
  meanRatingValueValue.textContent = "-";

  const reviewRatingMeanMaxValue = document.createElement("span");
  reviewRatingMeanMaxValue.textContent = `/5`;
  meanRating.appendChild(meanRatingValue);
  meanRating.appendChild(meanRatingValueValue);
  meanRating.appendChild(reviewRatingMeanMaxValue);
  reviewsGeneralInfoContainer.appendChild(meanRating);

  const reviewsCount = document.createElement("span");
  reviewsCount.classList.add("book-reviews-count");
  reviewsCount.classList.add("book-reviews-spacing");
  reviewsCount.setAttribute("raw", "true");
  reviewsCount.setAttribute("bookId", bookId);
  reviewsCount.textContent = `Reviews: ${[].length}`;
  reviewsGeneralInfoContainer.appendChild(reviewsCount);

  toolsPanel.appendChild(reviewsGeneralInfoContainer);

  return toolsPanel;
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
      buttonInteraction("owned", markAsOwnedButton, response, callbacks.markAsOwned);
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
      buttonInteraction("read", markAsReadButton, response, callbacks.markAsRead);
    });
  };

  const addToCartButton = document.createElement("span");
  addToCartButton.className = "book-clickable-component";
  addToCartButton.classList.add("book-tools-button");
  addToCartButton.setAttribute("aria-label", "Add to cart");
  addToCartButton.setAttribute("title", "Add to cart");
  addToCartButton.innerHTML = `<i class="fa-solid fa-cart-arrow-down"></i>`;
  addToCartButton.onclick = () => {
    const parent = addToCartButton.parentElement.parentElement;
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
          showSimpleAlert(`Error while adding book to cart. <strong>${data.error?.message}</strong>`, 2);
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
      buttonInteraction("wishlist", wishlistButton, response, callbacks.addToWishlist);
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
      buttonInteraction("favorites", markAsFavButton, response, callbacks.markAsFav);
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
  topToolsPanel.appendChild(addToCartButton);

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

  const reviewsGeneralInfoContainer = document.createElement("div");
  reviewsGeneralInfoContainer.setAttribute("data-book-id", bookId);
  reviewsGeneralInfoContainer.classList.add("book-review-general-info");
  reviewsGeneralInfoContainer.classList.add("book-reviews-container");

  const meanRating = document.createElement("span");
  meanRating.classList.add("book-review-rating");
  meanRating.classList.add("book-reviews-spacing");
  const meanRatingValue = document.createElement("span");
  meanRatingValue.classList.add("book-review-rating");
  meanRatingValue.textContent = "Rating: ";
  const meanRatingValueValue = document.createElement("span");
  meanRatingValueValue.classList.add("book-review-rating-value");
  meanRatingValueValue.classList.add("book-review-mean-rating");
  meanRatingValueValue.setAttribute("id", `mean-rating-${bookId}`);
  meanRatingValueValue.setAttribute("bookId", bookId);
  meanRatingValueValue.setAttribute("raw", "true");
  meanRatingValueValue.textContent = "-";

  const reviewRatingMeanMaxValue = document.createElement("span");
  reviewRatingMeanMaxValue.textContent = `/5`;
  meanRating.appendChild(meanRatingValue);
  meanRating.appendChild(meanRatingValueValue);
  meanRating.appendChild(reviewRatingMeanMaxValue);
  reviewsGeneralInfoContainer.appendChild(meanRating);

  const reviewsCount = document.createElement("span");
  reviewsCount.classList.add("book-reviews-count");
  reviewsCount.classList.add("book-reviews-spacing");
  reviewsCount.setAttribute("raw", "true");
  reviewsCount.setAttribute("bookId", bookId);
  reviewsCount.textContent = `Reviews: ${[].length}`;
  reviewsGeneralInfoContainer.appendChild(reviewsCount);

  toolsPanel.appendChild(topToolsPanel);
  toolsPanel.appendChild(cartToolsPanel);
  toolsPanel.appendChild(reviewsGeneralInfoContainer);

  return toolsPanel;
}

function buttonInteraction(listName, button, response, callback) {
  button.classList.toggle("active");
  const wasAdded = button.classList.contains("active") ? "added" : "removed";
  if (response.status === 200) {
    showSimpleAlert(`Book ${wasAdded} to list: ${listName}!`, 0);
  } else {
    response.json().then((data) => {
      if (data.error?.message) {
        showSimpleAlert(`Error while adding book to list: ${listName}. ${data.error.message}`, 2);
      }
    });
  }

  if (callback !== undefined) {
    callback();
  }
}

function validateQuantity(quantity) {
  const quantityRegex = /^[0-9]+$/;
  return quantityRegex.test(quantity);
}

function validatePrice(price) {
  const priceRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  return priceRegex.test(price);
}

function formatPrice(price) {
  return formatPriceToDecimalString(price) + " PLN";
}

function formatPriceToDecimalString(price) {
  return (parseInt(price) / 100).toFixed(2);
}

function formatPriceToDecimalNumber(price) {
  price = price.replace(",", ".");
  return parseFloat(formatPriceToDecimalString(price));
}

function formatPriceForBackEnd(priceStr) {
  return Math.round(parseFloat(priceStr) * 100);
}

function formatPriceInInput(price) {
  // add 0.00 to the end of the price
  const newPrice = parseFloat(price).toFixed(2);
  return newPrice;
}

function formatQuantityInInput(quantity) {
  return parseInt(quantity);
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
              cartPrice.textContent = `${formatPrice(book.price)}`;
            } else {
              cartPrice.textContent = "-";
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

function addBooksToolsPanelForUnauthorizedUser(overwrite = true) {
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
    const toolsPanel = createBookToolsPanelForUnauthorizedUser(bookId);
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
        getBookReviews(bookId);
      });
    }
  });
}

function getBookReviews(bookId) {
  issueGetBookReviewsRequest(bookId).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        formatBookReviews(bookId, data);
      });
    } else {
      response.json().then((data) => {
        if (data?.error?.message) {
          showSimpleAlert(data?.error?.message, 2);
        } else {
          showSimpleAlert("Error while fetching book reviews", 2);
        }
      });
    }
  });
}

function formatBookReviews(bookId, reviews) {
  const reviewsContainer = document.querySelector(`.book-reviews-container[data-book-id="${bookId}"]`);
  reviewsContainer.innerHTML = "";

  const reviewGeneralInfo = document.createElement("span");
  reviewGeneralInfo.classList.add("book-review-general-info");

  const meanRating = document.createElement("span");
  meanRating.classList.add("book-review-rating");
  const meanRatingValue = document.createElement("span");
  meanRatingValue.classList.add("book-review-rating");
  meanRatingValue.textContent = "Mean rating: ";
  const meanRatingValueValue = document.createElement("span");
  meanRatingValueValue.classList.add("book-review-rating-value");
  meanRatingValueValue.textContent = "-";
  const reviewRatingMeanMaxValue = document.createElement("span");
  reviewRatingMeanMaxValue.textContent = `/5`;
  meanRating.appendChild(meanRatingValue);
  meanRating.appendChild(meanRatingValueValue);
  meanRating.appendChild(reviewRatingMeanMaxValue);
  reviewGeneralInfo.appendChild(meanRating);

  const reviewsCount = document.createElement("span");
  reviewsCount.classList.add("book-reviews-count");
  reviewsCount.textContent = `Reviews: ${reviews.length}`;

  const horizontalLine = document.createElement("hr");
  reviewGeneralInfo.appendChild(reviewsCount);
  reviewsContainer.appendChild(reviewGeneralInfo);
  reviewsContainer.appendChild(horizontalLine);

  if (reviews.length > 0) {
    const reviewsRatingSum = reviews.reduce((acc, review) => acc + parseInt(review.rating), 0);
    const meanRatingValueFloat = reviewsRatingSum / reviews.length;
    meanRatingValueValue.textContent = meanRatingValueFloat.toFixed(1);
  }

  reviews.forEach((review) => {
    const reviewElement = document.createElement("div");
    reviewElement.classList.add("book-review");
    const reviewHeader = document.createElement("div");
    reviewHeader.classList.add("book-review-header");

    const reviewAuthor = document.createElement("span");
    reviewAuthor.classList.add("book-review-author");
    reviewAuthor.textContent = review.author;

    const reviewRating = document.createElement("span");
    reviewRating.classList.add("book-review-rating");
    reviewRating.textContent = `Rating: `;
    const reviewRatingValue = document.createElement("span");
    reviewRatingValue.classList.add("book-review-rating-value");
    reviewRatingValue.innerHTML = `${review.rating}`;
    reviewRating.appendChild(reviewRatingValue);
    const reviewRatingMaxValue = document.createElement("span");
    reviewRatingMaxValue.textContent = `/5`;
    reviewRating.appendChild(reviewRatingMaxValue);

    const reviewDate = document.createElement("span");
    reviewDate.classList.add("book-review-date");
    reviewDate.textContent = formatDateToLocaleString(review.created_at);

    reviewHeader.appendChild(reviewAuthor);
    reviewHeader.appendChild(reviewRating);
    reviewHeader.appendChild(reviewDate);
    reviewElement.appendChild(reviewHeader);
    const reviewContent = document.createElement("div");
    reviewContent.classList.add("book-review-content");
    reviewContent.textContent = review.content;
    reviewElement.appendChild(reviewContent);
    reviewsContainer.appendChild(reviewElement);

    const reviewSeparator = document.createElement("hr");
    reviewSeparator.classList.add("book-review-separator");
    reviewsContainer.appendChild(reviewSeparator);
  });
}

function formatReviewsMarkedAsRaw() {
  const bookIds = getReviewsMarkedAsRaw();

  issueGetReviewsStatsRequest(bookIds).then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        formatReviewsGeneralStats(bookIds, data);
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

function getOrderStatusesMarkedAsRaw() {
  const orderStatuses = document.querySelectorAll(".order-status");
  const statusIds = [];
  orderStatuses.forEach((orderStatus) => {
    if (orderStatus.getAttribute("raw") === "true") {
      statusIds.push(orderStatus.getAttribute("statusId"));
      orderStatus.removeAttribute("raw");
    }
  });
  return statusIds;
}

function formatOrderStatus(orderStatusesData) {
  const statusIds = getOrderStatusesMarkedAsRaw();
  statusIds.forEach((statusId) => {
    const foundStatus = orderStatusesData.find((status) => `${status.id}` === `${statusId}`);
    const orderStatuses = document.querySelectorAll(`.order-status[statusId="${statusId}"]`);
    orderStatuses.forEach((orderStatus) => {
      orderStatus.innerHTML = foundStatus.name;
      orderStatus.classList.add(`order-label-base`);
      orderStatus.classList.add(`label-${foundStatus.name}`);
      orderStatus.removeAttribute("raw");
    });
  });
}

function formatOrderBookTitleSimple(booksData) {
  const bookIds = getOrderBooksMarkedAsRaw();
  bookIds.forEach((bookId) => {
    const foundBook = booksData.find((book) => `${book.id}` === `${bookId}`);
    const bookTitles = document.querySelectorAll(`.order-book-title[bookId="${bookId}"]`);
    bookTitles.forEach((bookTitle) => {
      bookTitle.innerHTML = foundBook.title;
      bookTitle.removeAttribute("raw");
    });
  });
}

function formatOrderUserAccountNamesSimple(usersData) {
  const userIds = getOrderUsersMarkedAsRaw();
  userIds.forEach((userId) => {
    const foundUser = usersData[userId] || usersData[`"${userId}"`];
    const userNames = document.querySelectorAll(`.order-user-component[userId="${userId}"]`);
    userNames.forEach((userName) => {
      userName.innerHTML = foundUser.name;
      userName.removeAttribute("raw");
    });
  });
}

function getReviewsMarkedAsRaw() {
  const reviews = document.querySelectorAll(".book-review-mean-rating");

  const bookIds = [];
  reviews.forEach((review) => {
    if (review.getAttribute("raw") === "true") {
      bookIds.push(review.getAttribute("bookId"));
    }
  });
  const uniqueIds = [...new Set(bookIds)];
  return uniqueIds;
}

function formatReviewsGeneralStats(bookIds, reviewsData) {
  bookIds.forEach((bookId) => {
    const foundReviewSummary = reviewsData.find((review) => `${review.book_id}` === `${bookId}`);
    const reviewMeanRating = document.querySelectorAll(`.book-review-mean-rating[bookId="${bookId}"]`);
    reviewMeanRating.forEach((meanRating) => {
      if (foundReviewSummary.numberOfReviews > 0) {
        meanRating.innerHTML = foundReviewSummary.mean;
      } else {
        meanRating.innerHTML = "-";
      }
      meanRating.removeAttribute("raw");
    });

    const reviewsCount = document.querySelectorAll(`.book-reviews-count[bookId="${bookId}"]`);
    reviewsCount.forEach((count) => {
      count.innerHTML = `Reviews: ${foundReviewSummary.numberOfReviews}`;
      count.removeAttribute("raw");
    });
  });
}

function getPricesMarkedAsRaw() {
  const prices = document.querySelectorAll(".cart-price");
  const bookIds = [];
  prices.forEach((price) => {
    if (price.getAttribute("raw") === "true") {
      bookIds.push(price.getAttribute("bookId"));
    }
  });
  const uniqueIds = [...new Set(bookIds)];
  return uniqueIds;
}

function getInStockMarkedAsRaw() {
  const instock = document.querySelectorAll(".in-stock");
  const bookIds = [];
  instock.forEach((item) => {
    if (item.getAttribute("raw") === "true") {
      bookIds.push(item.getAttribute("bookId"));
    }
  });
  const uniqueIds = [...new Set(bookIds)];
  return uniqueIds;
}

function getAuthorsMarkedAsRaw() {
  const authors = document.querySelectorAll(".author-component");
  const authorsIds = [];
  authors.forEach((author) => {
    if (author.getAttribute("raw") === "true") {
      authorsIds.push(author.getAttribute("author"));
    }
  });

  const uniqueIds = [...new Set(authorsIds)];
  return uniqueIds;
}

function getGenresMarkedAsRaw() {
  const genres = document.querySelectorAll(".genre-component");
  const genresIds = [];
  genres.forEach((genre) => {
    if (genre.getAttribute("raw") === "true") {
      genresIds.push(genre.getAttribute("genre"));
    }
  });

  const uniqueIds = [...new Set(genresIds)];
  return uniqueIds;
}

function getBooksMarkedAsRaw() {
  const books = document.querySelectorAll(".book-title");
  const bookIds = [];
  books.forEach((book) => {
    if (book.getAttribute("raw") === "true") {
      bookIds.push(book.getAttribute("bookId"));
    }
  });

  const uniqueIds = [...new Set(bookIds)];
  return uniqueIds;
}

function getOrderBooksMarkedAsRaw() {
  const books = document.querySelectorAll(".order-book-title");
  const bookIds = [];
  books.forEach((book) => {
    if (book.getAttribute("raw") === "true") {
      bookIds.push(book.getAttribute("bookId"));
    }
  });

  const uniqueIds = [...new Set(bookIds)];
  return uniqueIds;
}

function getOrderUsersMarkedAsRaw() {
  const users = document.querySelectorAll(".order-user-component");
  const userIds = [];
  users.forEach((user) => {
    if (user.getAttribute("raw") === "true") {
      userIds.push(user.getAttribute("userId"));
    }
  });

  const uniqueIds = [...new Set(userIds)];
  return uniqueIds;
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

    let bookCover = book.cover;
    if (bookCover === null) {
      bookCover = "..\\data\\books\\no-cover.jpg";
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
                                      <img src="${bookCover}" alt="${
      book.title
    }" style="max-width: 100px; max-height: 100px;" class="book-clickable-component" onclick="showBookDetails(${
      book.id
    })" >
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
   <li>Card number must be 20 only-numbers long.</li>
   <li>Expiration date must be in format YYYY-MM-DD.</li>
   <li>CVV must be 5 only-numbers long.</li>
   <li>All fields are required.</li></ul>
   New card will overwrite your old card.<br>
   <strong>Remember values provided!</strong><br>
   You will need them for account top up.<br><br>
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
  cardNumberInput.addEventListener("input", () => {
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
  expirationDateInput.addEventListener("input", () => {
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
  cvvInput.addEventListener("input", () => {
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
    const cardNumber = document.getElementById("card-number-input").value;
    const expirationDate = document.getElementById("expiration-date-input").value;
    const cvv = document.getElementById("cvv-input").value;

    if (!isCardValid(cardNumber, expirationDate, cvv)) {
      showSimpleAlert("Please provide correct card details!", 2);
      return;
    }

    issueUpdateAccountPaymentCardRequest(cardNumber, cvv, expirationDate).then((response) => {
      if (response.status === 200 || response.status === 201) {
        showSimpleAlert("Card updated successfully!");
        if (callbackOnSave !== undefined) {
          callbackOnSave();
        }
        document.getElementById("book-details-placeholder").innerHTML = "";
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while updating card. ${data.error?.message}`, 2);
        });
      }
    });
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";

  cancelButton.className = "book-shop-button-primary";

  cancelButton.addEventListener("click", () => {
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  const currentCardDescription = document.createElement("div");
  currentCardDescription.innerHTML = "Current card:";
  currentCardDescription.className = "account-edit-label";
  const currentCardValue = document.createElement("div");
  currentCardValue.id = "current-card-value";
  currentCardValue.innerHTML = "Checking please wait...";
  currentCardValue.className = "account-edit-label";

  const currentCardBalanceDescription = document.createElement("div");
  currentCardBalanceDescription.innerHTML = "Current card balance:";
  currentCardBalanceDescription.className = "account-edit-label";
  const currentCardBalanceValue = document.createElement("div");
  currentCardBalanceValue.id = "current-card-balance-value";
  currentCardBalanceValue.innerHTML = "Checking please wait...";
  currentCardBalanceValue.className = "account-edit-label";
  currentCardBalanceValue.classList.add("bold");

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(currentCardDescription);
  rightColumn.appendChild(currentCardValue);
  leftColumn.appendChild(currentCardBalanceDescription);
  rightColumn.appendChild(currentCardBalanceValue);

  const newCardDescription = document.createElement("div");
  newCardDescription.innerHTML = "New card:";
  newCardDescription.className = "account-edit-label";

  const newCardDescriptionPlaceholder = document.createElement("div");
  newCardDescriptionPlaceholder.innerHTML = "&nbsp;";
  newCardDescriptionPlaceholder.className = "account-edit-label";

  leftColumn.appendChild(newCardDescription);
  leftColumn.appendChild(cardNumberLabel);
  leftColumn.appendChild(expirationDateLabel);
  leftColumn.appendChild(cvvLabel);

  rightColumn.appendChild(newCardDescriptionPlaceholder);
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

  issueGetAccountPaymentCardsRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        const currentCardValue = document.getElementById("current-card-value");
        const formattedCardNumber = data.card_number.replace(/([\s\S]{4})/g, "$1 ");
        currentCardValue.innerHTML = `${formattedCardNumber}`;

        const currentCardBalanceValue = document.getElementById("current-card-balance-value");
        currentCardBalanceValue.innerHTML = `${formatPrice(data.balance)}`;
      });
    } else {
      const currentCardValue = document.getElementById("current-card-value");
      currentCardValue.innerHTML = `No card found`;

      const currentCardBalanceValue = document.getElementById("current-card-balance-value");
      currentCardBalanceValue.innerHTML = `No card found`;
    }
  });

  return popup;
}

function createAccountFundsTopupPopup(userData, callbackOnSave = undefined) {
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
  description.innerHTML = `Top up your account balance.<br>Please provide amount you want to top up.<br>
   <ul>
   <li>Amount must be a positive number.</li>
   <li>Amount must be at least 1 PLN.</li>
   <li>Amount must be at most 1000 PLN.</li>
   <li>Amount must be a number.</li>
   <li>Amount and CVV fields are required.</li>
   </ul>
   For security reasons, you will need to provide your CVV.<br>
   `;

  const cvvLabel = document.createElement("label");
  cvvLabel.textContent = "CVV";
  cvvLabel.className = "account-edit-label";

  const cvvInput = document.createElement("input");
  cvvInput.type = "password";
  cvvInput.placeholder = "CVV";
  cvvInput.maxLength = 5;
  cvvInput.className = "account-edit-input";
  cvvInput.classList.add("wide");
  cvvInput.id = "cvv-input";
  cvvInput.value = "";
  cvvInput.addEventListener("input", () => {
    const amountInput = document.getElementById("amount-input");
    const cvvInput = document.getElementById("cvv-input");
    checkTopupValidity(amountInput.value, cvvInput.value);
  });

  const amountLabel = document.createElement("label");
  amountLabel.textContent = "Amount";
  amountLabel.className = "account-edit-label";

  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.placeholder = "Amount";
  amountInput.value = parseFloat(1).toFixed(2);
  amountInput.maxLength = 5;
  amountInput.className = "account-edit-input";
  amountInput.id = "amount-input";
  amountInput.classList.add("wide");
  amountInput.addEventListener("blur", () => {
    const amountInput = document.getElementById("amount-input");
    const cvvInput = document.getElementById("cvv-input");
    checkTopupValidity(amountInput.value, cvvInput.value);
    amountInput.value = parseFloat(amountInput.value).toFixed(2);
  });

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.id = "execute-topup-button";

  saveButton.addEventListener("click", () => {
    const amount = document.getElementById("amount-input").value;
    const cvv = document.getElementById("cvv-input").value;

    if (!isAmountValid(amount)) {
      showSimpleAlert("Please provide correct amount!", 2);
      return;
    }

    if (!isCvvValid(cvv)) {
      showSimpleAlert("Please provide correct CVV!", 2);
      return;
    }

    const amountValue = parseFloat(amount);
    const amountValueUnits = Math.round(amountValue * 100);

    issueUpdateAccountBalanceRequest(amountValueUnits, cvv).then((response) => {
      if (response.status === 200) {
        showSimpleAlert("Account balance updated successfully! This can take a while to reflect in your account.");
        if (callbackOnSave !== undefined) {
          callbackOnSave();
        }
        document.getElementById("book-details-placeholder").innerHTML = "";
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while updating balance. ${data.error?.message}`, 2);
        });
      }
    });
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";

  cancelButton.className = "book-shop-button-primary";

  cancelButton.addEventListener("click", () => {
    document.getElementById("book-details-placeholder").innerHTML = "";
  });

  const currentCardBalanceDescription = document.createElement("div");
  currentCardBalanceDescription.innerHTML = "Current card balance:";
  currentCardBalanceDescription.className = "account-edit-label";
  const currentCardBalanceValue = document.createElement("div");
  currentCardBalanceValue.id = "current-card-balance-value";
  currentCardBalanceValue.innerHTML = "Checking please wait...";
  currentCardBalanceValue.className = "account-edit-label";
  currentCardBalanceValue.classList.add("bold");

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(currentCardBalanceDescription);
  leftColumn.appendChild(amountLabel);
  leftColumn.appendChild(cvvLabel);

  rightColumn.appendChild(currentCardBalanceValue);
  rightColumn.appendChild(amountInput);
  rightColumn.appendChild(cvvInput);

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

  disableTopupFundsButton();

  issueGetAccountPaymentCardsRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((data) => {
        const currentCardBalanceValue = document.getElementById("current-card-balance-value");
        currentCardBalanceValue.innerHTML = `${formatPrice(data.balance)}`;
      });
    } else {
      const currentCardBalanceValue = document.getElementById("current-card-balance-value");
      currentCardBalanceValue.innerHTML = `No card found`;
    }
  });

  return popup;
}

function checkTopupValidity(amount, cvv) {
  if (isAmountValid(amount) && isCvvValid(cvv)) {
    enableTopupFundsButton();
  } else {
    disableTopupFundsButton();
  }
}

function isCvvValid(cvv) {
  const actualCvv = cvv.replace(/[^0-9]/g, "");

  if (actualCvv.length === 5) {
    return true;
  }

  return false;
}

function isAmountValid(amount) {
  const actualAmount = amount.replace(/[^0-9.,]/g, "");
  const amountValue = parseFloat(actualAmount);

  if (isNaN(amountValue)) {
    return false;
  }

  if (amountValue < 1 || amountValue > 1000) {
    return false;
  }

  return true;
}

function isCardValid(cardNumber, expirationDate, cvv) {
  const actualCardNumber = cardNumber.replace(/[^0-9]/g, "");
  const actualExpirationDate = expirationDate.replace(/[^0-9-]/g, "");
  const dateParts = actualExpirationDate.split("-");

  if (dateParts.length !== 3) {
    return false;
  }

  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const day = parseInt(dateParts[2]);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  const currentDate = new Date();
  const expirationDateValue = new Date(year, month - 1, day);

  if (expirationDateValue < currentDate) {
    return false;
  }

  const actualCvv = cvv.replace(/[^0-9]/g, "");

  if (actualCardNumber.length === 20 && actualExpirationDate.length === 10 && actualCvv.length === 5) {
    return true;
  }

  return false;
}

function checkCardValidity(cardNumber, expirationDate, cvv) {
  if (isCardValid(cardNumber, expirationDate, cvv)) {
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

function disableTopupFundsButton() {
  const createCardButton = document.getElementById("execute-topup-button");
  createCardButton.disabled = true;
  createCardButton.classList.add("disabled");
}

function enableTopupFundsButton() {
  const createCardButton = document.getElementById("execute-topup-button");
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
  countryInput.value = userData.country ?? "";
  countryInput.className = "account-edit-input";
  countryInput.maxLength = 256;

  const cityLabel = document.createElement("label");
  cityLabel.textContent = "City";
  cityLabel.className = "account-edit-label";

  const cityInput = document.createElement("input");
  cityInput.type = "text";
  cityInput.placeholder = "City";
  cityInput.value = userData.city ?? "";
  cityInput.className = "account-edit-input";
  cityInput.maxLength = 256;

  const streetLabel = document.createElement("label");
  streetLabel.textContent = "Street";
  streetLabel.className = "account-edit-label";

  const streetInput = document.createElement("input");
  streetInput.type = "text";
  streetInput.placeholder = "Street";
  streetInput.value = userData.street ?? "";
  streetInput.className = "account-edit-input";
  streetInput.maxLength = 256;

  const postalCodeLabel = document.createElement("label");
  postalCodeLabel.textContent = "Postal Code";
  postalCodeLabel.className = "account-edit-label";

  const postalCodeInput = document.createElement("input");
  postalCodeInput.type = "text";
  postalCodeInput.placeholder = "Postal Code";
  postalCodeInput.value = userData.postal_code ?? "";
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
        }, 500);
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

const itemData = [
  {
    id: 2,
    book_id: 2,
    price: 3000,
    quantity: 10,
  },
];

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

  let bookCover = book.cover;
  if (bookCover === null) {
    bookCover = "..\\data\\books\\no-cover.jpg";
  }

  popup.innerHTML = `
      <div class="book-popup-content-limited">
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
                                              <img src="${bookCover}" alt="${
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
                  <div class="book-reviews-container" data-book-id="${book.id}">
                      
                  </div>
              </div>
          </div>
          </div>
      </div>
      `;

  if (additionalToolsHTML === true) {
    popup.querySelector(".book-tools").appendChild(createBookToolsPanel(book.id));
  }

  window.onclick = function (event) {
    if (event.target === popup) {
      popup.style.display = "none";
    }
  };

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
