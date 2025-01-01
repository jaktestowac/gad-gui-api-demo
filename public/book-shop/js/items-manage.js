const urlBookShopManageItemsUrl = "/api/book-shop-manage/items";
const urlBooksWithoutItemsUrl = "/api/book-shop-manage/books-without-items";

async function issueDeleteItemRequest(itemId) {
  let urlBook = `${urlBookShopManageItemsUrl}/${itemId}`;
  const data = fetch(urlBook, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

async function issueGetBookShopBooksWithoutItemsRequest() {
  let urlItems = `${urlBooksWithoutItemsUrl}`;
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

async function issueUpdateItemRequest(id, priceValue, quantityValue) {
  const body = {
    price: formatPriceForBackEnd(priceValue),
    quantity: quantityValue,
  };

  const url = `${urlBookShopManageItemsUrl}/${id}`;
  const data = fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(body),
  });
  return data;
}

async function issueAddItemRequest(id, priceValue, quantityValue) {
  const body = {
    book_id: id,
    price: formatPriceForBackEnd(priceValue),
    quantity: quantityValue,
  };

  const url = `${urlBookShopManageItemsUrl}`;
  const data = fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(body),
  });
  return data;
}

async function issueGetItemByBookIdRequest(bookId) {
  let urlItems = `${urlBookShopManageItemsUrl}?book_id=${bookId}`;
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

async function issueGetAllItemsRequest() {
  let urlItems = `${urlBookShopManageItemsUrl}`;
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

async function updateItemData(itemData) {
  const url = `${urlBookShopManageItemsUrl}`;
  const data = fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
    body: JSON.stringify(itemData),
  });
  return data;
}

function populateSelect(bookSelect, getBookCallback) {
  // add first option
  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.innerHTML = "-- Select book --";
  bookSelect.appendChild(firstOption);

  getBookCallback().then((response) => {
    if (response.status === 200) {
      response.json().then((books) => {
        books.forEach((book) => {
          const bookOption = document.createElement("option");
          bookOption.value = book.id;
          bookOption.innerHTML = `${book.title}`;
          bookSelect.appendChild(bookOption);
        });
      });
    } else {
      response.json().then((data) => {
        showSimpleAlert(`Error while getting books data. ${data.error?.message}`, 2);
      });
    }
  });
}

