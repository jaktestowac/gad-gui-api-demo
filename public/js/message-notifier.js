const url = "/api/messages";

async function issueGetMessagesRequest() {
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

function addNotifier(number) {
  const element = document.querySelector(`[data-testid="user-dropdown"]`);

  if (element !== null && element !== undefined && number !== 0 && number !== undefined) {
    const dot = document.createElement("div");
    dot.style.position = "absolute";
    dot.style.bottom = "0";
    dot.style.width = "20px";
    dot.style.height = "20px";
    dot.style.backgroundColor = "red";
    dot.style.borderRadius = "50%";
    dot.style.color = "white";
    dot.style.display = "flex";
    dot.style.justifyContent = "center";
    dot.style.alignItems = "center";
    dot.style.marginLeft = "40px";

    dot.innerText = `${number}`;
    element.appendChild(dot);
  }

  const dropdownContent = document.getElementById("dropdown-content");

  if (dropdownContent !== null && dropdownContent !== undefined) {
    if (number > 0) {
      const newElement = document.createElement("a");
      newElement.textContent = `Message center (${number})`;
      newElement.href = "/messenger.html";

      dropdownContent.insertBefore(newElement, dropdownContent.children[1]);
    } else {
      const newElement = document.createElement("a");
      newElement.textContent = `Message center (0)`;
      newElement.href = "/messenger.html";

      dropdownContent.insertBefore(newElement, dropdownContent.children[1]);
    }
  }
}

// issueGetMessagesRequest()
//   .then((r) => {
//     return r.json();
//   })
//   .then((results) => {
//     // const number = 3;
//     // addNotifier(number);
//   });
