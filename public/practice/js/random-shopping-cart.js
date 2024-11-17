async function getRandomSimpleShoppingCartData() {
  return fetch(`http://localhost:3000/api/v1/data/random/ecommerce-shopping-cart-simple`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return {};
    }
  });
}

function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}

function presentSimpleShoppingCartDataOnUIAsATable(shoppingCartData) {
  const resultsContainer = document.getElementById("results-container");
  const table = document.createElement("table");
  table.classList.add("results-table");
  table.setAttribute("id", "results-table");
  table.setAttribute("class", "results-table");
  table.style.borderCollapse = "collapse";
  table.style.textAlign = "center";

  const headerRow = document.createElement("tr");
  headerRow.style.backgroundColor = "lightgray";
  headerRow.style.border = "1px solid black";

  const headerProduct = document.createElement("th");
  headerProduct.textContent = "Product";
  headerProduct.style.border = "1px solid black";
  headerProduct.style.textAlign = "center";
  headerRow.appendChild(headerProduct);

  const headerProductIcon = document.createElement("th");
  headerProductIcon.textContent = "Icon";
  headerProductIcon.style.border = "1px solid black";
  headerProductIcon.style.textAlign = "center";
  headerRow.appendChild(headerProductIcon);

  const headerPrice = document.createElement("th");
  headerPrice.textContent = "Price";
  headerPrice.style.border = "1px solid black";
  headerPrice.style.textAlign = "center";
  headerRow.appendChild(headerPrice);

  const headerQuantity = document.createElement("th");
  headerQuantity.innerHTML = "Quantity";
  headerQuantity.style.border = "1px solid black";
  headerQuantity.style.textAlign = "center";
  headerRow.appendChild(headerQuantity);

  const headerSubtotal = document.createElement("th");
  headerSubtotal.innerHTML = "Subtotal";
  headerSubtotal.style.border = "1px solid black";
  headerSubtotal.style.textAlign = "center";
  headerRow.appendChild(headerSubtotal);

  table.appendChild(headerRow);

  shoppingCartData.cartItems.forEach((cartItem) => {
    cartItem.product.icon = cartItem.product.icon ?? undefined;
    cartItem.product.price = isNumber(cartItem.product.price) ? cartItem.product.price : NaN;

    const row = document.createElement("tr");
    row.style.border = "1px solid black";

    const product = document.createElement("td");
    product.textContent = cartItem.product.name;
    product.style.border = "1px solid black";
    product.classList.add("table-cell");
    row.appendChild(product);

    const productIcon = document.createElement("td");
    productIcon.innerHTML = cartItem.product.icon;
    productIcon.style.border = "1px solid black";
    productIcon.style.fontSize = "1.5em";
    productIcon.classList.add("table-cell");
    row.appendChild(productIcon);

    const price = document.createElement("td");
    price.textContent = cartItem.product.price;
    price.style.border = "1px solid black";
    price.classList.add("table-cell");
    row.appendChild(price);

    const quantity = document.createElement("td");
    quantity.innerHTML = cartItem.quantity;
    quantity.style.border = "1px solid black";
    quantity.classList.add("table-cell");
    row.appendChild(quantity);

    const subtotal = document.createElement("td");
    subtotal.innerHTML = cartItem.subtotal;
    subtotal.style.border = "1px solid black";
    subtotal.classList.add("table-cell");
    row.appendChild(subtotal);

    table.appendChild(row);
  });

  // calculate total and number of items
  const totalRow = document.createElement("tr");
  totalRow.style.backgroundColor = "lightgray";
  totalRow.style.border = "1px solid black";

  const totalLabel = document.createElement("td");
  totalLabel.textContent = "Total";
  totalLabel.colSpan = 2;
  totalLabel.style.border = "1px solid black";
  totalLabel.classList.add("table-cell");
  totalRow.appendChild(totalLabel);

  const totalPrice = document.createElement("td");
  const totalPriceValue = shoppingCartData.cartItems.reduce((acc, item) => acc + item.product.price, 0);
  totalPrice.textContent = Math.round(totalPriceValue * 100) / 100;
  totalPrice.style.border = "1px solid black";
  totalPrice.classList.add("table-cell");
  totalRow.appendChild(totalPrice);

  const totalQuantity = document.createElement("td");
  const totalQuantityValue = shoppingCartData.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  totalQuantity.textContent = Math.round(totalQuantityValue * 100) / 100;
  totalQuantity.style.border = "1px solid black";
  totalQuantity.classList.add("table-cell");
  totalRow.appendChild(totalQuantity);

  const totalSubtotal = document.createElement("td");
  const totalSubtotalValue = shoppingCartData.cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  totalSubtotal.textContent = Math.round(totalSubtotalValue * 100) / 100;
  totalSubtotal.style.border = "1px solid black";
  totalSubtotal.classList.add("table-cell");
  totalRow.appendChild(totalSubtotal);

  table.appendChild(totalRow);

  resultsContainer.appendChild(table);
}

function getAndPresentRandomShoppingCartData() {
  getRandomSimpleShoppingCartData().then((data) => {
    presentSimpleShoppingCartDataOnUIAsATable(data);
  });
}