function createAddItemPopup() {
  const placeholder = document.getElementById("item-details-placeholder");
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
    document.getElementById("item-details-placeholder").innerHTML = "";
  });

  bookPopupControls.appendChild(closeButton);

  const form = document.createElement("div");
  form.className = "account-edit-form";

  const titleElement = document.createElement("div");
  titleElement.classList.add("item-add-edit-title");
  titleElement.textContent = "Add Item";

  form.appendChild(titleElement);

  const bookNameLabel = document.createElement("label");
  bookNameLabel.textContent = "Book";
  bookNameLabel.className = "account-edit-label";

  const bookSelect = document.createElement("select");
  bookSelect.classList.add("add-item-book-select");

  populateSelect(bookSelect, issueGetBookShopBooksWithoutItemsRequest);

  // add checkbox to get all books
  const getAllBooksLabel = document.createElement("label");
  getAllBooksLabel.textContent = "Get all books";
  getAllBooksLabel.className = "account-edit-label";

  const getAllBooksCheckbox = document.createElement("input");
  getAllBooksCheckbox.type = "checkbox";
  getAllBooksCheckbox.className = "add-item-get-all-books-checkbox";

  getAllBooksCheckbox.addEventListener("change", () => {
    if (getAllBooksCheckbox.checked) {
      bookSelect.innerHTML = "";
      populateSelect(bookSelect, issueGetAllBooksRequest);
    } else {
      bookSelect.innerHTML = "";
      populateSelect(bookSelect, issueGetBookShopBooksWithoutItemsRequest);
    }

    const bookImgElement = document.querySelector(".item-book-img-new");
    bookImgElement.src = "";

    const bookIdValueElement = document.querySelector(`.item-book-id-value-new`);
    bookIdValueElement.innerHTML = "-";
  });

  bookSelect.addEventListener("change", () => {
    const bookId = bookSelect.value;
    if (bookId === "") {
      const priceInput = document.querySelector(".account-edit-input-price");
      priceInput.value = "";

      const quantityInput = document.querySelector(".account-edit-input-quantity");
      quantityInput.value = "";

      const bookImgElement = document.querySelector(".item-book-img-new");
      bookImgElement.src = "";

      const bookIdValueElement = document.querySelector(`.item-book-id-value-new`);
      bookIdValueElement.innerHTML = ``;
      return;
    }

    issueGetBookRequest([bookId]).then((response) => {
      if (response.status === 200) {
        response.json().then((book) => {
          const bookIdValueElement = document.querySelector(`.item-book-id-value-new`);
          bookIdValueElement.innerHTML = `${bookId}`;

          let bookCover = book.cover;
          if (bookCover === null) {
            bookCover = "..\\data\\books\\no-cover.jpg";
          }

          // set image
          const bookImgElement = document.querySelector(".item-book-img-new");
          bookImgElement.src = bookCover;
        });
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while getting book data. ${data.error?.message}`, 2);
        });
      }
    });

    issueGetItemByBookIdRequest(bookId).then((response) => {
      if (response.status === 200) {
        showSimpleAlert("Item already exists", 1);
        const warningElement = document.querySelector(".book-shop-warning-message-value");
        if (warningElement) {
          warningElement.innerHTML = "Item already exists. You can update it.";
        }

        const header = document.querySelector(".item-add-edit-title");
        if (header) {
          header.textContent = "Update Item";
        }

        response.json().then((itemData) => {
          const priceInput = document.querySelector(".account-edit-input-price");
          priceInput.value = formatPriceToDecimalString(itemData.price);

          const quantityInput = document.querySelector(".account-edit-input-quantity");
          quantityInput.value = itemData.quantity;
        });
        return;
      } else if (response.status === 404) {
        const warningElement = document.querySelector(".book-shop-warning-message-value");
        if (warningElement) {
          warningElement.innerHTML = "";
        }

        const header = document.querySelector(".item-add-edit-title");
        if (header) {
          header.textContent = "Add Item";
        }
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while getting item data. ${data.error?.message}`, 2);
        });
      }
    });
  });

  // create img label and img placeholder
  const bookImgLabel = document.createElement("label");
  bookImgLabel.classList.add("account-edit-label");
  bookImgLabel.innerHTML = `Book Image`;

  const bookImgElement = document.createElement("img");
  bookImgElement.classList.add("item-book-img-new");
  bookImgElement.classList.add("item-book-img");
  bookImgElement.src = "";

  const bookIdElement = document.createElement("label");
  bookIdElement.classList.add("account-edit-label");
  bookIdElement.innerHTML = `Book ID:`;

  const bookIdValueElement = document.createElement("label");
  bookIdValueElement.classList.add("account-edit-label");
  bookIdValueElement.classList.add(`item-book-id-value-new`);
  bookIdValueElement.innerHTML = `-`;

  const priceLabel = document.createElement("label");
  priceLabel.textContent = "Price";
  priceLabel.className = "account-edit-label";

  const priceInput = document.createElement("input");
  priceInput.type = "text";
  priceInput.placeholder = "Price";
  priceInput.className = "account-edit-input";
  priceInput.classList.add(`account-edit-input-price`);
  priceInput.maxLength = 8;

  priceInput.addEventListener("blur", () => {
    if (priceInput.value.length > 0) {
      priceInput.value = formatPriceInInput(priceInput.value);
    }
  });

  const quantityLabel = document.createElement("label");
  quantityLabel.textContent = "Quantity";
  quantityLabel.className = "account-edit-label";

  const quantityInput = document.createElement("input");
  quantityInput.type = "text";
  quantityInput.placeholder = "Quantity";
  quantityInput.className = "account-edit-input";
  quantityInput.classList.add(`account-edit-input-quantity`);
  quantityInput.maxLength = 5;

  quantityInput.addEventListener("blur", () => {
    if (quantityInput.value.length > 0) {
      quantityInput.value = formatQuantityInInput(quantityInput.value);
    }
  });

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.addEventListener("click", () => {
    if (bookSelect.value.length === 0) {
      showSimpleAlert("Book ID cannot be empty", 2);
      return;
    }

    if (priceInput.value.length === 0) {
      showSimpleAlert("Price cannot be empty", 2);
      return;
    }

    if (quantityInput.value.length === 0) {
      showSimpleAlert("Quantity cannot be empty", 2);
      return;
    }

    // validate price and quantity format
    if (!validatePrice(priceInput.value)) {
      showSimpleAlert("Price format is invalid", 2);
      return;
    }

    if (!validateQuantity(quantityInput.value)) {
      showSimpleAlert("Quantity format is invalid", 2);
      return;
    }

    const bookId = bookSelect.value;

    issueGetItemByBookIdRequest(bookId).then((response) => {
      if (response.status === 200) {
        // update item
        updateItem(bookSelect.value, priceInput.value, quantityInput.value, saveButton, refreshItemDetails);
      } else if (response.status === 404) {
        // add item
        issueAddItemRequest(bookSelect.value, priceInput.value, quantityInput.value).then((response) => {
          if (response.status === 201) {
            showSimpleAlert("Item added successfully");
            saveButton.disabled = true;
            setTimeout(() => {
              document.getElementById("item-details-placeholder").innerHTML = "";
              refreshAllItems();
            }, 500);
          } else {
            saveButton.disabled = false;
            showSimpleAlert("Item add failed", 2);
          }
        });
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while getting item data. ${data.error?.message}`, 2);
        });
      }
    });
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.className = "book-shop-button-primary";
  cancelButton.addEventListener("click", () => {
    document.getElementById("item-details-placeholder").innerHTML = "";
  });

  const bookDetailsTable = document.createElement("table");
  bookDetailsTable.classList.add("book-table-details");

  const bookDetailsTableRow1 = document.createElement("tr");
  const bookDetailsTableRow2 = document.createElement("tr");
  const bookDetailsTableRow3 = document.createElement("tr");
  const bookDetailsTableRow4 = document.createElement("tr");
  const bookDetailsTableRow5 = document.createElement("tr");
  const bookDetailsTableRow6 = document.createElement("tr");

  const bookDetailsTableData1 = document.createElement("td");
  bookDetailsTableData1.style.width = "33%";
  const bookDetailsTableData2 = document.createElement("td");

  const bookDetailsTableData3 = document.createElement("td");
  const bookDetailsTableData4 = document.createElement("td");

  const bookDetailsTableData5 = document.createElement("td");
  const bookDetailsTableData6 = document.createElement("td");

  const bookDetailsTableData7 = document.createElement("td");
  const bookDetailsTableData8 = document.createElement("td");

  const bookDetailsTableData9 = document.createElement("td");
  const bookDetailsTableData10 = document.createElement("td");

  const bookDetailsTableData11 = document.createElement("td");
  const bookDetailsTableData12 = document.createElement("td");

  bookDetailsTableData1.appendChild(bookNameLabel);
  bookDetailsTableData2.appendChild(bookSelect);

  bookDetailsTableData3.appendChild(bookIdElement);
  bookDetailsTableData4.appendChild(bookIdValueElement);

  bookDetailsTableData5.appendChild(bookImgLabel);
  bookDetailsTableData6.appendChild(bookImgElement);

  bookDetailsTableData7.appendChild(priceLabel);
  bookDetailsTableData8.appendChild(priceInput);

  bookDetailsTableData9.appendChild(quantityLabel);
  bookDetailsTableData10.appendChild(quantityInput);

  bookDetailsTableData11.appendChild(getAllBooksLabel);
  bookDetailsTableData12.appendChild(getAllBooksCheckbox);

  bookDetailsTableRow1.appendChild(bookDetailsTableData1);
  bookDetailsTableRow1.appendChild(bookDetailsTableData2);

  bookDetailsTableRow2.appendChild(bookDetailsTableData3);
  bookDetailsTableRow2.appendChild(bookDetailsTableData4);

  bookDetailsTableRow3.appendChild(bookDetailsTableData5);
  bookDetailsTableRow3.appendChild(bookDetailsTableData6);

  bookDetailsTableRow4.appendChild(bookDetailsTableData7);
  bookDetailsTableRow4.appendChild(bookDetailsTableData8);

  bookDetailsTableRow5.appendChild(bookDetailsTableData9);
  bookDetailsTableRow5.appendChild(bookDetailsTableData10);

  bookDetailsTableRow6.appendChild(bookDetailsTableData11);
  bookDetailsTableRow6.appendChild(bookDetailsTableData12);

  bookDetailsTable.appendChild(bookDetailsTableRow1);
  bookDetailsTable.appendChild(bookDetailsTableRow6);
  bookDetailsTable.appendChild(bookDetailsTableRow2);
  bookDetailsTable.appendChild(bookDetailsTableRow3);
  bookDetailsTable.appendChild(bookDetailsTableRow4);
  bookDetailsTable.appendChild(bookDetailsTableRow5);

  form.appendChild(bookDetailsTable);

  // create container for save and cancel button
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "account-edit-buttons";

  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(cancelButton);

  form.appendChild(buttonsContainer);

  const warningMessageContainer = document.createElement("div");
  warningMessageContainer.className = "warning-message-container";
  warningMessageContainer.classList.add("book-shop-warning-message");

  const warningMessage = document.createElement("span");
  warningMessage.classList.add("warning-message");
  warningMessage.classList.add("book-shop-warning-message-value");
  warningMessage.innerHTML = "";

  warningMessageContainer.appendChild(warningMessage);

  form.appendChild(warningMessageContainer);

  popupBody.appendChild(bookPopupControls);

  popupBody.appendChild(form);
  popupContent.appendChild(popupBody);
  popup.appendChild(popupContent);
  placeholder.appendChild(popup);
}

function refreshItemDetails(itemId) {
  issueGetItemRequest(itemId).then((response) => {
    const itemElement = document.querySelector(`[elementItemId="${itemId}"]`);
    if (response.status === 200) {
      response.json().then((itemData) => {
        prepareItemElement(itemData, itemElement);
        refreshItemsDetails();
      });
    } else {
      response.json().then((data) => {
        showSimpleAlert(`Error while getting item data. ${data.error?.message}`, 2);
      });
    }
  });
}

function updateItem(id, priceValue, quantityValue, saveButton, callbackOnSave) {
  issueUpdateItemRequest(id, priceValue, quantityValue).then((response) => {
    if (response.status === 200) {
      showSimpleAlert("Item updated successfully");
      saveButton.disabled = true;

      if (callbackOnSave !== undefined) {
        response.json().then((data) => {
          callbackOnSave(data.id);
        });
      }

      setTimeout(() => {
        document.getElementById("item-details-placeholder").innerHTML = "";
      }, 500);
    } else {
      saveButton.disabled = false;
      showSimpleAlert("Item update failed", 2);
    }
  });
}

function createItemEditPopup(itemData, callbackOnSave = undefined) {
  const placeholder = document.getElementById("item-details-placeholder");
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
    document.getElementById("item-details-placeholder").innerHTML = "";
  });

  bookPopupControls.appendChild(closeButton);

  const form = document.createElement("div");
  form.className = "account-edit-form";

  const titleElement = document.createElement("div");
  titleElement.textContent = itemData.title;
  titleElement.className = "item-edit-title";

  form.appendChild(titleElement);

  const priceLabel = document.createElement("label");
  priceLabel.textContent = "Price";
  priceLabel.className = "account-edit-label";

  const priceInput = document.createElement("input");
  priceInput.type = "text";
  priceInput.placeholder = "Price";
  priceInput.value = formatPriceToDecimalString(itemData.price);
  priceInput.className = "account-edit-input";
  priceInput.maxLength = 8;

  priceInput.addEventListener("blur", () => {
    if (priceInput.value.length > 0) {
      priceInput.value = formatPriceInInput(priceInput.value);
    }
  });

  const quantityLabel = document.createElement("label");
  quantityLabel.textContent = "Quantity";
  quantityLabel.className = "account-edit-label";

  const quantityInput = document.createElement("input");
  quantityInput.type = "text";
  quantityInput.placeholder = "Quantity";
  quantityInput.value = itemData.quantity;
  quantityInput.className = "account-edit-input";
  quantityInput.maxLength = 5;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.className = "book-shop-button-primary";
  saveButton.addEventListener("click", () => {
    if (priceInput.value.length === 0) {
      showSimpleAlert("Price cannot be empty", 2);
      return;
    }

    if (quantityInput.value.length === 0) {
      showSimpleAlert("Quantity cannot be empty", 2);
      return;
    }

    // validate price and quantity format
    if (!validatePrice(priceInput.value)) {
      showSimpleAlert("Price format is invalid", 2);
      return;
    }

    if (!validateQuantity(quantityInput.value)) {
      showSimpleAlert("Quantity format is invalid", 2);
      return;
    }

    updateItem(itemData.id, priceInput.value, quantityInput.value, saveButton, callbackOnSave);
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.className = "book-shop-button-primary";
  cancelButton.addEventListener("click", () => {
    document.getElementById("item-details-placeholder").innerHTML = "";
  });

  const leftColumn = document.createElement("div");
  leftColumn.className = "account-edit-column";
  leftColumn.classList.add("left");

  const rightColumn = document.createElement("div");
  rightColumn.className = "account-edit-column";
  rightColumn.classList.add("right");

  leftColumn.appendChild(priceLabel);
  leftColumn.appendChild(quantityLabel);

  rightColumn.appendChild(priceInput);
  rightColumn.appendChild(quantityInput);

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

function prepareItemElement(item, el = undefined) {
  let itemElement = el;

  if (!itemElement) {
    itemElement = document.createElement("div");
    itemElement.classList.add("item-element");
    itemElement.setAttribute("elementItemId", item.id);
  } else {
    itemElement.innerHTML = "";
  }

  const tableRow = document.createElement("tr");
  const tableData = document.createElement("td");
  const tableData2 = document.createElement("td");

  const itemElementBaseInfo = document.createElement("div");
  itemElementBaseInfo.classList.add("item-element-base-info");

  const itemElementIdsInfo = document.createElement("span");
  itemElementIdsInfo.classList.add("item-element-ids-info");
  itemElementIdsInfo.classList.add("column");

  const itemIdElementContainer = document.createElement("div");
  itemIdElementContainer.classList.add("item-id-container");
  const itemIdElement = document.createElement("span");
  itemIdElement.classList.add("item-id");
  itemIdElement.classList.add("item-label");
  itemIdElement.innerHTML = `Item ID:`;

  const itemIdValueElement = document.createElement("span");
  itemIdValueElement.classList.add("item-id-value");
  itemIdValueElement.innerHTML = `${item.id}`;

  itemIdElementContainer.appendChild(itemIdElement);
  itemIdElementContainer.appendChild(itemIdValueElement);

  const bookDetailsElement = document.createElement("span");
  bookDetailsElement.classList.add("item-book-details-container");

  const bookIdElementContainer = document.createElement("div");
  bookIdElementContainer.classList.add("item-book-id-container");
  const bookIdElement = document.createElement("span");
  bookIdElement.classList.add("item-book-id");
  bookIdElement.classList.add("item-label");
  bookIdElement.innerHTML = `Book ID:`;

  const bookIdValueElement = document.createElement("span");
  bookIdValueElement.classList.add("item-book-id-value");
  bookIdValueElement.setAttribute("bookId", item.book_id);
  bookIdValueElement.innerHTML = `${item.book_id}`;

  bookIdElementContainer.appendChild(bookIdElement);
  bookIdElementContainer.appendChild(bookIdValueElement);

  const bookInfoElementContainer = document.createElement("div");
  bookInfoElementContainer.classList.add("book-top-details");
  const bookInfoTableContainer = document.createElement("table");
  bookInfoTableContainer.classList.add("book-table-details");

  const bookNameElementContainer = document.createElement("div");
  //   bookIdElementContainer.classList.add("item-book-name-container");
  //   const bookNameElement = document.createElement("span");
  //   bookNameElement.classList.add("item-book-id");
  //   bookNameElement.classList.add("item-label");
  //   bookNameElement.innerHTML = `Book Name:`;

  const bookNameValueElement = document.createElement("div");
  bookNameValueElement.classList.add("item-book-title");
  bookNameValueElement.classList.add("book-title");
  bookNameValueElement.setAttribute("raw", "true");
  bookNameValueElement.setAttribute("bookId", item.book_id);
  bookNameValueElement.innerHTML = `${item.book_id}`;

  //   bookNameElementContainer.appendChild(bookNameElement);
  bookNameElementContainer.appendChild(bookNameValueElement);

  const bookImgElementContainer = document.createElement("img");
  bookImgElementContainer.classList.add("item-book-img");
  bookImgElementContainer.setAttribute("bookId", item.book_id);

  const editableValuesElement = document.createElement("div");

  const priceElementContainer = document.createElement("div");
  priceElementContainer.classList.add("column");
  const priceElement = document.createElement("span");
  priceElement.classList.add("item-price");
  priceElement.classList.add("item-label");
  priceElement.innerHTML = `Price:`;

  const priceValueElement = document.createElement("span");
  priceValueElement.classList.add("item-price-value");
  priceValueElement.innerHTML = `${formatPrice(item.price)}`;

  priceElementContainer.appendChild(priceElement);
  priceElementContainer.appendChild(priceValueElement);

  const quantityElementContainer = document.createElement("div");
  const quantityElement = document.createElement("span");
  quantityElement.classList.add("item-quantity");
  quantityElement.classList.add("item-label");
  quantityElement.innerHTML = `Quantity:`;

  const quantityValueElement = document.createElement("span");
  quantityValueElement.classList.add("item-quantity-value");
  quantityValueElement.innerHTML = `${item.quantity}`;
  quantityElementContainer.appendChild(quantityElement);
  quantityElementContainer.appendChild(quantityValueElement);

  const editElement = document.createElement("span");
  editElement.classList.add("edit-item-element");
  editElement.innerHTML = `<i class="fa-regular fa-edit"></i>`;
  editElement.classList.add("book-clickable-component");
  editElement.classList.add("clickable-btn");
  editElement.setAttribute("title", "Edit item");
  editElement.setAttribute("itemid", item.id);
  editElement.setAttribute("bookid", item.book_id);

  editElement.addEventListener("click", () => {
    const bookId = editElement.getAttribute("bookid");

    issueGetBookShopItemsRequest([bookId]).then((response) => {
      if (response.status === 200) {
        response.json().then((itemData) => {
          if (itemData.length === 0) {
            showSimpleAlert("Error while getting account data. No data found", 2);
            return;
          } else if (itemData.length > 1) {
            showSimpleAlert("Error while getting account data. Multiple data found", 2);
            return;
          }

          const bookNameValueElement = document.querySelector(`.item-book-title[bookId="${itemData[0].book_id}"]`);
          itemData[0].title = bookNameValueElement.innerHTML;

          createItemEditPopup(itemData[0], refreshItemDetails);
        });
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while getting account data. ${data.error?.message}`, 2);
        });
      }
    });
  });

  const deleteElement = document.createElement("span");
  deleteElement.classList.add("edit-item-element");
  deleteElement.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
  deleteElement.classList.add("book-clickable-component");
  deleteElement.classList.add("clickable-btn");
  deleteElement.setAttribute("title", "Delete item");
  deleteElement.setAttribute("itemid", item.id);
  deleteElement.setAttribute("bookid", item.book_id);

  deleteElement.addEventListener("click", () => {
    const itemId = deleteElement.getAttribute("itemid");

    issueDeleteItemRequest(itemId).then((response) => {
      if (response.status === 200) {
        showSimpleAlert("Item deleted successfully");
        setTimeout(() => {
          document.getElementById("item-details-placeholder").innerHTML = "";
          refreshAllItems();
        }, 500);
      } else {
        response.json().then((data) => {
          showSimpleAlert(`Error while deleting item. ${data.error?.message}`, 2);
        });
      }
    });
  });

  tableData.appendChild(bookImgElementContainer);
  tableData2.appendChild(bookNameElementContainer);

  tableRow.appendChild(tableData);
  tableRow.appendChild(tableData2);

  bookInfoTableContainer.appendChild(tableRow);

  bookInfoElementContainer.appendChild(bookInfoTableContainer);

  editableValuesElement.appendChild(priceElementContainer);
  editableValuesElement.appendChild(quantityElementContainer);

  itemElementIdsInfo.appendChild(itemIdElementContainer);
  itemElementIdsInfo.appendChild(bookIdElementContainer);

  itemElementBaseInfo.appendChild(bookInfoElementContainer);
  bookDetailsElement.appendChild(itemElementIdsInfo);
  bookDetailsElement.appendChild(editableValuesElement);

  tableData2.appendChild(bookDetailsElement);
  tableData2.appendChild(editElement);
  tableData2.appendChild(deleteElement);
  itemElement.appendChild(bookInfoTableContainer);

  return itemElement;
}

