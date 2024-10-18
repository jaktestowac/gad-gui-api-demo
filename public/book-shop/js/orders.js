function checkIfHasOrders() {
  issueGetUserOrdersRequest().then((response) => {
    if (response.status === 200) {
      response
        .json()
        .then((ordersData) => {
          ordersData.sort((a, b) => a.status_id - b.status_id);

          const ordersContainer = document.getElementById("orders-container");
          ordersContainer.innerHTML = "";
          ordersData.forEach((order) => {
            const orderElement = document.createElement("div");
            orderElement.classList.add("order-item");
            orderElement.id = `order-${order.id}`;

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
              const cancelButton = document.createElement("button");
              cancelButton.classList.add("book-shop-button-primary");
              cancelButton.classList.add("red");
              cancelButton.classList.add("thin");

              cancelButton.innerHTML = "Cancel";
              cancelButton.onclick = () => {
                issueCancelOrderRequest(order.id).then((response) => {
                  if (response.status === 200) {
                    orderStatusValue.textContent = "cancelled";
                    cancelButton.remove();
                  }
                });
              };
              orderHeader.appendChild(cancelButton);
            }

            const orderDetails = document.createElement("div");
            orderDetails.classList.add("order-details");

            const orderDate = document.createElement("div");
            orderDate.classList.add("order-date");
            orderDate.innerHTML = `Order Date: ${order.created_at}`;

            const orderTotal = document.createElement("div");
            orderTotal.classList.add("order-total");
            orderTotal.innerHTML = `Total: ${formatPrice(order.total_price)}`;

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

              const orderItemPrice = document.createElement("div");
              orderItemPrice.classList.add("order-item-price");
              const itemPrice = order.books_price[itemId] || order.books_price[`"${itemId}"`] || 0;
              orderItemPrice.innerHTML = `Price: ${formatPrice(itemPrice)}`;

              orderItem.appendChild(orderItemDetails);
              orderItem.appendChild(orderItemPrice);

              orderItems.appendChild(orderItem);
            });

            orderDetails.appendChild(orderDate);
            orderDetails.appendChild(orderTotal);
            orderDetails.appendChild(orderItems);

            orderElement.appendChild(orderHeader);
            orderElement.appendChild(orderDetails);

            ordersContainer.appendChild(orderElement);
          });

          return ordersData;
        })
        .then((ordersData) => {
          return issueGetBookShopOrderStatusesRequest().then((response) => {
            if (response.status === 200) {
              return response.json().then((orderStatusesData) => {
                const statusIds = getOrderStatusesMarkedAsRaw();
                statusIds.forEach((statusId) => {
                  const foundStatus = orderStatusesData.find((status) => `${status.id}` === `${statusId}`);
                  const orderStatus = document.querySelector(`.order-status[statusId="${statusId}"]`);
                  orderStatus.textContent = foundStatus.name;
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

          return updateItemsInfo(allBookIds);
        });
    } else {
      showSimpleAlert("No orders found. Try ordering something first", false);
    }
  });
}

function updateItemsInfo(bookIds) {
  issueGetBooksRequest(bookIds).then((response) => {
    if (response.status === 200) {
      response.json().then((booksData) => {
        booksData.forEach((book) => {
          const bookItems = document.querySelectorAll(`.order-item-details-${book.id}`);

          for (let i = 0; i < bookItems.length; i++) {
            const bookItem = bookItems[i];
            appendBooksData([book], bookItem);
          }
        });
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

checkIfAuthenticated(
  "authentication-info",
  () => {
    issueGetUserRequest().then((response) => {
      if (response.status === 200) {
        response.json().then((userData) => {
          issueGetBookShopAccountRequest().then((response) => {
            if (response.status === 200) {
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
