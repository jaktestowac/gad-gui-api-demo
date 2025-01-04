const urlBookShopPaymentHistory = "/api/book-shop-manage/payment-history";

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

function displayPaymentHistory(paymentHistoryData, paymentHistoryContainer) {}

checkIfAuthenticated(
  "dashboard-info",
  () => {
    issueGetBookShopAccountRequest().then((response) => {
      if (response.status === 200) {
        issueGetPaymentHistoryRequest().then((response) => {
          if (response.status === 200) {
            return response.json().then((data) => {
              const paymentContainer = document.getElementById("payment-history-container");
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
