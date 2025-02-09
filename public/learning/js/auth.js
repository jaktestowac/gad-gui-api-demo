document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);

    const inputs = {
      firstName: document.getElementById("firstNameInput"),
      lastName: document.getElementById("lastNameInput"),
      username: document.getElementById("usernameInput"),
      email: document.getElementById("emailInput"),
      password: document.getElementById("passwordInput"),
      confirmPassword: document.getElementById("confirmPasswordInput"),
    };

    Object.entries(inputs).forEach(([field, input]) => {
      if (input) {
        input.addEventListener("input", () => {
          const formGroup = input.closest(".form-group");
          formGroup.classList.remove("error");
          const errorMsg = formGroup.querySelector(".error-message");
          if (errorMsg) errorMsg.remove();

          switch (field) {
            case "firstName":
            case "lastName":
              if (!validateName(input.value)) {
                showFieldError(input.id, "Must be at least 2 characters, letters only");
              }
              break;
            case "username":
              if (!validateUsername(input.value)) {
                showFieldError(input.id, "At least 3 characters, letters, numbers, underscore only");
              }
              break;
            case "email":
              if (!validateEmail(input.value)) {
                showFieldError(input.id, "Please enter a valid email address");
              }
              break;
            case "password":
              if (!validatePassword(input.value)) {
                showFieldError(input.id, "At least 1 character is required");
              } else if (inputs.confirmPassword.value) {
                validatePasswordMatch(input.value, inputs.confirmPassword.value);
              }
              break;
            case "confirmPassword":
              if (input.value) {
                validatePasswordMatch(inputs.password.value, input.value);
              }
              break;
          }
        });
      }
    });

    const formFields = {
      firstName: {
        input: document.getElementById("firstNameInput"),
        validator: validateName,
        message: "First name must be at least 2 characters and contain only letters, spaces, and hyphens",
      },
      lastName: {
        input: document.getElementById("lastNameInput"),
        validator: validateName,
        message: "Last name must be at least 2 characters and contain only letters, spaces, and hyphens",
      },
      username: {
        input: document.getElementById("usernameInput"),
        validator: validateUsername,
        message: "Username must be at least 3 characters and contain only letters, numbers, and underscores",
      },
      email: {
        input: document.getElementById("emailInput"),
        validator: validateEmail,
        message: "Please enter a valid email address",
      },
      password: {
        input: document.getElementById("passwordInput"),
        validator: validatePassword,
        message: "Password must be at least 1 character long",
      },
      confirmPassword: {
        input: document.getElementById("confirmPasswordInput"),
        validator: (value) => value === document.getElementById("passwordInput").value,
        message: "Passwords do not match",
      },
    };

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      Object.values(formFields).forEach((field) => {
        const formGroup = field.input.closest(".form-group");
        formGroup.classList.remove("error", "valid");
        const errorMsg = formGroup.querySelector(".error-message");
        if (errorMsg) errorMsg.remove();
      });

      let isValid = true;
      Object.values(formFields).forEach((field) => {
        const formGroup = field.input.closest(".form-group");
        formGroup.classList.add("touched");

        if (!validateField(field.input, field.validator, field.message)) {
          isValid = false;
          field.input.focus();
          return false;
        }
      });

      if (!isValid) {
        return;
      }

      const form = e.target;
      try {
        const result = await api.register({
          username: formFields.username.input.value,
          email: formFields.email.input.value,
          password: formFields.password.input.value,
          firstName: formFields.firstName.input.value,
          lastName: formFields.lastName.input.value,
          avatar: form.dataset.selectedAvatar || null,
        });

        if (result.success) {
          notifications.show("Registration successful! Redirecting...", "success");
          setTimeout(() => {
            window.location.href = "/learning/login.html";
          }, 1000);
        }
      } catch (error) {
        notifications.show("Registration failed. Please try again.");
      }
    });

    formFields.password.input.addEventListener("input", () => {
      if (formFields.confirmPassword.input.value) {
        validateField(
          formFields.confirmPassword.input,
          formFields.confirmPassword.validator,
          formFields.confirmPassword.message
        );
      }
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("usernameInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
      const result = await api.login(username, password);
      if (result.access_token) {
        notifications.show("Login successful! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = "/learning/dashboard.html";
        }, 1000);
      }
    } catch (error) {
      notifications.show("Login failed. For demo use user: user and password: demo");
    }
  }

  async function handleRegister(e) {
    const form = e.target;
    const username = document.getElementById("usernameInput").value;
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    const firstName = document.getElementById("firstNameInput").value;
    const lastName = document.getElementById("lastNameInput").value;
    const avatar = form.dataset.selectedAvatar || null;

    try {
      const result = await api.register({
        username,
        email,
        password,
        firstName,
        lastName,
        avatar,
      });

      if (result.success) {
        notifications.show("Registration successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "/learning/login.html";
        }, 1000);
      }
    } catch (error) {
      notifications.show("Registration failed. Please try again.");
    }
  }
});

function validateField(inputElement, validatorFn, errorMessage) {
  const formGroup = inputElement.closest(".form-group");
  const existingError = formGroup.querySelector(".error-message");

  if (existingError) {
    existingError.remove();
  }
  formGroup.classList.remove("error", "valid");

  const isValid = validatorFn(inputElement.value);

  if (!isValid) {
    formGroup.classList.add("error");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = errorMessage;
    formGroup.appendChild(errorDiv);
  } else {
    formGroup.classList.add("valid");
  }

  return isValid;
}

function validateUsername(username) {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 1;
}

function validateName(name) {
  return name.length >= 2 && /^[a-zA-Z\s-]+$/.test(name);
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const formGroup = field.closest(".form-group");
  formGroup.classList.add("error");

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  formGroup.appendChild(errorDiv);
}

function handleLogout() {
  document.cookie = "learning_access_token=; path=/; max-age=0";
  document.cookie = "learning_user_id=; path=/; max-age=0";
  document.cookie = "learning_username=; path=/; max-age=0";
  document.cookie = "learning_user_avatar=; path=/; max-age=0";
  document.cookie = "learning_first_name=; path=/; max-age=0";
  document.cookie = "learning_last_name=; path=/; max-age=0";
  window.location.href = "/learning/welcome.html";
}

window.handleLogout = handleLogout;

function validatePasswordMatch(password, confirmPassword) {
  const confirmGroup = document.getElementById("confirmPasswordInput").closest(".form-group");
  const errorMsg = confirmGroup.querySelector(".error-message");
  if (errorMsg) errorMsg.remove();
  confirmGroup.classList.remove("error");

  if (password !== confirmPassword) {
    showFieldError("confirmPasswordInput", "Passwords do not match");
    return false;
  }
  return true;
}
