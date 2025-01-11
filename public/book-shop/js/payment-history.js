const urlBookShopPaymentHistory = "/api/book-shop-payment-history";

let userPaymentHistory = [];

async function issueGetPaymentHistoryRequest() {
  const url = urlBookShopPaymentHistory;

  const data = fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  });
  return data;
}

function createSearchTools() {
  const toolsPanel = document.getElementById("payment-tools-panel");
  toolsPanel.innerHTML = `
    <div class="payment-history-search-tools">
      <input type="text" id="payment-search" placeholder="Search payments..." 
        style="padding: 8px; border-radius: 4px; border: 1px solid #ddd; width: 200px;">
      <select id="payment-status-filter" class="payment-status-filter">
        <option value="">All Status</option>
      </select>
      <div class="date-range-filter">
        <input type="date" id="date-from" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <span>to</span>
        <input type="date" id="date-to" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
      </div>
      <button id="reset-filters" class="reset-button" title="Reset Filters">
        <i class="fas fa-undo"></i>
      </button>
      <div class="toggle-buttons">
        <button id="toggle-all" title="Toggle All"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>
      </div>
    </div>
  `;

  document.getElementById("payment-search").addEventListener("input", filterPayments);
  document.getElementById("payment-status-filter").addEventListener("change", filterPayments);

  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");

  // if (userPaymentHistory.length > 0) {
  //   const dates = userPaymentHistory.map((p) => new Date(p.date));
  //   const minDate = new Date(Math.min(...dates)).toISOString().split("T")[0];
  //   const maxDate = new Date(Math.max(...dates)).toISOString().split("T")[0];

  //   dateFrom.min = minDate;
  //   dateFrom.max = maxDate;
  //   dateTo.min = minDate;
  //   dateTo.max = maxDate;
  // }

  dateFrom.addEventListener("change", (e) => {
    dateTo.min = e.target.value;
    filterPayments();
  });

  dateTo.addEventListener("change", (e) => {
    dateFrom.max = e.target.value;
    filterPayments();
  });

  const statusFilter = document.getElementById("payment-status-filter");
  const statusOptions = new Set();
  userPaymentHistory.forEach((payment) => {
    statusOptions.add(payment.paymentDetails.status);
  });

  statusOptions.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusFilter.appendChild(option);
  });
  initializeCollapseExpandButtons();

  // Add reset button listener
  document.getElementById("reset-filters").addEventListener("click", resetFilters);
}

function resetFilters() {
  const searchInput = document.getElementById("payment-search");
  const statusFilter = document.getElementById("payment-status-filter");
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");

  searchInput.value = "";
  statusFilter.value = "";
  dateFrom.value = "";
  dateTo.value = "";

  filterPayments();
  showSimpleAlert("Filters reset to default", 1);
}

