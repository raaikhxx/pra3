import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");
const paginationContainer = document.getElementById("pagination");

const PAGE_SIZE = 6;

let allProducts = [];
let filtered = [];
let currentPage = 1;
let totalPages = 1;

async function loadAllProducts() {
  try {
    const category = categorySelect.value;
    let q;

    if (category !== "all") {
      q = query(collection(db, "products"), where("category", "==", category));
    } else {
      q = query(collection(db, "products"));
    }

    const snapshot = await getDocs(q);

    allProducts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (!allProducts.length) {
      productsContainer.innerHTML = "<p>Товаров не найдено.</p>";
      paginationContainer.innerHTML = "";
      return;
    }

    applyFiltersAndRender();
  } catch (error) {
    console.error(error);
    productsContainer.textContent = "Не удалось загрузить товары.";
  }
}

function applyFiltersAndRender() {
  filtered = [...allProducts];

  const search = searchInput.value.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(search) ||
        String(p.description || "").toLowerCase().includes(search)
    );
  }

  const sort = sortSelect.value;
  if (sort === "priceAsc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "priceDesc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name") filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = 1;

  renderPage();
  renderPagination();
}

function renderPage() {
  productsContainer.innerHTML = "";

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  if (!pageItems.length) {
    productsContainer.innerHTML = "<p>Товаров не найдено.</p>";
    return;
  }

  pageItems.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imageBlock = document.createElement("div");
    imageBlock.className = "product-image";

    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      imageBlock.appendChild(image);
    } else {
      const text = document.createElement("span");
      text.textContent = "STREET SHOP";
      imageBlock.appendChild(text);
    }

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("strong");
    price.textContent = Number(product.price || 0).toLocaleString("ru-RU") + " ₸";

    const button = document.createElement("button");
    button.textContent = "Подробнее";
    button.addEventListener("click", () => {
      window.location.href = "product.html?id=" + product.id;
    });

    card.append(imageBlock, title, description, price, button);
    productsContainer.appendChild(card);
  });
}

function renderPagination() {
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.textContent = "←";
  prev.disabled = currentPage === 1;
  prev.addEventListener("click", () => {
    currentPage--;
    applyFiltersAndRender();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  paginationContainer.appendChild(prev);

  const pages = buildPageList(currentPage, totalPages);
  pages.forEach((p) => {
    if (p === "...") {
      const dots = document.createElement("span");
      dots.textContent = "…";
      dots.style.padding = "0 6px";
      dots.style.color = "var(--muted)";
      paginationContainer.appendChild(dots);
      return;
    }

    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = p;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginationContainer.appendChild(btn);
  });

  const next = document.createElement("button");
  next.textContent = "→";
  next.disabled = currentPage === totalPages;
  next.addEventListener("click", () => {
    currentPage++;
    applyFiltersAndRender();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  paginationContainer.appendChild(next);
}

function buildPageList(current, total) {
  const delta = 2;
  const range = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}

searchInput?.addEventListener("input", () => {
  currentPage = 1;
  applyFiltersAndRender();
});

categorySelect?.addEventListener("change", () => {
  currentPage = 1;
  loadAllProducts();
});

sortSelect?.addEventListener("change", () => {
  currentPage = 1;
  applyFiltersAndRender();
});

loadAllProducts();