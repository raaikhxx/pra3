import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const sortSelect = document.getElementById("sort");
const loadMoreButton = document.getElementById("loadMore");

let products = [];
let lastDoc = null;
let loading = false;

const pageSize = 5;

async function loadProducts(reset = false) {
  if (loading) return;

  loading = true;

  if (reset) {
    products = [];
    lastDoc = null;
    productsContainer.innerHTML = "";
  }

  try {
    let productsQuery;

    const category = categorySelect.value;
    const sort = sortSelect.value;

    if (category !== "all") {
      productsQuery = query(
        collection(db, "products"),
        where("category", "==", category),
        limit(pageSize)
      );
    } else {
      productsQuery = query(collection(db, "products"), limit(pageSize));
    }

    if (lastDoc) {
      productsQuery = query(productsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(productsQuery);

    if (snapshot.empty && products.length === 0) {
      productsContainer.textContent = "Товаров не найдено.";
      loadMoreButton.style.display = "none";
      loading = false;
      return;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    snapshot.forEach((productDoc) => {
      products.push({
        id: productDoc.id,
        ...productDoc.data(),
      });
    });

    renderProducts();

    loadMoreButton.style.display = snapshot.size < pageSize ? "none" : "block";
  } catch (error) {
    console.error(error);
    productsContainer.textContent = "Не удалось загрузить товары.";
  }

  loading = false;
}

function renderProducts() {
  productsContainer.innerHTML = "";

  let filteredProducts = [...products];

  const search = searchInput.value.trim().toLowerCase();

  if (search) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        String(product.name || "")
          .toLowerCase()
          .includes(search) ||
        String(product.description || "")
          .toLowerCase()
          .includes(search)
    );
  }

  const sort = sortSelect.value;

  if (sort === "priceAsc") {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  }

  if (sort === "priceDesc") {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }

  if (sort === "name") {
    filteredProducts.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  if (!filteredProducts.length) {
    productsContainer.textContent = "Товаров не найдено.";
    return;
  }

  filteredProducts.forEach((product) => {
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
    price.textContent =
      Number(product.price || 0).toLocaleString("ru-RU") + " ₸";

    const button = document.createElement("button");
    button.textContent = "Подробнее";

    button.addEventListener("click", () => {
      window.location.href = "product.html?id=" + product.id;
    });

    card.append(imageBlock, title, description, price, button);

    productsContainer.appendChild(card);
  });
}

searchInput.addEventListener("input", renderProducts);

categorySelect.addEventListener("change", () => {
  loadProducts(true);
});

sortSelect.addEventListener("change", renderProducts);

loadMoreButton.addEventListener("click", () => {
  loadProducts();
});

loadProducts(true);
