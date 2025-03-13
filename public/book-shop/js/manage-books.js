document.addEventListener("DOMContentLoaded", async () => {
  const booksGrid = document.getElementById("booksGrid");
  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");
  const modal = document.getElementById("editBookModal");
  const closeBtn = document.querySelector(".close");
  const editForm = document.getElementById("editBookForm");
  const confirmDeleteModal = document.getElementById("confirmDeleteModal");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  let bookToDelete = null;

  let books = [];

  async function loadBooks() {
    try {
      const response = await fetch("/api/books", {
        headers: {
          Authorization: getBearerToken(),
        },
      });
      books = await response.json();
      renderBooks();
    } catch (error) {
      console.error("Error loading books:", error);
      showSimpleAlert("Failed to load books", 2);
    }
  }

  function renderBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    const filteredBooks = books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm) || book.description.toLowerCase().includes(searchTerm);
      const matchesFilter =
        filterValue === "all" ||
        (filterValue === "active" && !book.inactive) ||
        (filterValue === "inactive" && book.inactive);
      return matchesSearch && matchesFilter;
    });

    booksGrid.innerHTML = filteredBooks
      .map(
        (book) => `
            <div class="book-card ${book.inactive ? "inactive" : "active"}">
                <div class="book-info">
                    <img src="${book.cover || "/data/book-covers/default-cover.jpg"}" 
                         alt="${book.title}" 
                         class="book-cover">
                    <div class="book-content">
                        <h3>${book.title}</h3>
                        <p>${book.description}</p>
                        <span class="status-badge ${book.inactive ? "inactive" : "active"}">
                            ${book.inactive ? "Inactive" : "Active"}
                        </span>
                    </div>
                </div>
                <div class="book-actions">
                    <button onclick="editBook('${book.id}')" class="book-shop-button-primary thin">
                        Edit
                    </button>
                    <button onclick="deleteBook('${book.id}')" 
                            class="book-shop-button-primary thin red">
                        Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  window.editBook = async (bookId) => {
    const book = books.find((b) => `${b.id}` === `${bookId}`);
    if (book) {
      document.getElementById("bookId").value = book.id;
      document.getElementById("editTitle").value = book.title;
      document.getElementById("editDescription").value = book.description;
      modal.style.display = "block";
    }
  };

  window.deleteBook = async (bookId) => {
    bookToDelete = bookId;
    confirmDeleteModal.style.display = "block";
  };

  async function performDelete() {
    try {
      const response = await fetch(`/api/books/${bookToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBearerToken(),
        },
      });

      if (response.ok) {
        showSimpleAlert("Book deleted successfully!", 0);
        await loadBooks();
      } else {
        const error = await response.json();
        showSimpleAlert(`Failed to delete book: ${error.message}`, 2);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      showSimpleAlert("Failed to delete book", 2);
    } finally {
      confirmDeleteModal.style.display = "none";
      bookToDelete = null;
    }
  }

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bookId = document.getElementById("bookId").value;
    const updateData = {
      title: document.getElementById("editTitle").value,
      description: document.getElementById("editDescription").value,
    };

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBearerToken(),
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showSimpleAlert("Book updated successfully!", 0);
        modal.style.display = "none";
        await loadBooks();
      } else {
        const error = await response.json();
        showSimpleAlert(`Failed to update book: ${error.message}`, 2);
      }
    } catch (error) {
      console.error("Error updating book:", error);
      showSimpleAlert("Failed to update book", 2);
    }
  });

  searchInput.addEventListener("input", renderBooks);
  filterSelect.addEventListener("change", renderBooks);
  closeBtn.addEventListener("click", () => (modal.style.display = "none"));
  confirmDeleteBtn.addEventListener("click", performDelete);
  cancelDeleteBtn.addEventListener("click", () => {
    confirmDeleteModal.style.display = "none";
    bookToDelete = null;
  });

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
    if (event.target === confirmDeleteModal) {
      confirmDeleteModal.style.display = "none";
      bookToDelete = null;
    }
  };

  await loadBooks();
});
