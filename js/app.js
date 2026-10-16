const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

const searchForm = document.getElementById("hostel-search-form");
const searchQuery = document.getElementById("search-query");
const roomType = document.getElementById("room-type");

const newHostelSearch = document.getElementById("hostel-search-input");
const locationFilter = document.getElementById("hostel-location-filter");
const typeFilter = document.getElementById("hostel-type-filter");
const resetFilters = document.getElementById("hostel-reset-filters");
const resultsCount = document.getElementById("hostel-results-count");

const hostelCards = [...document.querySelectorAll(".hostel-card")];
const emptyState = document.getElementById("empty-state");
const searchNote = document.getElementById("search-note");

const listingDialog = document.getElementById("listing-dialog");
const dialogTitle = document.getElementById("dialog-title");

document.getElementById("year").textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});


function filterHostels() {
  const query = (
    newHostelSearch?.value ||
    searchQuery?.value ||
    ""
  ).trim().toLowerCase();

  const location = (locationFilter?.value || "").toLowerCase();
  const selectedType = typeFilter?.value || "";
  const oldType = roomType?.value || "all";

  let visibleCount = 0;

  hostelCards.forEach(card => {
    const cardLocation = (card.dataset.location || "").toLowerCase();
    const cardType = (card.dataset.type || "").toLowerCase();
    const cardName = card.querySelector("h3")?.textContent.toLowerCase() || "";
    const cardText = card.textContent.toLowerCase();

    const matchesSearch =
      !query ||
      cardLocation.includes(query) ||
      cardName.includes(query) ||
      cardText.includes(query);

    const matchesLocation =
      !location || cardLocation.includes(location);

    const matchesNewType =
      !selectedType || cardType === selectedType;

    const matchesOldType =
      oldType === "all" || cardType === oldType.toLowerCase();

    const visible =
      matchesSearch &&
      matchesLocation &&
      matchesNewType &&
      matchesOldType;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }

  const message =
    `${visibleCount} sample listing${visibleCount === 1 ? "" : "s"} shown. ` +
    "These are demo listings, not live availability.";

  if (searchNote) {
    searchNote.textContent = message;
  }

  if (resultsCount) {
    resultsCount.textContent = visibleCount === hostelCards.length
      ? `Showing all ${visibleCount} sample listings`
      : message;
  }
}

// Update results as the student types or changes a filter.
newHostelSearch?.addEventListener("input", filterHostels);
locationFilter?.addEventListener("change", filterHostels);
typeFilter?.addEventListener("change", filterHostels);

// Keep the previous search controls working if they still exist.
searchForm?.addEventListener("submit", event => {
  event.preventDefault();
  filterHostels();
});

searchQuery?.addEventListener("input", filterHostels);
roomType?.addEventListener("change", filterHostels);

// Reset the new filters.
resetFilters?.addEventListener("click", () => {
  if (newHostelSearch) newHostelSearch.value = "";
  if (locationFilter) locationFilter.value = "";
  if (typeFilter) typeFilter.value = "";

  if (searchQuery) searchQuery.value = "";
  if (roomType) roomType.value = "all";

  filterHostels();
});

filterHostels();

/* HOSTELHUB — VIEW DETAILS BUTTONS */

function openListing(name) {
  const dialog = document.getElementById("listing-dialog");
  const title = document.getElementById("dialog-title");

  if (!dialog || !title) {
    console.error("Listing dialog or title was not found.");
    return;
  }

  title.textContent = name || "Hostel details";

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    alert(
      (name || "Hostel details") +
      "\n\nThis is a demonstration listing. Live applications will be added later."
    );
  }
}

/* Connect every View details button */
document.querySelectorAll(".apply-demo").forEach(button => {
  button.addEventListener("click", function () {
    openListing(
      this.dataset.hostel ||
      this.closest(".hostel-card")?.querySelector("h3")?.textContent ||
      "Hostel details"
    );
  });
});

/* Close the listing dialog */
const detailsDialog = document.getElementById("listing-dialog");

document.getElementById("dialog-close")?.addEventListener("click", () => {
  detailsDialog?.close();
});

document.getElementById("dialog-ok")?.addEventListener("click", () => {
  detailsDialog?.close();
});

