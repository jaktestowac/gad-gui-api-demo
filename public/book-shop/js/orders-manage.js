const urlBookShopManageOrdersUrl = "/api/book-shop-manage/orders";
const urlBookShopManageUsersUrl = "/api/book-shop-manage/users";

async function issueGetAllUserOrdersRequest() {
  let urlOrders = `${urlBookShopManageOrdersUrl}`;
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

async function issueGetUserAccountNamesRequest(userIds) {
  const urlQueryIds = `${userIds.join("&id=")}`;
  const urlQuery = `${urlBookShopManageUsersUrl}?id=${urlQueryIds}`;
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

async function issueGetSingleUserOrdersRequest(orderId) {
  let urlOrders = `${urlBookShopManageOrdersUrl}/${orderId}`;
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

async function issueAdminChangeOrderStatusRequest(orderId, newStatusId) {
  let urlBook = `${urlBookShopManageOrdersUrl}/${orderId}`;

  const body = {
    status_id: newStatusId,
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

function prepareOrderElement(order, el = undefined) {
  let orderElement = el;

  if (!orderElement) {
    orderElement = document.createElement("div");
    orderElement.classList.add("order-element");
    orderElement.setAttribute("elementOrderId", order.id);
  } else {
    orderElement.innerHTML = "";
  }

  const orderElementBaseInfo = document.createElement("div");
  orderElementBaseInfo.classList.add("order-element-base-info");

  const orderIdElement = document.createElement("div");
  orderIdElement.classList.add("order-id");
  orderIdElement.innerHTML = `Order ID:`;

  const orderIdValueElement = document.createElement("div");
  orderIdValueElement.innerHTML = `#${order.id}`;

  orderIdElement.appendChild(orderIdValueElement);

  const orderStatusElement = document.createElement("div");
  orderStatusElement.classList.add("order-status-element");
  orderStatusElement.innerText = `Status:`;

  const orderStatusValueElement = document.createElement("div");
  orderStatusValueElement.classList.add("order-status");
  orderStatusValueElement.classList.add("order-status-value");
  orderStatusValueElement.setAttribute("raw", "true");
  orderStatusValueElement.setAttribute("statusId", order.status_id);
  orderStatusValueElement.innerText = order.status_id;

  orderStatusElement.appendChild(orderStatusValueElement);

  const orderCreatedAtElement = document.createElement("div");
  orderCreatedAtElement.classList.add("order-created-at");
  orderCreatedAtElement.innerHTML = `Created At:`;

  const orderCreatedAtValueElement = document.createElement("div");
  orderCreatedAtValueElement.classList.add("order-created-at-value");
  orderCreatedAtValueElement.innerHTML = `${order.created_at}`;

  orderCreatedAtElement.appendChild(orderCreatedAtValueElement);

  orderElementBaseInfo.appendChild(orderIdElement);
  orderElementBaseInfo.appendChild(orderStatusElement);
  orderElementBaseInfo.appendChild(orderCreatedAtElement);

  orderElement.appendChild(orderElementBaseInfo);

  const orderElementActions = document.createElement("div");
  orderElementActions.classList.add("order-element-actions");

  const orderElementPossibleActions = document.createElement("span");
  orderElementPossibleActions.classList.add("order-element-possible-actions");
  orderElementPossibleActions.setAttribute("statusId", order.status_id);
  orderElementPossibleActions.setAttribute("orderId", order.id);
  orderElementPossibleActions.setAttribute("raw", "true");

  orderElementActions.appendChild(orderElementPossibleActions);
  orderElement.appendChild(orderElementActions);

  const orderBooksContainerElement = document.createElement("div");
  const orderBooksLabelElement = document.createElement("span");
  orderBooksLabelElement.classList.add("order-books");
  orderBooksLabelElement.classList.add("order-label");
  orderBooksLabelElement.innerHTML = `No. of books:`;

  const orderBooksValueElement = document.createElement("span");
  orderBooksValueElement.classList.add("order-books");
  orderBooksValueElement.classList.add("order-value");
  orderBooksValueElement.innerHTML = `${order.book_ids.length > 0 ? order.book_ids.length : "none"}`;

  orderBooksContainerElement.appendChild(orderBooksLabelElement);
  orderBooksContainerElement.appendChild(orderBooksValueElement);

  orderElement.appendChild(orderBooksContainerElement);

  const orderUserElement = document.createElement("span");
  orderUserElement.classList.add("order-user");
  orderUserElement.classList.add("order-label");
  orderUserElement.innerHTML = `User:`;

  const orderUserContainerElement = document.createElement("div");
  const orderUserValueElement = document.createElement("span");
  orderUserValueElement.classList.add("order-user-component");
  orderUserValueElement.classList.add("order-value");
  orderUserValueElement.setAttribute("userId", order.user_id);
  orderUserValueElement.setAttribute("raw", "true");
  orderUserValueElement.innerHTML = `${order.user_id}`;

  orderUserContainerElement.appendChild(orderUserElement);
  orderUserContainerElement.appendChild(orderUserValueElement);
  orderElement.appendChild(orderUserContainerElement);

  const orderTotalCostContainerElement = document.createElement("div");
  const orderTotalCostLabelElement = document.createElement("span");
  orderTotalCostLabelElement.classList.add("order-total-cost-label");
  orderTotalCostLabelElement.classList.add("order-label");
  orderTotalCostLabelElement.innerHTML = `Total Cost: `;
  orderTotalCostContainerElement.appendChild(orderTotalCostLabelElement);
  const orderTotalCostElement = document.createElement("span");
  orderTotalCostElement.classList.add("order-total-cost");
  orderTotalCostElement.classList.add("order-value");
  orderTotalCostElement.innerHTML = `${formatPrice(order.total_cost)}`;
  orderTotalCostContainerElement.appendChild(orderTotalCostElement);

  orderElement.appendChild(orderTotalCostContainerElement);

  const orderPartialCostContainerElement = document.createElement("div");
  const orderPartialCostsElement = document.createElement("div");
  orderPartialCostsElement.classList.add("order-partial-costs");
  orderPartialCostsElement.classList.add("order-label");
  orderPartialCostsElement.innerHTML = `Partial Costs:`;
  orderPartialCostContainerElement.appendChild(orderPartialCostsElement);

  const partialKeys = Object.keys(order.partial_costs);

  partialKeys.forEach((partialKey) => {
    const partialCostElement = document.createElement("div");
    partialCostElement.classList.add("order-partial-cost");
    partialCostElement.innerHTML = `${partialKey}: ${formatPrice(order.partial_costs[partialKey])}`;
    orderPartialCostContainerElement.appendChild(partialCostElement);
  });

  if (partialKeys.length === 0) {
    const partialCostElement = document.createElement("div");
    partialCostElement.classList.add("order-partial-cost");
    partialCostElement.innerHTML = `none`;

    orderPartialCostContainerElement.appendChild(partialCostElement);
  }

  const orderBooksCostContainerElement = document.createElement("div");
  const orderBooksCostElement = document.createElement("div");
  orderBooksCostElement.classList.add("order-books-cost");
  orderBooksCostElement.classList.add("order-label");
  orderBooksCostElement.innerHTML = `Books Cost:`;
  orderBooksCostContainerElement.appendChild(orderBooksCostElement);

  const partialBooksCostKeys = Object.keys(order.books_cost);

  partialBooksCostKeys.forEach((bookId) => {
    const partialCostElement = document.createElement("div");
    partialCostElement.classList.add("order-partial-cost");

    const bookElement = document.createElement("span");
    bookElement.classList.add("order-book-title");
    bookElement.setAttribute("bookId", bookId);
    bookElement.setAttribute("raw", "true");
    bookElement.innerHTML = ` ${bookId} `;

    const bookCostElement = document.createElement("span");
    bookCostElement.classList.add("order-book-cost");
    bookCostElement.innerHTML = `: ${formatPrice(order.books_cost[bookId])}`;

    partialCostElement.appendChild(bookElement);
    partialCostElement.appendChild(bookCostElement);

    orderBooksCostContainerElement.appendChild(partialCostElement);
  });

  if (partialBooksCostKeys.length === 0) {
    const partialCostElement = document.createElement("div");
    partialCostElement.classList.add("order-partial-cost");
    partialCostElement.innerHTML = `none`;

    orderBooksCostContainerElement.appendChild(partialCostElement);
  }

  orderElement.appendChild(orderBooksCostContainerElement);

  orderElement.appendChild(orderPartialCostContainerElement);

  orderElement.classList.add(`order-element-status-${order.status_id}`);

  return orderElement;
}

function formatPossibleActions(orderStatusesData) {
  const possibleActions = document.querySelectorAll(".order-element-possible-actions");

  possibleActions.forEach((possibleAction) => {
    const statusId = possibleAction.getAttribute("statusId");
    const orderId = possibleAction.getAttribute("orderId");

    possibleAction.innerHTML = "";

    const status = orderStatusesData.find((status) => status.id === parseInt(statusId));

    const labelElement = document.createElement("span");
    labelElement.innerHTML = "Set status:&nbsp;&nbsp;";
    possibleAction.appendChild(labelElement);

    status.possible_next_statuses.forEach((possibleNextStatusId) => {
      const possibleNextStatus = orderStatusesData.find((status) => status.id === possibleNextStatusId);

      const possibleNextStatusElement = document.createElement("span");
      possibleNextStatusElement.classList.add("book-clickable-component");
      possibleNextStatusElement.classList.add("manage-order-button");
      possibleNextStatusElement.setAttribute("statusId", possibleNextStatus.id);
      possibleNextStatusElement.setAttribute("orderId", orderId);
      possibleNextStatusElement.setAttribute("raw", "true");
      possibleNextStatusElement.innerHTML = `<i class="fas ${possibleNextStatus.icon}" title="${
        orderStatusesData.find((status) => status.id === possibleNextStatus.id).name
      }"></i>`;

      possibleNextStatusElement.addEventListener("click", (event) => {
        const statusId = possibleNextStatusElement.getAttribute("statusId");
        const orderId = possibleNextStatusElement.getAttribute("orderId");

        issueAdminChangeOrderStatusRequest(orderId, statusId).then((response) => {
          if (response.status === 200) {
            response.json().then((order) => {
              const orderElement = document.querySelector(`[elementOrderId="${orderId}"]`);
              prepareOrderElement(order, orderElement);
              refreshOrderDetails();
            });
          }
        });
      });

      possibleAction.appendChild(possibleNextStatusElement);
    });

    if (status.possible_next_statuses.length > 0) {
      const labelElement2 = document.createElement("span");
      labelElement2.innerHTML = "&nbsp;&nbsp;or:&nbsp;&nbsp;";
      possibleAction.appendChild(labelElement2);
    }
    const selectElement = document.createElement("select");
    selectElement.classList.add("manage-order-select");
    selectElement.setAttribute("orderId", orderId);
    selectElement.setAttribute("raw", "true");

    orderStatusesData.forEach((status) => {
      const optionElement = document.createElement("option");
      optionElement.value = status.id;
      optionElement.innerText = status.name;
      selectElement.appendChild(optionElement);
    });

    possibleAction.appendChild(selectElement);
    const changeStatusButton = document.createElement("button");
    changeStatusButton.classList.add("book-shop-button-primary");
    changeStatusButton.classList.add("thin");
    changeStatusButton.setAttribute("orderId", orderId);
    changeStatusButton.innerHTML = "Change";

    changeStatusButton.addEventListener("click", (event) => {
      const orderId = changeStatusButton.getAttribute("orderId");
      const selectElement = document.querySelector(`select[orderId="${orderId}"]`);
      const statusId = selectElement.value;

      issueAdminChangeOrderStatusRequest(orderId, statusId).then((response) => {
        if (response.status === 200) {
          response.json().then((order) => {
            const orderElement = document.querySelector(`[elementOrderId="${orderId}"]`);
            prepareOrderElement(order, orderElement);
            refreshOrderDetails();
          });
        } else {
          response.json().then((data) => {
            if (data.error?.message) {
              showSimpleAlert(`${data.error.message}`, 2);
            }
          });
        }
      });
    });

    possibleAction.appendChild(changeStatusButton);
  });
}

function refreshOrderDetails() {
  return issueGetBookShopOrderStatusesRequest().then((response) => {
    if (response.status === 200) {
      return response.json().then((orderStatusesData) => {
        formatOrderStatus(orderStatusesData);
        formatPossibleActions(orderStatusesData);

        return orderStatusesData;
      });
    } else {
      return [];
    }
  });
}

function formatUsersAndBooks() {
  const bookIds = getOrderBooksMarkedAsRaw();
  const userIds = getOrderUsersMarkedAsRaw();

  if (bookIds.length === 0 && userIds.length === 0) {
    return;
  }

  if (bookIds.length > 0) {
    issueGetBooksRequest(bookIds).then((response) => {
      if (response.status === 200) {
        response.json().then((books) => {
          formatOrderBookTitleSimple(books);
        });
      }
    });
  }

  if (userIds.length > 0) {
    issueGetUserAccountNamesRequest(userIds).then((response) => {
      if (response.status === 200) {
        response.json().then((users) => {
          formatOrderUserAccountNamesSimple(users);
        });
      }
    });
  }
}

function createFilteringControls(orderStatusesData) {
  const statuses = [...orderStatusesData];
  statuses.unshift({ id: "all", name: "All", icon: "fa-house" });

  const filteringControls = document.createElement("div");
  filteringControls.classList.add("manage-orders-filtering-controls");

  const filteringControlsStatuses = document.createElement("div");
  filteringControlsStatuses.classList.add("manage-orders-filtering-controls-statuses");

  statuses.forEach((status) => {
    const statusElement = document.createElement("span");
    statusElement.classList.add("manage-orders-filtering-controls-status");
    statusElement.classList.add("book-clickable-component");
    statusElement.setAttribute("statusId", status.id);
    statusElement.setAttribute("raw", "true");

    const statusNameElement = document.createElement("span");
    statusNameElement.innerHTML = status.name;

    const statusIconElement = document.createElement("span");
    statusIconElement.innerHTML = `<i class="fas ${status.icon}" title="${status.name}"></i>`;

    statusElement.appendChild(statusIconElement);
    statusElement.appendChild(statusNameElement);

    statusElement.addEventListener("click", (event) => {
      const statusId = statusElement.getAttribute("statusId");
      const orderElements = document.querySelectorAll(".order-element");

      orderElements.forEach((orderElement) => {
        if (statusId === "all") {
          orderElement.style.display = "block";
        } else {
          if (orderElement.classList.contains(`order-element-status-${statusId}`)) {
            orderElement.style.display = "block";
          } else {
            orderElement.style.display = "none";
          }
        }
      });

      // if there are no orders to display, show a message
      const ordersContainer = document.getElementById("manage-orders-container");
      const orders = ordersContainer.querySelectorAll(".order-element");
      let ordersToDisplay = 0;
      orders.forEach((order) => {
        if (order.style.display !== "none") {
          ordersToDisplay++;
        }
      });

      if (ordersToDisplay === 0) {
        const noOrderElements = document.querySelectorAll(".no-orders-message");
        if (noOrderElements.length !== 0) {
          return;
        }

        const ordersMessageContainer = document.querySelector("#orders-messages");
        const noOrdersElement = document.createElement("div");
        noOrdersElement.classList.add("no-orders-message");
        noOrdersElement.innerHTML = "No orders to display";
        ordersMessageContainer.appendChild(noOrdersElement);
      } else {
        const noOrderElements = document.querySelectorAll(".no-orders-message");
        noOrderElements.forEach((element) => {
          element.remove();
        });
      }
    });

    filteringControlsStatuses.appendChild(statusElement);
  });

  filteringControls.appendChild(filteringControlsStatuses);
  return filteringControls;
}

function populateManageControlsContainer() {
  issueGetBookShopOrderStatusesRequest().then((response) => {
    if (response.status === 200) {
      response.json().then((orderStatusesData) => {
        const filteringControlsContainer = document.getElementById("manage-orders-filtering-controls");
        filteringControlsContainer.innerHTML = "";
        const filteringControls = createFilteringControls(orderStatusesData);
        filteringControlsContainer.appendChild(filteringControls);
      });
    }
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        populateManageControlsContainer();
        issueGetAllUserOrdersRequest().then((response) => {
          if (response.status === 200) {
            response.json().then((orders) => {
              const ordersContainer = document.getElementById("manage-orders-container");
              ordersContainer.innerHTML = "";
              orders.forEach((order) => {
                const orderElement = prepareOrderElement(order);
                ordersContainer.appendChild(orderElement);
              });

              refreshOrderDetails();
              formatUsersAndBooks();
            });
          } else if (response.status === 401) {
            const dashboardInfo = document.getElementById("dashboard-info");
            setBoxMessage(dashboardInfo, "You dont have permission to see accounts", "simpleInfoBox");
          }
        });
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
