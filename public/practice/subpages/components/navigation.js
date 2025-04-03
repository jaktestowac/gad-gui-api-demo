function createNavigation(containerId) {
  const nav = `
        <nav class="gad-mp-navigation" id="${containerId}" data-testid="${containerId}">
            <button class="gad-mp-nav-toggle" onclick="toggleMobileNav('${containerId}')" aria-label="Toggle navigation">
                <span class="gad-mp-hamburger"></span>
            </button>
            <div class="gad-mp-nav-links">
                <a href="${
                  window.location.pathname.includes("subpages") ? "../" : ""
                }multipage-v1.html" class="gad-mp-nav-link">Main Page</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }home.html?section=main&user=guest" class="gad-mp-nav-link">Home</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }about.html?section=company&year=2024" class="gad-mp-nav-link">About</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }contact.html?dept=support&priority=high" class="gad-mp-nav-link">Contact</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }products.html?category=new&sort=price" class="gad-mp-nav-link">Products</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }gallery.html?view=grid" class="gad-mp-nav-link">Gallery</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }services.html?type=all" class="gad-mp-nav-link">Services</a>
                <a href="${
                  window.location.pathname.includes("subpages") ? "" : "subpages/"
                }faq.html?topic=general" class="gad-mp-nav-link">FAQ</a>
            </div>
        </nav>
    `;
  document.write(nav);
}

function toggleMobileNav(containerId) {
  const nav = document.getElementById(containerId);
  const navLinks = nav.querySelector(".gad-mp-nav-links");
  const toggle = nav.querySelector(".gad-mp-nav-toggle");
  navLinks.classList.toggle("active");
  toggle.classList.toggle("active");
}
