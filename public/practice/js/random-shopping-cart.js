async function getRandomSimpleShoppingCartData() {
  return fetch(`http://localhost:3000/api/v1/data/random/ecommerce-shopping-cart-simple`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBearerToken(),
    },
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
  headerPrice.textContent = "Price (PLN)";
  headerPrice.style.border = "1px solid black";
  headerPrice.style.textAlign = "center";
  headerRow.appendChild(headerPrice);

  const headerQuantity = document.createElement("th");
  headerQuantity.innerHTML = "Quantity";
  headerQuantity.style.border = "1px solid black";
  headerQuantity.style.textAlign = "center";
  headerRow.appendChild(headerQuantity);

  const headerSubtotal = document.createElement("th");
  headerSubtotal.innerHTML = "Subtotal (PLN)";
  headerSubtotal.style.border = "1px solid black";
  headerSubtotal.style.textAlign = "center";
  headerRow.appendChild(headerSubtotal);

  table.appendChild(headerRow);

  shoppingCartData.cartItems.forEach((cartItem) => {
    // check if all required fields are present
    cartItem.product = cartItem?.product ?? {};
    cartItem.product.name = cartItem?.product?.name ?? "Unknown product";

    cartItem.product.icon = cartItem?.product?.icon ?? undefined;
    cartItem.product.price = isNumber(cartItem?.product?.price) ? cartItem?.product?.price : NaN;
    cartItem.subtotal = isNumber(cartItem?.subtotal) ? cartItem?.subtotal : NaN;

    const row = document.createElement("tr");
    row.style.border = "1px solid black";

    const product = document.createElement("td");
    product.textContent = cartItem?.product?.name;
    product.style.border = "1px solid black";
    product.classList.add("table-cell");
    row.appendChild(product);

    const productIcon = document.createElement("td");
    productIcon.innerHTML = cartItem?.product?.icon;
    productIcon.style.border = "1px solid black";
    productIcon.style.fontSize = "1.5em";
    productIcon.classList.add("table-cell");
    row.appendChild(productIcon);

    const price = document.createElement("td");
    price.textContent = cartItem.product?.price;
    price.style.border = "1px solid black";
    price.classList.add("table-cell");
    row.appendChild(price);

    const quantity = document.createElement("td");
    quantity.innerHTML = cartItem?.quantity;
    quantity.style.border = "1px solid black";
    quantity.classList.add("table-cell");
    row.appendChild(quantity);

    const subtotal = document.createElement("td");
    subtotal.innerHTML = cartItem?.subtotal;
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
  totalLabel.textContent = "Sum:";
  totalLabel.colSpan = 3;
  totalLabel.style.border = "1px solid black";
  totalLabel.classList.add("table-cell");
  totalRow.appendChild(totalLabel);

  const totalQuantity = document.createElement("td");
  const totalQuantityValue = shoppingCartData.cartItems.reduce((acc, item) => acc + item.quantity, 0);
  totalQuantity.textContent = Math.round(totalQuantityValue * 100) / 100;
  totalQuantity.setAttribute("id", "total-quantity");
  totalQuantity.setAttribute("data-testid", "total-quantity");
  totalQuantity.style.border = "1px solid black";
  totalQuantity.classList.add("table-cell");
  totalRow.appendChild(totalQuantity);

  const totalSubtotal = document.createElement("td");
  const totalSubtotalValue = shoppingCartData.cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  totalSubtotal.textContent = Math.round(totalSubtotalValue * 100) / 100;
  totalSubtotal.style.border = "1px solid black";
  totalSubtotal.setAttribute("id", "total-subtotal-price");
  totalSubtotal.setAttribute("data-testid", "total-subtotal-price");
  totalSubtotal.classList.add("table-cell");
  totalRow.appendChild(totalSubtotal);

  table.appendChild(totalRow);

  resultsContainer.appendChild(table);

  const shippingRow = document.createElement("tr");
  shippingRow.style.border = "0px solid black";

  const blankRow = document.createElement("td");
  blankRow.textContent = "";
  blankRow.colSpan = 3;
  blankRow.style.border = "0px solid black";
  blankRow.classList.add("table-cell");
  shippingRow.appendChild(blankRow);

  const shippingLabel = document.createElement("td");
  shippingLabel.innerHTML = "Shipping<br>(10% of subtotal)";
  shippingLabel.style.border = "1px solid black";
  shippingLabel.classList.add("table-cell");
  shippingLabel.style.backgroundColor = "lightgray";
  shippingRow.appendChild(shippingLabel);

  const shippingCost = document.createElement("td");
  // const shippingCostValue = (totalPriceValue % 100) * 1.75 + (totalQuantityValue2 % 3) * 10;
  const shippingCostValue = totalSubtotalValue / 10;
  shippingCost.textContent = (Math.round(shippingCostValue * 100) / 100).toFixed(2);
  shippingCost.style.border = "1px solid black";
  shippingCost.classList.add("table-cell");
  shippingCost.setAttribute("id", "shipping-cost");
  shippingCost.setAttribute("data-testid", "shipping-cost");
  shippingCost.style.backgroundColor = "lightgray";
  shippingRow.appendChild(shippingCost);

  table.appendChild(shippingRow);

  // calculate tax
  const taxRow = document.createElement("tr");
  taxRow.style.border = "0px solid black";

  const blankTaxRow = document.createElement("td");
  blankTaxRow.textContent = "";
  blankTaxRow.colSpan = 3;
  blankTaxRow.style.border = "0px solid black";
  blankTaxRow.classList.add("table-cell");
  taxRow.appendChild(blankTaxRow);

  const taxLabel = document.createElement("td");
  taxLabel.innerHTML = "Tax<br>(10% of subtotal)";
  taxLabel.style.border = "1px solid black";
  taxLabel.classList.add("table-cell");
  taxLabel.style.backgroundColor = "lightgray";
  taxRow.appendChild(taxLabel);

  const taxCost = document.createElement("td");
  const taxCostValue = totalSubtotalValue * 0.1;
  taxCost.textContent = (Math.round(taxCostValue * 100) / 100).toFixed(2);
  taxCost.style.border = "1px solid black";
  taxCost.classList.add("table-cell");
  taxCost.setAttribute("id", "tax-cost");
  taxCost.setAttribute("data-testid", "tax-cost");
  taxCost.style.backgroundColor = "lightgray";
  taxRow.appendChild(taxCost);

  table.appendChild(taxRow);

  // calculate total
  const grandTotalRow = document.createElement("tr");
  grandTotalRow.style.border = "0px solid black";

  const blankGrandTotalRow = document.createElement("td");
  blankGrandTotalRow.textContent = "";
  blankGrandTotalRow.colSpan = 3;
  blankGrandTotalRow.style.border = "0px solid black";
  blankGrandTotalRow.classList.add("table-cell");
  grandTotalRow.appendChild(blankGrandTotalRow);

  const grandTotalLabel = document.createElement("td");
  grandTotalLabel.textContent = "Total";
  grandTotalLabel.style.border = "1px solid black";
  grandTotalLabel.style.fontWeight = "bold";
  grandTotalLabel.style.backgroundColor = "lightgray";
  grandTotalLabel.classList.add("table-cell");
  grandTotalRow.appendChild(grandTotalLabel);

  const grandTotal = document.createElement("td");
  const grandTotalValue = totalSubtotalValue + shippingCostValue + taxCostValue;
  grandTotal.textContent = (Math.round(grandTotalValue * 100) / 100).toFixed(2);
  grandTotal.style.border = "1px solid black";
  grandTotal.style.fontWeight = "bold";
  grandTotal.style.backgroundColor = "lightgray";
  grandTotal.setAttribute("id", "total-cost");
  grandTotal.setAttribute("data-testid", "total-cost");
  grandTotal.classList.add("table-cell");
  grandTotalRow.appendChild(grandTotal);

  table.appendChild(grandTotalRow);
}

function getAndPresentRandomShoppingCartData() {
  return getRandomSimpleShoppingCartData().then((response) => {
    if (response.status === 200) {
      return response.json().then((data) => {
        presentSimpleShoppingCartDataOnUIAsATable(data);
        return data;
      });
    } else {
      console.error("Something went wrong", response);
      invokeActionsOnDifferentStatusCodes(response.status, response);
      return response.json().then((data) => {
        return data;
      });
    }
  });
}
