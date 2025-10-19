function toggleDemoBanner(project) {
  const demoBanner = document.getElementById("demo-banner");
  if (demoBanner) {
    const isDemo = project?.demo === true;
    demoBanner.classList.toggle("hidden", !isDemo);
  }
}

window.toggleDemoBanner = toggleDemoBanner;
