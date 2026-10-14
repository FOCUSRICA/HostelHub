const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");
const searchForm = document.getElementById("hostel-search");
const searchQuery = document.getElementById("search-query");
const roomType = document.getElementById("room-type");
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

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  const query = searchQuery.value.trim().toLowerCase();
  const type = roomType.value;
  let visibleCount = 0;

  hostelCards.forEach(card => {
    const matchesLocation = !query || card.dataset.location.includes(query) ||
      card.querySelector("h3").textContent.toLowerCase().includes(query);
    const matchesType = type === "all" || card.dataset.type === type;
    const visible = matchesLocation && matchesType;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  emptyState.hidden = visibleCount !== 0;
  searchNote.textContent = `${visibleCount} sample listing${visibleCount === 1 ? "" : "s"} shown. These are demo listings, not live availability.`;
});

function openListing(name) {
  dialogTitle.textContent = name;
  if (typeof listingDialog.showModal === "function") listingDialog.showModal();
  else alert(`${name}\n\nThis is a sample listing. Live applications will be added later.`);
}

document.querySelectorAll(".apply-demo").forEach(button => {
  button.addEventListener("click", () => openListing(button.dataset.hostel));
});

document.getElementById("dialog-close").addEventListener("click", () => listingDialog.close());
document.getElementById("dialog-ok").addEventListener("click", () => listingDialog.close());

document.querySelectorAll('a[href="#sign-in"], a[href="#apply"]').forEach(link => {
  link.addEventListener("click", event => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});
