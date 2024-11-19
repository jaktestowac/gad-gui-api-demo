async function getRandomSimpleUserData() {
  return fetch(`/api/v1/data/random/simple-user`, {
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

function presentSimpleUserDataOnUI(userData) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";

  const userContainer = document.createElement("div");
  userContainer.classList.add("user-container");

  const userImageContainer = document.createElement("div");
  const userImage = document.createElement("img");
  userImage.src = `../data/users/${userData.profilePicture}`;
  userImage.alt = `${userData.firstName} ${userData.lastName}`;
  userImage.classList.add("user-image");
  userImageContainer.appendChild(userImage);

  const userInfoContainer = document.createElement("div");
  const userFullName = document.createElement("h2");
  userFullName.textContent = `${userData.firstName} ${userData.lastName}`;
  userInfoContainer.appendChild(userFullName);

  const userUsername = document.createElement("p");
  const userUsernameLabel = document.createElement("span");
  userUsernameLabel.classList.add("user-label");
  userUsernameLabel.textContent = "Username:";
  const userUsernameValue = document.createElement("span");
  userUsernameValue.textContent = userData.username;
  userUsername.appendChild(userUsernameLabel);
  userUsername.appendChild(userUsernameValue);

  userInfoContainer.appendChild(userUsername);

  const userEmail = document.createElement("p");
  const userEmailLabel = document.createElement("span");
  userEmailLabel.classList.add("user-label");
  userEmailLabel.textContent = "Email:";
  const userEmailValue = document.createElement("span");
  userEmailValue.textContent = userData.email;
  userEmail.appendChild(userEmailLabel);
  userEmail.appendChild(userEmailValue);
  userInfoContainer.appendChild(userEmail);

  const userPhone = document.createElement("p");
  const userPhoneLabel = document.createElement("span");
  userPhoneLabel.classList.add("user-label");
  userPhoneLabel.textContent = "Phone:";
  const userPhoneValue = document.createElement("span");
  userPhoneValue.textContent = userData.phone || "N/A";
  userPhone.appendChild(userPhoneLabel);
  userPhone.appendChild(userPhoneValue);
  userInfoContainer.appendChild(userPhone);

  const userDateOfBirth = document.createElement("p");
  const userDateOfBirthLabel = document.createElement("span");
  userDateOfBirthLabel.classList.add("user-label");
  userDateOfBirthLabel.textContent = "Date of Birth:";
  const userDateOfBirthValue = document.createElement("span");

  if (userData.dateOfBirth === undefined) {
    userDateOfBirthValue.innerHTML = undefined;
  } else {
    userDateOfBirthValue.textContent = new Date(userData.dateOfBirth).toLocaleDateString();
  }
  userDateOfBirth.appendChild(userDateOfBirthLabel);
  userDateOfBirth.appendChild(userDateOfBirthValue);
  userInfoContainer.appendChild(userDateOfBirth);

  const userAge = document.createElement("p");
  const userAgeLabel = document.createElement("span");
  userAgeLabel.classList.add("user-label");
  userAgeLabel.textContent = "Age:";
  const userAgeValue = document.createElement("span");
  if (userData.dateOfBirth === undefined) {
    userAgeValue.innerHTML = undefined;
  } else {
    userAgeValue.textContent = new Date().getFullYear() - new Date(userData.dateOfBirth).getFullYear();
  }
  userAge.appendChild(userAgeLabel);
  userAge.appendChild(userAgeValue);
  userInfoContainer.appendChild(userAge);

  const userAddress = document.createElement("p");
  const userAddressLabel = document.createElement("span");
  userAddressLabel.classList.add("user-label");
  userAddressLabel.textContent = "Address:";
  const userAddressValue = document.createElement("span");
  userAddressValue.textContent = `${userData.address.street}, ${userData.address.city}, ${userData.address.postalCode}, ${userData.address.country}`;
  userAddress.appendChild(userAddressLabel);
  userAddress.appendChild(userAddressValue);
  userInfoContainer.appendChild(userAddress);

  const userLastLogin = document.createElement("p");
  const userLastLoginLabel = document.createElement("span");
  userLastLoginLabel.classList.add("user-label");
  userLastLoginLabel.textContent = "Last Login:";
  const userLastLoginValue = document.createElement("span");
  userLastLoginValue.textContent = new Date(userData.lastLogin).toLocaleDateString();
  userLastLogin.appendChild(userLastLoginLabel);
  userLastLogin.appendChild(userLastLoginValue);
  userInfoContainer.appendChild(userLastLogin);

  const userAccountCreated = document.createElement("p");
  const userAccountCreatedLabel = document.createElement("span");
  userAccountCreatedLabel.classList.add("user-label");
  userAccountCreatedLabel.textContent = "Account Created:";
  const userAccountCreatedValue = document.createElement("span");

  // get only the date
  userAccountCreatedValue.textContent = new Date(userData.accountCreated).toLocaleDateString();
  userAccountCreated.appendChild(userAccountCreatedLabel);
  userAccountCreated.appendChild(userAccountCreatedValue);
  userInfoContainer.appendChild(userAccountCreated);

  const userStatus = document.createElement("p");
  const userStatusLabel = document.createElement("span");
  userStatusLabel.classList.add("user-label");
  userStatusLabel.textContent = "Status:";
  const userStatusValue = document.createElement("span");
  userStatusValue.classList.add("status-label");
  userStatusValue.textContent = userData.status;
  userStatus.appendChild(userStatusLabel);
  userStatus.appendChild(userStatusValue);
  userInfoContainer.appendChild(userStatus);

  userContainer.appendChild(userImageContainer);
  userContainer.appendChild(userInfoContainer);
  resultsContainer.appendChild(userContainer);
}

function getAndPresentRandomUserData() {
  getRandomSimpleUserData().then((data) => {
    presentSimpleUserDataOnUI(data);
  });
}
