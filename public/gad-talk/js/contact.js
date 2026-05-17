(function () {
  function showMessage(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("gt-hidden");
  }

  function hideMessage(el) {
    if (!el) return;
    el.classList.add("gt-hidden");
  }

  function setButtonLoading(button, loading) {
    if (window.GadTalkUI && window.GadTalkUI.setButtonLoading) {
      window.GadTalkUI.setButtonLoading(button, loading, "Sending...");
      return;
    }

    if (!button) return;
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Sending...";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const NAME_MAX = 80;
  const EMAIL_MAX = 120;
  const SUBJECT_MAX = 120;
  const MESSAGE_MAX = 2000;
  const SUBMIT_TIMEOUT_MS = 8000; // 8s
  const SUBMIT_RETRIES = 2;

  function removeControlChars(str) {
    if (!str) return "";
    let out = "";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // keep printable ASCII and any code >= 32 and not DEL(127)
      if (code >= 32 && code !== 127) {
        out += str.charAt(i);
      } else {
        out += " ";
      }
    }
    return out;
  }

  async function prefillUser() {
    if (!window.gadTalkAuth) return;
    try {
      const user = await window.gadTalkAuth.optionalAuth();
      if (!user) return;

      const nameInput = document.getElementById("contact-name");
      const emailInput = document.getElementById("contact-email");

      if (nameInput && !nameInput.value) {
        nameInput.value = user.displayName || user.username || "";
      }

      if (emailInput && !emailInput.value) {
        emailInput.value = user.email || "";
      }
    } catch (error) {
      // ignore prefill errors silently - non-critical
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const errorEl = document.getElementById("error-message");
    const successEl = document.getElementById("success-message");
    const submitBtn = form.querySelector("button[type=submit]");

    hideMessage(errorEl);
    hideMessage(successEl);

    const payload = {
      name: form.name?.value?.trim(),
      email: form.email?.value?.trim(),
      subject: form.subject?.value?.trim(),
      message: form.message?.value?.trim(),
      source: "gad-talk-contact-page",
    };

    // Basic presence checks
    if (!payload.name || !payload.email || !payload.message) {
      showMessage(errorEl, "Please fill in your name, email, and message.");
      return;
    }

    // Basic format and length checks
    if (!isValidEmail(payload.email) || payload.email.length > EMAIL_MAX) {
      showMessage(errorEl, "Please provide a valid email address (max " + EMAIL_MAX + " chars).");
      return;
    }

    if (payload.name.length > NAME_MAX) {
      showMessage(errorEl, "Name is too long (max " + NAME_MAX + " chars).");
      return;
    }

    if ((payload.subject || "").length > SUBJECT_MAX) {
      showMessage(errorEl, "Subject is too long (max " + SUBJECT_MAX + " chars).");
      return;
    }

    if (payload.message.length > MESSAGE_MAX) {
      showMessage(errorEl, "Message is too long (max " + MESSAGE_MAX + " chars).");
      return;
    }

    // Sanitize control characters from message and subject
    payload.message = removeControlChars(payload.message).trim();
    payload.subject = removeControlChars(payload.subject || "").trim();

    // Prevent double-submit
    if (submitBtn && submitBtn.disabled) return;

    setButtonLoading(submitBtn, true);

    try {
      const res = await window.GadTalkAPI.contact.submit(payload, {
        timeoutMs: SUBMIT_TIMEOUT_MS,
        retries: SUBMIT_RETRIES,
      });
      if (res && res.data && res.data.warning === "audit_log_failed") {
        showMessage(successEl, "Thanks! Your message was received, but logging was temporarily unavailable.");
      } else {
        showMessage(successEl, "Thanks! Your message was logged for the GadTalk team.");
      }
      form.reset();
      prefillUser();
    } catch (error) {
      // Show friendly messages based on status code if available
      if (error && error.status === 429) {
        showMessage(errorEl, "You are sending messages too quickly. Please wait a moment before trying again.");
      } else if (error && error.status === 400) {
        showMessage(errorEl, error.message || "Invalid request. Please check your input.");
      } else {
        showMessage(errorEl, error.message || "Failed to send message. Please try again.");
      }
    } finally {
      setButtonLoading(submitBtn, false);
    }
  }

  function init() {
    const form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", handleSubmit);
    }
    prefillUser();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