function filterPayments() {
  const searchTerm = document.getElementById("payment-search").value.trim().toLowerCase();
  const statusFilter = document.getElementById("payment-status-filter").value;
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;

  if (!searchTerm && !statusFilter && !dateFrom && !dateTo) {
    const paymentContainer = document.getElementById("payment-history-container");
    paymentContainer.innerHTML = "";
    displayPaymentHistory(userPaymentHistory, paymentContainer);
    return;
  }

  const filteredData = userPaymentHistory.filter((payment) => {
    const paymentString = JSON.stringify(payment).toLowerCase();
    const paymentDate = new Date(payment.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesSearch = !searchTerm || paymentString.includes(searchTerm);
    const matchesStatus = !statusFilter || payment.paymentDetails.status === statusFilter;
    const matchesDateRange = (!fromDate || paymentDate >= fromDate) && (!toDate || paymentDate <= toDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const paymentContainer = document.getElementById("payment-history-container");
  paymentContainer.innerHTML = "";
  displayPaymentHistory(filteredData, paymentContainer);
}

function displayPaymentHistory(paymentHistoryData, paymentHistoryContainer) {
  if (paymentHistoryData.length === 0) {
    const element = document.createElement("div");
    element.classList.add("no-orders-message");
    element.textContent = "No payments found";
    paymentHistoryContainer.appendChild(element);
    return;
  }

  paymentHistoryData.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  paymentHistoryContainer.innerHTML = "";
  paymentHistoryData.forEach((payment) => {
    const paymentBox = document.createElement("div");
    paymentBox.classList.add("payment-history-box");

    const paymentSummary = document.createElement("div");
    paymentSummary.classList.add("payment-summary");
    paymentSummary.style.display = "flex";
    paymentSummary.style.alignItems = "center";

    const dateFormatted = formatDateToLocaleStringShort(new Date(payment.date));
    paymentSummary.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; flex: 1;">
        <span style="text-align: left">${dateFormatted}</span>
        <span style="text-align: center" class="payment-status-${
          payment.paymentDetails.status
        }">${payment.activityType.toUpperCase()}</span>
        <strong style="text-align: right">${formatPriceWithoutCurrency(payment.paymentDetails.amount)} ${
      payment.paymentDetails.currency
    }</strong>
      </div>
    `;

    const paymentDetails = document.createElement("div");
    paymentDetails.classList.add("payment-details");
    paymentDetails.innerHTML = `
      <p><strong>Payment Method:</strong> ${payment.paymentDetails.paymentMethod.replace("_", " ").toUpperCase()}</p>
      <p><strong>Order ID:</strong> #${payment.paymentDetails.order_id || "N/A"}</p>
      <p><strong>Status:</strong> <span class="payment-status-${payment.paymentDetails.status}">${
      payment.paymentDetails.status
    }</span></p>
      <p><strong>Balance Before:</strong> ${formatPriceWithoutCurrency(payment.balanceBefore)} ${
      payment.paymentDetails.currency
    }</p>
      <p><strong>Balance After:</strong> ${formatPriceWithoutCurrency(payment.balanceAfter)} ${
      payment.paymentDetails.currency
    }</p>
    `;

    paymentSummary.addEventListener("click", () => {
      paymentDetails.classList.toggle("visible");
      paymentSummary.classList.toggle("active");
      updateToggleButtonState();
    });

    paymentBox.appendChild(paymentSummary);
    paymentBox.appendChild(paymentDetails);
    paymentHistoryContainer.appendChild(paymentBox);
  });
}

function initializeCollapseExpandButtons() {
  const toggleBtn = document.getElementById("toggle-all");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const details = document.querySelectorAll(".payment-details");
    const summaries = document.querySelectorAll(".payment-summary");
    const hasExpandedItems = document.querySelectorAll(".payment-details.visible").length > 0;

    if (hasExpandedItems) {
      details.forEach((detail) => detail.classList.remove("visible"));
      summaries.forEach((summary) => summary.classList.remove("active"));
      showSimpleAlert("All payments collapsed", 0);
    } else {
      details.forEach((detail) => detail.classList.add("visible"));
      summaries.forEach((summary) => summary.classList.add("active"));
      showSimpleAlert("All payments expanded", 0);
    }

    updateToggleButtonState();
  });
}

function updateToggleButtonState() {
  const toggleBtn = document.getElementById("toggle-all");
  if (!toggleBtn) return;

  const expandedDetails = document.querySelectorAll(".payment-details.visible").length;

  if (expandedDetails > 0) {
    toggleBtn.innerHTML = '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
  }
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        issueGetPaymentHistoryRequest().then((response) => {
          if (response.status === 200) {
            return response.json().then((data) => {
              const paymentContainer = document.getElementById("payment-history-container");
              userPaymentHistory = data;
              paymentContainer.innerHTML = "";
              displayPaymentHistory(data, paymentContainer);
              createSearchTools();
            });
          } else {
            if (response.status === 401) {
              const dashboardInfo = document.getElementById("dashboard-info");
              setBoxMessage(dashboardInfo, "Please login to see payment history", "simpleInfoBox");
            } else {
              const paymentContainer = document.getElementById("payment-history-container");
              paymentContainer.innerHTML = "";
              const element = document.createElement("div");
              element.classList.add("no-orders-message");
              element.textContent = "No team found";
              paymentContainer.appendChild(element);
            }
          }
        });
      } else {
        const dashboardInfo = document.getElementById("dashboard-info");
        setBoxMessage(dashboardInfo, "Please create an Account to see payment history", "simpleInfoBox");
      }
    });
  },
  () => {},
  { defaultRedirect: true }
);
