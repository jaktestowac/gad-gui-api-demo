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
      <select id="payment-status-filter" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <option value="">All Status</option>
      </select>
      <div class="date-range-filter">
        <input type="date" id="date-from" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
        <span>to</span>
        <input type="date" id="date-to" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
      </div>
    </div>
  `;

  document.getElementById("payment-search").addEventListener("input", filterPayments);
  document.getElementById("payment-status-filter").addEventListener("change", filterPayments);

  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");

  if (userPaymentHistory.length > 0) {
    const dates = userPaymentHistory.map((p) => new Date(p.date));
    const minDate = new Date(Math.min(...dates)).toISOString().split("T")[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split("T")[0];

    dateFrom.min = minDate;
    dateFrom.max = maxDate;
    dateTo.min = minDate;
    dateTo.max = maxDate;
  }

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
    paymentSummary.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; flex: 1;">
        <span style="text-align: left">${payment.date}</span>
        <span style="text-align: center" class="payment-status-${payment.paymentDetails.status}">${payment.activityType.toUpperCase()}</span>
        <strong style="text-align: right">${payment.paymentDetails.amount} ${payment.paymentDetails.currency}</strong>
      </div>
    `;

    const paymentDetails = document.createElement("div");
    paymentDetails.classList.add("payment-details");
    paymentDetails.style.display = "none";
    paymentDetails.innerHTML = `
      <p><strong>Payment Method:</strong> ${payment.paymentDetails.paymentMethod.replace("_", " ").toUpperCase()}</p>
      <p><strong>Status:</strong> <span class="payment-status-${payment.paymentDetails.status}">${
      payment.paymentDetails.status
    }</span></p>
      <p><strong>Balance Before:</strong> ${payment.balanceBefore} ${payment.paymentDetails.currency}</p>
      <p><strong>Balance After:</strong> ${payment.balanceAfter} ${payment.paymentDetails.currency}</p>
    `;

    paymentSummary.addEventListener("click", () => {
      paymentDetails.style.display = paymentDetails.style.display === "none" ? "block" : "none";
      paymentSummary.classList.toggle("active");
    });

    paymentBox.appendChild(paymentSummary);
    paymentBox.appendChild(paymentDetails);
    paymentHistoryContainer.appendChild(paymentBox);
  });
}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        createSearchTools(); // Add search tools
        issueGetPaymentHistoryRequest().then((response) => {
          if (response.status === 200) {
            return response.json().then((data) => {
              const paymentContainer = document.getElementById("payment-history-container");
              userPaymentHistory = data;
              paymentContainer.innerHTML = "";
              displayPaymentHistory(data, paymentContainer);
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
