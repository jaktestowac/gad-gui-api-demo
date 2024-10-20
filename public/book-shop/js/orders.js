function createOrderItemData(order, orderElement) {
  orderElement.innerHTML = "";

  const orderHeader = document.createElement("div");
  orderHeader.classList.add("order-header");

  const orderID = document.createElement("div");
  orderID.classList.add("order-id");
  orderID.innerHTML = `Order ID: #${order.id}`;

  const orderStatus = document.createElement("span");
  orderStatus.innerHTML = `Status: `;

  const orderStatusValue = document.createElement("span");
  orderStatusValue.classList.add("order-status");
  orderStatusValue.setAttribute("statusId", order.status_id);
  orderStatusValue.setAttribute("raw", "true");
  orderStatusValue.innerHTML = `${order.status_id}`;

  orderStatus.appendChild(orderStatusValue);
  orderHeader.appendChild(orderID);
  orderHeader.appendChild(orderStatus);

  if (order.status_id === 1) {
    const cancelButton = document.createElement("span");

    cancelButton.classList.add("book-clickable-component");
    cancelButton.classList.add("clickable-btn-wide");
    cancelButton.title = "Cancel order";
    cancelButton.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;

    cancelButton.onclick = () => {
      if (order.book_ids?.length === 0) {
        showSimpleAlert("Order is empty", 1);
        return;
      }

      issueCancelOrderRequest(order.id).then((response) => {
        if (response.status === 200) {
          orderStatusValue.textContent = "cancelled";
          cancelButton.remove();
          approveAndSend.remove();
          showSimpleAlert("Order cancelled", 0);

          setTimeout(function () {
            checkIfHasOrders();
          }, 1000);
        } else {
          response.json().then((data) => {
            if (data.error?.message) {
              showSimpleAlert(`Order could not be cancelled. ${data.error.message}`, 2);
            } else {
              showSimpleAlert("Order could not be cancelled", 2);
            }
          });
        }
      });
    };
    orderHeader.appendChild(cancelButton);

    const approveAndSend = document.createElement("span");

    approveAndSend.classList.add("book-clickable-component");
    approveAndSend.classList.add("clickable-btn-wide");
    approveAndSend.title = "Approve and Send";
    approveAndSend.innerHTML = `<i class="fa-solid fa-share-from-square"></i>`;

    approveAndSend.onclick = () => {
      if (order.book_ids?.length === 0) {
        showSimpleAlert("Order is empty", 1);
        return;
      }
      issueApproveAndSendOrderRequest(order.id).then((response) => {
        if (response.status === 200) {
          orderStatusValue.textContent = "sent";
          cancelButton.remove();
          approveAndSend.remove();
          showSimpleAlert("Order approved and sent", 0);

          setTimeout(function () {
            checkIfHasOrders();
          }, 1000);
        } else {
          response.json().then((data) => {
            if (data.error?.message) {
              showSimpleAlert(`Order could not be approved and sent. ${data.error.message}`, 2);
            } else {
              showSimpleAlert("Order could not be approved and sent", 2);
            }
          });
        }
      });
    };
    orderHeader.appendChild(approveAndSend);
  }

  const orderDetails = document.createElement("div");
  orderDetails.classList.add("order-details");

  const orderDate = document.createElement("div");
  orderDate.classList.add("order-date");
  orderDate.innerHTML = `Order Date: ${order.created_at}`;

  const orderTotal = document.createElement("div");
  orderTotal.classList.add("order-total");
  orderTotal.innerHTML = `Total: ${formatPrice(order.total_cost)}`;

  const additionalCosts = document.createElement("div");
  additionalCosts.classList.add("additional-costs");

  const separator = document.createElement("div");
  separator.innerHTML = "Additional costs:";
  additionalCosts.appendChild(separator);
  if (order.additional_costs !== undefined && Object.keys(order.additional_costs).length > 0) {
    for (let key in order.additional_costs) {
      const additionalCost = document.createElement("div");
      additionalCost.classList.add("additional-cost");
      additionalCost.innerHTML = `${key}: ${formatPrice(order.additional_costs[key])}`;
      additionalCosts.appendChild(additionalCost);
    }
  } else {
    const noAdditionalCosts = document.createElement("div");
    noAdditionalCosts.classList.add("no-additional-costs");
    noAdditionalCosts.innerHTML = "No additional costs";
    additionalCosts.appendChild(noAdditionalCosts);
  }

  const orderItems = document.createElement("div");
  orderItems.classList.add("order-items");
  orderItems.classList.add("books-container");

  order.book_ids.forEach((itemId) => {
    const orderItem = document.createElement("div");
    orderItem.classList.add("order-item");

    const orderItemDetails = document.createElement("div");
    orderItemDetails.classList.add("order-item-details");
    orderItemDetails.classList.add(`order-item-details-${itemId}`);
    orderItemDetails.setAttribute("raw", "true");

    const orderItemPriceContainer = document.createElement("div");
    orderItemPriceContainer.classList.add("order-item-price-container");
    const orderItemPrice = document.createElement("span");
    orderItemPrice.classList.add("order-item-price");
    const itemPrice = order.books_cost[itemId] || order.books_cost[`"${itemId}"`] || 0;
    orderItemPrice.innerHTML = `Price: ${formatPrice(itemPrice)}`;
    orderItemPriceContainer.appendChild(orderItemPrice);

    if (order.status_id === 1) {
      const removeItemButton = document.createElement("span");
      removeItemButton.classList.add("book-clickable-component");
      removeItemButton.classList.add("clickable-btn-wide");
      removeItemButton.title = "Remove item from order";
      removeItemButton.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;

      removeItemButton.onclick = () => {
        issueRemoveItemFromOrderRequest(itemId).then((response) => {
          if (response.status === 200) {
            orderItem.remove();
            showSimpleAlert("Item removed from order", 0);

            issueGetUserOrderRequest(order.id).then((response) => {
              if (response.status === 200) {
                return response.json().then((orderData) => {
                  checkIfHasOrders();
                });
              }
            });
          } else {
            response.json().then((data) => {
              if (data.error?.message) {
                showSimpleAlert(`Item could not be removed from order. ${data.error.message}`, 2);
              } else {
                showSimpleAlert("Item could not be removed from order", 2);
              }
            });
          }
        });
      };
      orderItemPriceContainer.appendChild(removeItemButton);
    }

    orderItem.appendChild(orderItemDetails);
    orderItem.appendChild(orderItemPriceContainer);
    orderItems.appendChild(orderItem);
  });

  orderDetails.appendChild(orderDate);
  orderDetails.appendChild(orderTotal);
  orderDetails.appendChild(additionalCosts);

  orderDetails.appendChild(orderItems);

  orderElement.appendChild(orderHeader);
  orderElement.appendChild(orderDetails);
}

