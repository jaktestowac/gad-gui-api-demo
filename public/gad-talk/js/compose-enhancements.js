/**
 * GadTalk Compose Enhancements
 * Emoji picker, mention/hashtag autocomplete, and character ring
 */

const GadTalkComposeEnhancements = (function () {
  let featureFlags = {};

  // ==================== EMOJI PICKER ====================

  const EMOJI_CATEGORIES = {
    smileys: {
      name: "Smileys",
      icon: "😀",
      emojis: [
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "🤣",
        "😂",
        "🙂",
        "🙃",
        "😉",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "😚",
        "😙",
        "🥲",
        "😋",
        "😛",
        "😜",
        "🤪",
        "😝",
        "🤑",
        "🤗",
        "🤭",
        "🤫",
        "🤔",
        "🤐",
        "🤨",
        "😐",
        "😑",
        "😶",
        "😏",
        "😒",
        "🙄",
        "😬",
        "😮‍💨",
        "🤥",
        "😌",
        "😔",
        "😪",
        "🤤",
        "😴",
        "😷",
        "🤒",
        "🤕",
        "🤢",
        "🤮",
        "🤧",
        "🥵",
        "🥶",
        "🥴",
        "😵",
        "🤯",
        "🤠",
        "🥳",
        "🥸",
        "😎",
        "🤓",
        "🧐",
        "😕",
        "😟",
        "🙁",
        "☹️",
        "😮",
        "😯",
        "😲",
        "😳",
        "🥺",
        "😦",
        "😧",
        "😨",
        "😰",
        "😥",
        "😢",
        "😭",
      ],
    },
    gestures: {
      name: "Gestures",
      icon: "👍",
      emojis: [
        "👋",
        "🤚",
        "🖐️",
        "✋",
        "🖖",
        "👌",
        "🤌",
        "🤏",
        "✌️",
        "🤞",
        "🤟",
        "🤘",
        "🤙",
        "👈",
        "👉",
        "👆",
        "🖕",
        "👇",
        "☝️",
        "👍",
        "👎",
        "✊",
        "👊",
        "🤛",
        "🤜",
        "👏",
        "🙌",
        "👐",
        "🤲",
        "🤝",
        "🙏",
        "✍️",
        "💅",
        "🤳",
        "💪",
        "🦾",
        "🦿",
        "🦵",
        "🦶",
        "👂",
      ],
    },
    hearts: {
      name: "Hearts",
      icon: "❤️",
      emojis: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
        "♥️",
      ],
    },
    animals: {
      name: "Animals",
      icon: "🦎",
      emojis: [
        "🦎",
        "🐶",
        "🐱",
        "🐭",
        "🐹",
        "🐰",
        "🦊",
        "🐻",
        "🐼",
        "🐨",
        "🐯",
        "🦁",
        "🐮",
        "🐷",
        "🐸",
        "🐵",
        "🐔",
        "🐧",
        "🐦",
        "🐤",
        "🦆",
        "🦅",
        "🦉",
        "🦇",
        "🐺",
        "🐗",
        "🐴",
        "🦄",
        "🐝",
        "🐛",
        "🦋",
        "🐌",
        "🐞",
        "🐜",
        "🦟",
        "🦗",
        "🕷️",
        "🦂",
        "🐢",
        "🐍",
      ],
    },
    objects: {
      name: "Objects",
      icon: "💻",
      emojis: [
        "💻",
        "🖥️",
        "🖨️",
        "⌨️",
        "🖱️",
        "🖲️",
        "💽",
        "💾",
        "💿",
        "📀",
        "📱",
        "📲",
        "☎️",
        "📞",
        "📟",
        "📠",
        "🔋",
        "🔌",
        "💡",
        "🔦",
        "🕯️",
        "🧯",
        "🛢️",
        "💸",
        "💵",
        "💴",
        "💶",
        "💷",
        "💰",
        "💳",
        "💎",
        "⚖️",
        "🧰",
        "🔧",
        "🔨",
        "⚒️",
        "🛠️",
        "⛏️",
        "🔩",
        "⚙️",
      ],
    },
    symbols: {
      name: "Symbols",
      icon: "✅",
      emojis: [
        "✅",
        "❌",
        "❓",
        "❗",
        "‼️",
        "⁉️",
        "💯",
        "🔥",
        "✨",
        "⭐",
        "🌟",
        "💫",
        "💥",
        "💢",
        "💦",
        "💨",
        "🕳️",
        "💣",
        "💬",
        "👁️‍🗨️",
        "🗨️",
        "🗯️",
        "💭",
        "💤",
        "🔴",
        "🟠",
        "🟡",
        "🟢",
        "🔵",
        "🟣",
        "⚫",
        "⚪",
        "🟤",
        "🔺",
        "🔻",
        "🔶",
        "🔷",
        "🔸",
        "🔹",
        "▪️",
      ],
    },
  };

  const RECENT_EMOJIS_KEY = "gadtalk_recent_emojis";
  const MAX_RECENT_EMOJIS = 20;

  function getRecentEmojis() {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function addRecentEmoji(emoji) {
    let recent = getRecentEmojis();
    recent = recent.filter((e) => e !== emoji);
    recent.unshift(emoji);
    recent = recent.slice(0, MAX_RECENT_EMOJIS);
    try {
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent));
    } catch {
      // Ignore storage errors
    }
    return recent;
  }

  function createEmojiPicker(textareaId, buttonId) {
    if (!featureFlags.emoji_picker) return;

    const textarea = document.getElementById(textareaId);
    const button = document.getElementById(buttonId);
    if (!textarea || !button) return;

    // Create picker element
    const picker = document.createElement("div");
    picker.className = "gt-emoji-picker gt-hidden";
    picker.setAttribute("data-testid", "emoji-picker");

    // Build picker HTML
    let pickerHtml = `
      <div class="gt-emoji-picker-header">
        <input type="text" class="gt-emoji-search" placeholder="Search emojis..." data-testid="emoji-search" />
      </div>
      <div class="gt-emoji-tabs">
    `;

    // Add recent tab
    pickerHtml += `<button type="button" class="gt-emoji-tab gt-emoji-tab-active" data-category="recent" title="Recent">🕐</button>`;

    // Add category tabs
    Object.entries(EMOJI_CATEGORIES).forEach(([key, category]) => {
      pickerHtml += `<button type="button" class="gt-emoji-tab" data-category="${key}" title="${category.name}">${category.icon}</button>`;
    });

    pickerHtml += `</div><div class="gt-emoji-content" data-testid="emoji-content">`;

    // Add recent section
    const recentEmojis = getRecentEmojis();
    pickerHtml += `
      <div class="gt-emoji-section" data-section="recent">
        <div class="gt-emoji-section-title">Recent</div>
        <div class="gt-emoji-grid">
          ${
            recentEmojis.length > 0
              ? recentEmojis
                  .map((e) => `<button type="button" class="gt-emoji-btn" data-emoji="${e}">${e}</button>`)
                  .join("")
              : '<span class="gt-text-secondary gt-text-sm">None</span>'
          }
        </div>
      </div>
    `;

    // Add category sections (hidden by default)
    Object.entries(EMOJI_CATEGORIES).forEach(([key, category]) => {
      pickerHtml += `
        <div class="gt-emoji-section gt-hidden" data-section="${key}">
          <div class="gt-emoji-section-title">${category.name}</div>
          <div class="gt-emoji-grid">
            ${category.emojis
              .map((e) => `<button type="button" class="gt-emoji-btn" data-emoji="${e}">${e}</button>`)
              .join("")}
          </div>
        </div>
      `;
    });

    pickerHtml += `</div>`;
    picker.innerHTML = pickerHtml;

    // Position picker relative to button - wrap button in a container for positioning
    const wrapper = document.createElement("div");
    wrapper.className = "gt-emoji-picker-wrapper";
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    button.parentNode.insertBefore(wrapper, button);
    wrapper.appendChild(button);
    wrapper.appendChild(picker);

    // Event handlers
    let isOpen = false;

    function openPicker() {
      picker.classList.remove("gt-hidden");
      isOpen = true;
      // Refresh recent emojis
      updateRecentSection();
    }

    function closePicker() {
      picker.classList.add("gt-hidden");
      isOpen = false;
    }

    function updateRecentSection() {
      const recentSection = picker.querySelector('[data-section="recent"] .gt-emoji-grid');
      if (recentSection) {
        const recent = getRecentEmojis();
        recentSection.innerHTML =
          recent.length > 0
            ? recent.map((e) => `<button type="button" class="gt-emoji-btn" data-emoji="${e}">${e}</button>`).join("")
            : '<span class="gt-text-secondary gt-text-sm">None</span>';
      }
    }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        closePicker();
      } else {
        openPicker();
      }
    });

    // Tab switching
    picker.querySelectorAll(".gt-emoji-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const category = tab.dataset.category;

        // Update active tab
        picker.querySelectorAll(".gt-emoji-tab").forEach((t) => t.classList.remove("gt-emoji-tab-active"));
        tab.classList.add("gt-emoji-tab-active");

        // Show corresponding section
        picker.querySelectorAll(".gt-emoji-section").forEach((section) => {
          section.classList.toggle("gt-hidden", section.dataset.section !== category);
        });
      });
    });

    // Emoji click
    picker.addEventListener("click", (e) => {
      const emojiBtn = e.target.closest(".gt-emoji-btn");
      if (emojiBtn) {
        e.preventDefault();
        e.stopPropagation();
        const emoji = emojiBtn.dataset.emoji;
        insertTextAtCursor(textarea, emoji);
        addRecentEmoji(emoji);
        closePicker();
        textarea.focus();
        // Trigger input event for character count
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Search
    const searchInput = picker.querySelector(".gt-emoji-search");
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      if (!query) {
        // Show tabs and reset to recent
        picker.querySelector(".gt-emoji-tabs").style.display = "";
        picker.querySelectorAll(".gt-emoji-section").forEach((section) => {
          section.classList.toggle("gt-hidden", section.dataset.section !== "recent");
        });
        picker.querySelector('[data-category="recent"]').click();
        return;
      }

      // Hide tabs during search
      picker.querySelector(".gt-emoji-tabs").style.display = "none";

      // Show all sections and filter emojis
      picker.querySelectorAll(".gt-emoji-section").forEach((section) => {
        if (section.dataset.section === "recent") {
          section.classList.add("gt-hidden");
          return;
        }
        section.classList.remove("gt-hidden");
        section.querySelectorAll(".gt-emoji-btn").forEach((btn) => {
          const matches = btn.dataset.emoji.includes(query);
          btn.style.display = matches ? "" : "none";
        });
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (isOpen && !picker.contains(e.target) && e.target !== button) {
        closePicker();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        closePicker();
      }
    });
  }

  // ==================== MENTION AUTOCOMPLETE ====================

  let mentionDebounceTimer = null;

  function createMentionAutocomplete(textareaId) {
    if (!featureFlags.mention_autocomplete) return;

    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const dropdown = document.createElement("div");
    dropdown.className = "gt-autocomplete-dropdown gt-hidden";
    dropdown.setAttribute("data-testid", "mention-autocomplete");
    textarea.parentElement.style.position = "relative";
    textarea.parentElement.appendChild(dropdown);

    let isOpen = false;
    let selectedIndex = -1;
    let currentQuery = "";
    let currentStartPos = -1;

    function openDropdown(items) {
      if (items.length === 0) {
        closeDropdown();
        return;
      }

      dropdown.innerHTML = items
        .map(
          (user, i) => `
        <div class="gt-autocomplete-item ${
          i === 0 ? "gt-autocomplete-item-selected" : ""
        }" data-index="${i}" data-username="${user.username}">
          <img src="${user.avatar || "/gad-talk/images/default-avatar.png"}" class="gt-avatar gt-avatar-sm" alt="" />
          <div class="gt-autocomplete-item-info">
            <span class="gt-autocomplete-item-name">${user.displayName || user.username}</span>
            <span class="gt-autocomplete-item-username">@${user.username}</span>
          </div>
        </div>
      `
        )
        .join("");

      dropdown.classList.remove("gt-hidden");
      isOpen = true;
      selectedIndex = 0;
    }

    function closeDropdown() {
      dropdown.classList.add("gt-hidden");
      dropdown.innerHTML = "";
      isOpen = false;
      selectedIndex = -1;
      currentQuery = "";
      currentStartPos = -1;
    }

    function selectItem(username) {
      const beforeMention = textarea.value.substring(0, currentStartPos);
      const afterCursor = textarea.value.substring(textarea.selectionStart);
      textarea.value = beforeMention + "@" + username + " " + afterCursor;
      const newPos = currentStartPos + username.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      closeDropdown();
      textarea.focus();
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    async function searchUsers(query) {
      try {
        const response = await window.GadTalkAPI.users.search(query, 1, 6);
        return response?.users || [];
      } catch {
        return [];
      }
    }

    textarea.addEventListener("input", () => {
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;

      // Find @ before cursor
      let mentionStart = -1;
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === "@") {
          // Check if preceded by space or start of text
          if (i === 0 || /\s/.test(text[i - 1])) {
            mentionStart = i;
          }
          break;
        }
        if (/\s/.test(text[i])) break;
      }

      if (mentionStart === -1) {
        closeDropdown();
        return;
      }

      const query = text.substring(mentionStart + 1, cursorPos);
      if (query.length < 1) {
        closeDropdown();
        return;
      }

      currentStartPos = mentionStart;
      currentQuery = query;

      clearTimeout(mentionDebounceTimer);
      mentionDebounceTimer = setTimeout(async () => {
        const users = await searchUsers(query);
        openDropdown(users);
      }, 200);
    });

    textarea.addEventListener("keydown", (e) => {
      if (!isOpen) return;

      const items = dropdown.querySelectorAll(".gt-autocomplete-item");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        items.forEach((item, i) => {
          item.classList.toggle("gt-autocomplete-item-selected", i === selectedIndex);
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        items.forEach((item, i) => {
          item.classList.toggle("gt-autocomplete-item-selected", i === selectedIndex);
        });
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          selectItem(items[selectedIndex].dataset.username);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      }
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".gt-autocomplete-item");
      if (item) {
        selectItem(item.dataset.username);
      }
    });

    document.addEventListener("click", (e) => {
      if (isOpen && !dropdown.contains(e.target) && e.target !== textarea) {
        closeDropdown();
      }
    });
  }

  // ==================== HASHTAG AUTOCOMPLETE ====================

  let hashtagDebounceTimer = null;

  function createHashtagAutocomplete(textareaId) {
    if (!featureFlags.hashtag_autocomplete) return;

    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    // Check if mention autocomplete already added a dropdown
    let dropdown = textarea.parentElement.querySelector(".gt-autocomplete-dropdown-hashtag");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.className = "gt-autocomplete-dropdown gt-autocomplete-dropdown-hashtag gt-hidden";
      dropdown.setAttribute("data-testid", "hashtag-autocomplete");
      textarea.parentElement.style.position = "relative";
      textarea.parentElement.appendChild(dropdown);
    }

    let isOpen = false;
    let selectedIndex = -1;
    let currentQuery = "";
    let currentStartPos = -1;

    function openDropdown(items) {
      if (items.length === 0) {
        closeDropdown();
        return;
      }

      dropdown.innerHTML = items
        .map(
          (tag, i) => `
        <div class="gt-autocomplete-item ${
          i === 0 ? "gt-autocomplete-item-selected" : ""
        }" data-index="${i}" data-hashtag="${tag.tag}">
          <span class="gt-autocomplete-hashtag-icon">#</span>
          <div class="gt-autocomplete-item-info">
            <span class="gt-autocomplete-item-name">${tag.tag}</span>
            <span class="gt-autocomplete-item-count">${tag.count || 0} gads</span>
          </div>
        </div>
      `
        )
        .join("");

      dropdown.classList.remove("gt-hidden");
      isOpen = true;
      selectedIndex = 0;
    }

    function closeDropdown() {
      dropdown.classList.add("gt-hidden");
      dropdown.innerHTML = "";
      isOpen = false;
      selectedIndex = -1;
      currentQuery = "";
      currentStartPos = -1;
    }

    function selectItem(hashtag) {
      const beforeHashtag = textarea.value.substring(0, currentStartPos);
      const afterCursor = textarea.value.substring(textarea.selectionStart);
      textarea.value = beforeHashtag + "#" + hashtag + " " + afterCursor;
      const newPos = currentStartPos + hashtag.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      closeDropdown();
      textarea.focus();
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    async function searchHashtags(query) {
      try {
        const response = await window.GadTalkAPI.hashtags.getTrending(10);
        const trending = response?.hashtags || [];
        // Filter by query
        if (query) {
          return trending.filter((h) => h.tag.toLowerCase().includes(query.toLowerCase()));
        }
        return trending;
      } catch {
        return [];
      }
    }

    textarea.addEventListener("input", (e) => {
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;

      // Find # before cursor
      let hashtagStart = -1;
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === "#") {
          // Check if preceded by space or start of text
          if (i === 0 || /\s/.test(text[i - 1])) {
            hashtagStart = i;
          }
          break;
        }
        if (/\s/.test(text[i])) break;
      }

      if (hashtagStart === -1) {
        closeDropdown();
        return;
      }

      const query = text.substring(hashtagStart + 1, cursorPos);
      currentStartPos = hashtagStart;
      currentQuery = query;

      clearTimeout(hashtagDebounceTimer);
      hashtagDebounceTimer = setTimeout(async () => {
        const hashtags = await searchHashtags(query);
        openDropdown(hashtags);
      }, 200);
    });

    textarea.addEventListener("keydown", (e) => {
      if (!isOpen) return;

      const items = dropdown.querySelectorAll(".gt-autocomplete-item");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        items.forEach((item, i) => {
          item.classList.toggle("gt-autocomplete-item-selected", i === selectedIndex);
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        items.forEach((item, i) => {
          item.classList.toggle("gt-autocomplete-item-selected", i === selectedIndex);
        });
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          selectItem(items[selectedIndex].dataset.hashtag);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      }
    });

    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".gt-autocomplete-item");
      if (item) {
        selectItem(item.dataset.hashtag);
      }
    });

    document.addEventListener("click", (e) => {
      if (isOpen && !dropdown.contains(e.target) && e.target !== textarea) {
        closeDropdown();
      }
    });
  }

  // ==================== CHARACTER COUNTDOWN RING ====================

  function createCharacterRing(charCountId, textareaId, maxLength = 280) {
    if (!featureFlags.char_ring) return;

    const charCount = document.getElementById(charCountId);
    const textarea = document.getElementById(textareaId);
    if (!charCount || !textarea) return;

    // Create ring container
    const ringContainer = document.createElement("div");
    ringContainer.className = "gt-char-ring-container";
    ringContainer.setAttribute("data-testid", "char-ring");

    const ringSize = 30;
    const strokeWidth = 3;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    ringContainer.innerHTML = `
      <svg class="gt-char-ring" width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}">
        <circle 
          class="gt-char-ring-bg" 
          cx="${ringSize / 2}" 
          cy="${ringSize / 2}" 
          r="${radius}" 
          fill="none" 
          stroke="var(--gt-border)" 
          stroke-width="${strokeWidth}"
        />
        <circle 
          class="gt-char-ring-progress" 
          cx="${ringSize / 2}" 
          cy="${ringSize / 2}" 
          r="${radius}" 
          fill="none" 
          stroke="var(--gt-primary)" 
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          transform="rotate(-90 ${ringSize / 2} ${ringSize / 2})"
        />
      </svg>
      <span class="gt-char-ring-count">${maxLength}</span>
    `;

    // Replace char count with ring
    charCount.parentElement.insertBefore(ringContainer, charCount);
    charCount.classList.add("gt-hidden");

    const progressCircle = ringContainer.querySelector(".gt-char-ring-progress");
    const countDisplay = ringContainer.querySelector(".gt-char-ring-count");

    function updateRing() {
      const length = textarea.value.length;
      const remaining = maxLength - length;
      const progress = length / maxLength;
      const offset = circumference - progress * circumference;

      progressCircle.style.strokeDashoffset = offset;

      // Color based on remaining
      if (remaining < 0) {
        progressCircle.style.stroke = "var(--gt-error)";
        countDisplay.style.color = "var(--gt-error)";
        countDisplay.textContent = remaining;
      } else if (remaining <= 20) {
        progressCircle.style.stroke = "var(--gt-warning)";
        countDisplay.style.color = "var(--gt-warning)";
        countDisplay.textContent = remaining;
      } else if (remaining <= 40) {
        progressCircle.style.stroke = "var(--gt-warning)";
        countDisplay.style.color = "var(--gt-text-secondary)";
        countDisplay.textContent = "";
      } else {
        progressCircle.style.stroke = "var(--gt-primary)";
        countDisplay.style.color = "var(--gt-text-secondary)";
        countDisplay.textContent = "";
      }

      // Show count in last 40 chars
      if (remaining <= 40) {
        countDisplay.textContent = remaining;
      }
    }

    textarea.addEventListener("input", updateRing);
    updateRing();
  }

  // ==================== UTILITY FUNCTIONS ====================

  function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    const newPos = start + text.length;
    textarea.setSelectionRange(newPos, newPos);
  }

  // ==================== INITIALIZATION ====================

  async function loadFeatureFlags() {
    if (!window.GadTalkAPI || !window.GadTalkAPI.featureFlags) return {};
    try {
      const response = await window.GadTalkAPI.featureFlags.getAll();
      const flags = response?.data || response?.flags || response || [];
      return flags.reduce((acc, flag) => {
        acc[String(flag.key || "").toLowerCase()] = !!flag.enabled;
        return acc;
      }, {});
    } catch {
      return {};
    }
  }

  function setFeatureFlags(flags) {
    featureFlags = flags || {};
  }

  async function init(textareaId, charCountId, emojiButtonId) {
    // Load feature flags if not already set
    if (Object.keys(featureFlags).length === 0) {
      featureFlags = await loadFeatureFlags();
    }

    // Initialize emoji picker
    if (emojiButtonId) {
      createEmojiPicker(textareaId, emojiButtonId);
    }

    // Initialize mention autocomplete
    createMentionAutocomplete(textareaId);

    // Initialize hashtag autocomplete
    createHashtagAutocomplete(textareaId);

    // Initialize character ring
    if (charCountId) {
      createCharacterRing(charCountId, textareaId);
    }
  }

  return {
    init,
    setFeatureFlags,
    createEmojiPicker,
    createMentionAutocomplete,
    createHashtagAutocomplete,
    createCharacterRing,
    loadFeatureFlags,
  };
})();

// Export for use in other scripts
window.GadTalkComposeEnhancements = GadTalkComposeEnhancements;
