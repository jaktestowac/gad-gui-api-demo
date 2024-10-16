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
            orderElement.classList.add("order");
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

            const orderDetails = document.createElement("div");
            orderDetails.classList.add("order-details");

            const orderDate = document.createElement("div");
            orderDate.classList.add("order-date");
            orderDate.innerHTML = `Order Date: ${order.created_at}`;

            const orderTotal = document.createElement("div");
            orderTotal.classList.add("order-total");
            orderTotal.innerHTML = `Total: ${order.total}`;

            const orderItems = document.createElement("div");
            orderItems.classList.add("order-items");

            order.book_ids.forEach((item) => {
              const orderItem = document.createElement("div");
              orderItem.classList.add("order-item");

              const orderItemTitle = document.createElement("div");
              orderItemTitle.classList.add("order-item-title");
              orderItemTitle.innerHTML = "item.title";

              const orderItemPrice = document.createElement("div");
              orderItemPrice.classList.add("order-item-price");
              orderItemPrice.innerHTML = `Price: ${item.price}`;

              orderItem.appendChild(orderItemTitle);
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
        })
        .then(() => {
          issueGetBookShopOrderStatusesRequest().then((response) => {
            if (response.status === 200) {
              response.json().then((orderStatusesData) => {
                const statusIds = getOrderStatusesMarkedAsRaw();
                statusIds.forEach((statusId) => {
                  const foundStatus = orderStatusesData.find((status) => `${status.id}` === `${statusId}`);
                  const orderStatus = document.querySelector(`.order-status[statusId="${statusId}"]`);
                  orderStatus.textContent = foundStatus.name;
                });
              });
            }
          });
        });
    } else {
      noOrdersFound();
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