function refreshItemsDetails() {
  const bookIds = getBooksMarkedAsRaw();
  issueGetBooksRequest(bookIds).then((response) => {
    if (response.status === 200) {
      response.json().then((books) => {
        const bookNameElements = document.getElementsByClassName("item-book-title");
        for (let i = 0; i < bookNameElements.length; i++) {
          const bookId = bookNameElements[i].getAttribute("bookId");
          const bookNameElement = bookNameElements[i];
          const book = books.find((book) => book.id === parseInt(bookId));
          if (book) {
            bookNameElement.innerHTML = `${book.title}`;
          }
        }

        const bookImgElements = document.getElementsByClassName("item-book-img");
        for (let i = 0; i < bookImgElements.length; i++) {
          const bookId = bookImgElements[i].getAttribute("bookId");
          const bookImgElement = bookImgElements[i];
          const book = books.find((book) => `${book.id}` === `${bookId}`);
          if (book) {
            let bookCover = book.cover;
            if (bookCover === null) {
              bookCover = "..\\data\\books\\no-cover.jpg";
            }

            bookImgElement.src = bookCover;
          }
        }
      });
    } else {
      response.json().then((data) => {
        if (data.error?.message) {
          showSimpleAlert(`${data.error.message}`, 2);
        }
      });
    }
  });
}

