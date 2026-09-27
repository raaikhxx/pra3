import { auth, db } from "./firebase.js";

import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const productContainer = document.getElementById("product");
const reviewForm = document.getElementById("reviewForm");
const reviewsContainer = document.getElementById("reviews");
const ratingContainer = document.getElementById("rating");
const relatedContainer = document.getElementById("relatedProducts");
const productId = new URLSearchParams(location.search).get("id");

if (!productId) {
  productContainer.textContent = "Товар не найден.";
} else {
  onSnapshot(doc(db, "products", productId), (snapshot) => {
    if (!snapshot.exists()) {
      productContainer.textContent = "Товар не найден.";
      return;
    }

    const product = snapshot.data();
    loadRelatedProducts(product.category);

    const block = document.createElement("div");
    block.className = "product-page";

    const imageBlock = document.createElement("div");
    imageBlock.className = "product-page-image";

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

    const info = document.createElement("div");
    info.className = "product-info";

    const title = document.createElement("h2");
    title.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = "Категория: " + product.category;

    const description = document.createElement("p");
    description.textContent = product.description;

    const price = document.createElement("strong");
    price.textContent = Number(product.price).toLocaleString("ru-RU") + " ₸";

    const stock = document.createElement("p");
    stock.textContent = "В наличии: " + product.stock + " шт.";

    const details = document.createElement("div");
    details.className = "product-details";

    const sizeTitle = document.createElement("p");
    sizeTitle.textContent = "Размер:";

    const size = document.createElement("select");

    ["S", "M", "L", "XL"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      size.appendChild(option);
    });

    const color = document.createElement("p");
    color.textContent = "Цвет: синий";

    const delivery = document.createElement("p");
    delivery.textContent = "Доставка: по Казахстану";

    const payment = document.createElement("p");
    payment.textContent = "Оплата: картой или при получении";

    const original = document.createElement("p");
    original.textContent = "✓ Оригинальный товар";

    details.append(sizeTitle, size, color, delivery, payment, original);

    const button = document.createElement("button");
    button.textContent =
      Number(product.stock) > 0 ? "Добавить в корзину" : "Нет в наличии";
    button.disabled = Number(product.stock) <= 0;

    button.onclick = async () => {
      if (!auth.currentUser) {
        location.href = "login.html";
        return;
      }

      try {
        await addDoc(collection(db, "cart"), {
          userId: auth.currentUser.uid,
          productId,
          name: product.name,
          price: Number(product.price),
          image: product.image || "",
          quantity: 1,
          stock: Number(product.stock),
          size: size.value,
          createdAt: serverTimestamp(),
        });

        button.textContent = "Добавлено в корзину";

        setTimeout(() => {
          button.textContent = "Добавить в корзину";
        }, 1500);
      } catch (error) {
        console.error(error);
        button.textContent = "Ошибка";
      }
    };

    info.append(title, category, description, price, stock, details, button);
    block.append(imageBlock, info);
    productContainer.replaceChildren(block);
  });
}

function showReviewForm(user) {
  reviewForm.innerHTML = "";

  if (!user) {
    reviewForm.textContent = "Войдите в аккаунт, чтобы оставить отзыв.";
    return;
  }

  const title = document.createElement("h3");
  title.textContent = "Оставить отзыв";

  const rating = document.createElement("select");

  for (let i = 5; i >= 1; i--) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i + " ⭐";
    rating.appendChild(option);
  }

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Напишите свой отзыв...";

  const button = document.createElement("button");
  button.textContent = "Оставить отзыв";

  const message = document.createElement("p");

  button.onclick = async () => {
    const text = textarea.value.trim();

    if (!text) {
      message.textContent = "Напишите отзыв.";
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        productId,
        userId: user.uid,
        userName: user.email,
        rating: Number(rating.value),
        text,
        createdAt: serverTimestamp(),
      });

      textarea.value = "";
      rating.value = "5";
      message.textContent = "Отзыв добавлен.";
    } catch (error) {
      console.error(error);
      message.textContent = "Ошибка при добавлении отзыва.";
    }
  };

  reviewForm.append(title, rating, textarea, button, message);
}

onAuthStateChanged(auth, showReviewForm);

if (productId) {
  const reviewsQuery = query(
    collection(db, "reviews"),
    where("productId", "==", productId)
  );

  onSnapshot(reviewsQuery, (snapshot) => {
    reviewsContainer.innerHTML = "";

    let total = 0;

    snapshot.forEach((reviewDoc) => {
      const review = reviewDoc.data();
      total += Number(review.rating) || 0;

      const block = document.createElement("div");
      block.className = "review";

      const name = document.createElement("h3");
      name.textContent = review.userName || "Пользователь";

      const stars = document.createElement("p");
      stars.textContent = "Оценка: " + "⭐".repeat(Number(review.rating) || 0);

      const text = document.createElement("p");
      text.textContent = review.text || "";

      block.append(name, stars, text);

      if (auth.currentUser && auth.currentUser.uid === review.userId) {
        const editButton = document.createElement("button");
        editButton.textContent = "Изменить";

        editButton.onclick = async () => {
          const newText = prompt("Измените отзыв:", review.text);

          if (!newText || !newText.trim()) return;

          try {
            await updateDoc(doc(db, "reviews", reviewDoc.id), {
              text: newText.trim(),
            });
          } catch (error) {
            console.error(error);
          }
        };

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Удалить отзыв";

        deleteButton.onclick = async () => {
          await deleteDoc(doc(db, "reviews", reviewDoc.id));
        };

        block.append(editButton, deleteButton);
      }

      reviewsContainer.appendChild(block);
    });

    const count = snapshot.size;
    const average = count ? (total / count).toFixed(1) : "0";

    ratingContainer.textContent = count
      ? `Рейтинг: ${average} ⭐ · Отзывов: ${count}`
      : "Пока нет оценок";

    if (!count) {
      reviewsContainer.textContent = "Пока нет отзывов.";
    }
  });
}

function loadRelatedProducts(category) {
  if (!relatedContainer || !category) return;

  const productsQuery = query(
    collection(db, "products"),
    where("category", "==", category)
  );

  onSnapshot(productsQuery, (snapshot) => {
    relatedContainer.innerHTML = "";

    snapshot.forEach((productDoc) => {
      if (productDoc.id === productId) return;

      const product = productDoc.data();
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
      button.onclick = () =>
        (location.href = "product.html?id=" + productDoc.id);

      card.append(imageBlock, title, description, price, button);
      relatedContainer.appendChild(card);
    });

    if (!relatedContainer.children.length) {
      relatedContainer.textContent = "Похожих товаров пока нет.";
    }
  });
}
