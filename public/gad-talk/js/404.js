// Handle go back button
document.addEventListener("DOMContentLoaded", function () {
  const goBackBtn = document.getElementById("go-back-btn");
  if (goBackBtn) {
    goBackBtn.addEventListener("click", function () {
      window.history.back();
    });
  }
});