function createSearchElement() {
  const searchElement = document.createElement("div");
  searchElement.classList.add("items-search-element");

  const searchInput = document.createElement("input");
  searchInput.classList.add("search-input");
  searchInput.setAttribute("type", "text");
  searchInput.setAttribute("placeholder", "Search by book title, price, quantity or book id");
  searchInput.addEventListener("input", () => {
    let itemsToDisplay = 0;
    const searchValue = searchInput.value.trim();
    const itemElements = document.getElementsByClassName("item-element");
    for (let i = 0; i < itemElements.length; i++) {
      const itemElement = itemElements[i];
      const bookTitleElement = itemElement.getElementsByClassName("item-book-title")[0];
      const bookId = bookTitleElement.getAttribute("bookId");
      const itemPriceElement = itemElement.getElementsByClassName("item-price-value")[0];
      const itemQuantityElement = itemElement.getElementsByClassName("item-quantity-value")[0];

      const bookTitle = bookTitleElement.innerHTML;
      const itemPrice = itemPriceElement.innerHTML;
      const itemQuantity = itemQuantityElement.innerHTML;

      if (
        bookTitle.toLowerCase().includes(searchValue.toLowerCase()) ||
        itemPrice.includes(searchValue) ||
        itemQuantity.includes(searchValue) ||
        bookId.includes(searchValue) ||
        searchValue === ""
      ) {
        itemElement.style.display = "block";
        itemsToDisplay += 1;
      } else {
        itemElement.style.display = "none";
      }
    }

    if (itemsToDisplay === 0) {
      const noOrderElements = document.querySelectorAll(".no-items-message");
      if (noOrderElements.length !== 0) {
        return;
      }

      const itemsMessageContainer = document.querySelector("#items-messages");
      const noItemsElement = document.createElement("div");
      noItemsElement.classList.add("no-items-message");
      noItemsElement.classList.add("book-shop-warning-message");
      noItemsElement.innerHTML = "No items to display";
      itemsMessageContainer.appendChild(noItemsElement);
    } else {
      const noItemsElements = document.querySelectorAll(".no-items-message");
      noItemsElements.forEach((element) => {
        element.remove();
      });
    }
  });

  searchElement.appendChild(searchInput);

  return searchElement;
}