function checkIfHasOrders() {
  issueGetUserOrdersRequest().then((response) => {
    if (response.status === 200) {
      return response
        .json()
        .then((ordersData) => {
          // sort orderData by dates
          ordersData.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });

          const ordersContainer = document.getElementById("orders-container");
          ordersContainer.innerHTML = "";

          let newOrders = 0;

          ordersData.forEach((order) => {
            const orderElement = document.createElement("div");
            orderElement.classList.add("order-item");
            orderElement.id = `order-${order.id}`;

            if (order.status_id === 1) {
              newOrders++;
            }

            createOrderItemData(order, orderElement);

            ordersContainer.appendChild(orderElement);
          });

          if (newOrders === 0) {
            enableAddNewOrderButton();
          } else {
            disableAddNewOrderButton();
          }

          return ordersData;
        })
        .then((ordersData) => {
          return issueGetBookShopOrderStatusesRequest().then((response) => {
            if (response.status === 200) {
              return response.json().then((orderStatusesData) => {
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

                return ordersData;
              });
            } else {
              return ordersData;
            }
          });
        })
        .then((ordersData) => {
          const allBookIds = ordersData.reduce((acc, order) => {
            return [...acc, ...order.book_ids];
          }, []);

          const uniqueAllBookIds = [...new Set([...allBookIds])];

          return updateItemsInfo(uniqueAllBookIds);
        });
    } else {
      showSimpleAlert("No orders found. Try ordering something first", 0);
    }
  });
}

function updateItemsInfo(bookIds) {
  return issueGetBooksRequest(bookIds).then((response) => {
    if (response.status === 200) {
      return response
        .json()
        .then((booksData) => {
          booksData.forEach((book) => {
            const bookItems = document.querySelectorAll(`.order-item-details-${book.id}`);

            for (let i = 0; i < bookItems.length; i++) {
              const bookItem = bookItems[i];
              appendBooksData([book], bookItem, true);
            }
          });
        })
        .then(() => {
          const authorIds = getAuthorsMarkedAsRaw();
          const genresIds = getGenresMarkedAsRaw();
          const uniqueAuthorIds = [...new Set([...authorIds])];
          const uniqueGenresIds = [...new Set([...genresIds])];

          return getBookAuthorsAndGenres(uniqueAuthorIds, uniqueGenresIds);
        });
    }
  });
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

function disableAddNewOrderButton() {
  const createOrderButton = document.getElementById("create-order-button");
  createOrderButton.disabled = true;
  createOrderButton.classList.add("disabled");
}

function enableAddNewOrderButton() {
  const createOrderButton = document.getElementById("create-order-button");
  createOrderButton.disabled = false;
  createOrderButton.classList.remove("disabled");
}

function createOrdersControls() {
  const controlsContainer = document.getElementById("controls-container");

  const ordersControls = document.createElement("fieldset");
  ordersControls.classList.add("orders-controls");

  const legend = document.createElement("legend");
  legend.classList.add("orders-legend");
  legend.innerHTML = "Actions";
  ordersControls.appendChild(legend);

  const createOrderButton = document.createElement("button");
  createOrderButton.classList.add("book-shop-button-primary");
  createOrderButton.classList.add("thin");
  createOrderButton.innerHTML = "Create New Order";
  createOrderButton.id = "create-order-button";
  createOrderButton.onclick = () => {
    issueCreateUserOrderRequest().then((response) => {
      if (response.status === 201) {
        checkIfHasOrders();
      } else {
        showSimpleAlert(`Error while creating new order.`, 2);
        response.json().then((data) => {
          if (data.error?.message) {
            showSimpleAlert(data.error.message, 2);
          }
        });
      }
    });
  };

  ordersControls.appendChild(createOrderButton);

  controlsContainer.appendChild(ordersControls);

  disableAddNewOrderButton();
}

checkIfAuthenticated(
  "authentication-info",
  () => {
    issueGetUserRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((userData) => {
          issueGetBookShopAccountRequest().then((response) => {
            if (response.status === 200) {
              createOrdersControls();
              checkIfHasOrders();
            } else if (response.status === 404) {
              // no account - create one
              questionToCreateAnAccountWithRedirection();
            }
          });
        });
      }
    });
  },
  () => {}
);
