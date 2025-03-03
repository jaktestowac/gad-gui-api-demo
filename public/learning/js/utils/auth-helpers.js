async function checkInstructorAccess() {
  try {
    const user = await api.getCurrentUser();
    if (user?.role !== "instructor" && user?.role !== "admin") {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to check instructor access:", error);
    window.location.href = "dashboard.html";
    return false;
  }
}

window.checkInstructorAccess = checkInstructorAccess;