function createItemActionsElement() {
  const itemActionsElement = document.createElement("div");
  itemActionsElement.classList.add("items-actions-element");

  const itemActionsLabel = document.createElement("span");
  itemActionsLabel.classList.add("item-actions-label");
  itemActionsLabel.innerHTML = "Actions:";

  const itemActionsContainer = document.createElement("span");
  itemActionsContainer.classList.add("item-actions-container");

  const addElement = document.createElement("span");
  addElement.classList.add("add-item-element");
  addElement.innerHTML = `<i class="fa-solid fa-file-circle-plus"></i>`;
  addElement.classList.add("book-clickable-component");
  addElement.classList.add("clickable-btn");
  addElement.setAttribute("title", "Add item");

  addElement.addEventListener("click", () => {
    createAddItemPopup();
  });

  itemActionsContainer.appendChild(addElement);

  itemActionsElement.appendChild(itemActionsLabel);
  itemActionsElement.appendChild(itemActionsContainer);

  return itemActionsElement;
}

function createCompactDisplayModeElement() {
  const displayModeElementContainer = document.createElement("div");
  displayModeElementContainer.classList.add("display-mode-element-container");

  const displayModeElement = document.createElement("span");
  displayModeElement.classList.add("display-mode-element");

  const displayModeLabel = document.createElement("span");
  displayModeLabel.classList.add("display-mode-label");
  displayModeLabel.innerHTML = "Display Mode:&nbsp;&nbsp;";

  const displayModeSelect = document.createElement("select");
  displayModeSelect.classList.add("display-items-mode-select");

  const displayModeSelectOption2 = document.createElement("option");
  displayModeSelectOption2.classList.add("display-mode-option");
  displayModeSelectOption2.setAttribute("value", "full");
  displayModeSelectOption2.innerHTML = "Full";

  const displayModeSelectOption1 = document.createElement("option");
  displayModeSelectOption1.classList.add("display-mode-option");
  displayModeSelectOption1.setAttribute("value", "compact");
  displayModeSelectOption1.innerHTML = "Compact";

  displayModeSelect.appendChild(displayModeSelectOption2);
  displayModeSelect.appendChild(displayModeSelectOption1);

  displayModeElement.appendChild(displayModeLabel);
  displayModeElement.appendChild(displayModeSelect);

  displayModeElementContainer.appendChild(displayModeElement);

  displayModeSelect.addEventListener("change", () => {
    const selectedValue = displayModeSelect.value;
    const itemElements = document.getElementsByClassName("item-element");
    for (let i = 0; i < itemElements.length; i++) {
      const itemElement = itemElements[i];
      if (selectedValue === "compact") {
        itemElement.classList.add("compact");
        const bookImgElement = itemElement.getElementsByClassName("item-book-img")[0];
        bookImgElement.style.display = "none";
      } else {
        itemElement.classList.remove("compact");
        const bookImgElement = itemElement.getElementsByClassName("item-book-img")[0];
        bookImgElement.style.display = "block";
      }
    }
  });

  return displayModeElementContainer;
}

function refreshAllItems() {
  issueGetAllItemsRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((items) => {
        const itemsContainer = document.getElementById("manage-items-container");
        itemsContainer.innerHTML = "";
        items.forEach((order) => {
          const itemElement = prepareItemElement(order);
          itemsContainer.appendChild(itemElement);
        });
        refreshItemsDetails();
      });
    } else {
      response.json().then((data) => {
        if (data.error?.message) {
          showSimpleAlert(`${data.error.message}`, 2);
        }
      });
    }
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        refreshAllItems();

        const manageControlsContainer = document.getElementById("manage-controls-container");
        const searchElement = createSearchElement();
        manageControlsContainer.prepend(searchElement);

        const displayModeElement = createCompactDisplayModeElement();
        manageControlsContainer.prepend(displayModeElement);

        const itemActionsElement = createItemActionsElement();
        manageControlsContainer.appendChild(itemActionsElement);
      } else {
        response.json().then((data) => {
          const dashboardInfo = document.getElementById("dashboard-info");
          setBoxMessage(dashboardInfo, "Please log in (as Admin) to see the content", "simpleInfoBox");
        });
      }
    });
  },
  () => {},
  { defaultRedirect: true }
);
