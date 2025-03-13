document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("addBookForm");
  const authorSelect = document.getElementById("author");
  const genreSelect = document.getElementById("genre");

  const styleMultiSelect = (select) => {
    select.classList.add("multi-select");
    select.style.width = "100%";
    select.style.minHeight = "38px";
    select.style.padding = "4px";
  };

  async function loadAuthors() {
    try {
      const response = await fetch("/api/book-authors", {
        headers: {
          Authorization: getBearerToken(),
        },
      });
      const authors = await response.json();

      authors.forEach((author) => {
        const option = document.createElement("option");
        option.value = author.id;
        option.textContent = `${author.name} (${author.country})`;
        authorSelect.appendChild(option);
      });

      styleMultiSelect(authorSelect);
    } catch (error) {
      console.error("Error loading authors:", error);
      showSimpleAlert("Failed to load authors", 2);
    }
  }

  async function loadGenres() {
    try {
      const response = await fetch("/api/book-genres", {
        headers: {
          Authorization: getBearerToken(),
        },
      });
      const genres = await response.json();

      genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });

      styleMultiSelect(genreSelect);
    } catch (error) {
      console.error("Error loading genres:", error);
      showSimpleAlert("Failed to load genres", 2);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const coverFile = formData.get("cover");
    let coverFileName = "";
    if (coverFile.size > 0) {
      const imageData = new FormData();
      imageData.append("file", coverFile);
      try {
        const uploadResponse = await fetch("/api/book-shop/upload/cover", {
          method: "POST",
          headers: {
            Authorization: getBearerToken(),
          },
          body: imageData,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          showSimpleAlert("Cover image uploaded successfully!", 0);
          coverFileName = uploadResult.file;
        }
      } catch (error) {
        console.error("Error uploading cover:", error);
        showSimpleAlert("Failed to upload cover image", 2);
        return;
      }
    }

    const published_at = new Date(formData.get("published_at")).toISOString();

    const bookData = {
      title: formData.get("title"),
      author_ids: Array.from(authorSelect.selectedOptions).map((option) => Number(option.value)),
      genre_ids: Array.from(genreSelect.selectedOptions).map((option) => Number(option.value)),
      language: formData.get("language"),
      pages: Number(formData.get("pages")),
      published_at: published_at,
      description: formData.get("description"),
      cover: coverFileName,
    };

    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getBearerToken(),
        },
        body: JSON.stringify(bookData),
      });

      if (response.ok) {
        showSimpleAlert("Book added successfully!", 0);
        form.reset();
        authorSelect.selectedIndex = -1;
        genreSelect.selectedIndex = -1;
      } else {
        const error = await response.json();
        showSimpleAlert(`Failed to add book: ${error.message}`, 2);
      }
    } catch (error) {
      console.error("Error adding book:", error);
      showSimpleAlert("Failed to add book", 2);
    }
  });

  await Promise.all([loadAuthors(), loadGenres()]);
});
