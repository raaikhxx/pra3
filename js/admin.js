import { auth, db } from "./firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const adminMessage = document.getElementById("adminMessage");
const productForm = document.getElementById("productForm");
const productsContainer = document.getElementById("products");
const ordersContainer = document.getElementById("orders");
const usersContainer = document.getElementById("users");

let allOrders = [];
let currentOrderFilter = "all";
let usersCache = {};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));

  if (!userSnapshot.exists() || userSnapshot.data().role !== "admin") {
    adminMessage.textContent = "У вас нет доступа к админ-панели.";
    if (productForm) productForm.style.display = "none";
    return;
  }

  loadProducts();
  loadOrders();
  loadUsers();
});

if (productForm) {
  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await addDoc(collection(db, "products"), {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        price: Number(document.getElementById("price").value),
        category: document.getElementById("category").value.trim(),
        image: document.getElementById("image").value.trim(),
        stock: Number(document.getElementById("stock").value),
        createdAt: serverTimestamp(),
      });

      productForm.reset();
      adminMessage.textContent = "Товар добавлен.";
    } catch (error) {
      console.error(error);
      adminMessage.textContent = "Ошибка при добавлении товара.";
    }
  });
}

function loadProducts() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    productsContainer.innerHTML = "";

    snapshot.forEach((productDoc) => {
      const product = productDoc.data();
      const block = document.createElement("div");
      block.className = "order";

      const name = document.createElement("h3");
      name.textContent = product.name;

      const price = document.createElement("p");
      price.textContent =
        "Цена: " + Number(product.price || 0).toLocaleString("ru-RU") + " ₸";

      const stock = document.createElement("p");
      stock.textContent = "Количество: " + product.stock;

      const editButton = document.createElement("button");
      editButton.textContent = "Изменить";

      editButton.onclick = async () => {
        const newName = prompt("Название:", product.name);
        const newPrice = prompt("Цена:", product.price);
        const newStock = prompt("Количество:", product.stock);

        if (!newName || !newPrice || !newStock) return;

        await updateDoc(doc(db, "products", productDoc.id), {
          name: newName,
          price: Number(newPrice),
          stock: Number(newStock),
        });
      };

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Удалить";

      deleteButton.onclick = async () => {
        if (confirm("Удалить товар?")) {
          await deleteDoc(doc(db, "products", productDoc.id));
        }
      };

      block.append(name, price, stock, editButton, deleteButton);
      productsContainer.appendChild(block);
    });
  });
}

function loadUsers() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    usersCache = {};
    usersContainer.innerHTML = "";

    snapshot.forEach((userDoc) => {
      const user = userDoc.data();
      usersCache[userDoc.id] = user;

      const block = document.createElement("div");
      block.className = "order";

      const name = document.createElement("h3");
      name.textContent = user.name || "Без имени";

      const email = document.createElement("p");
      email.textContent = user.email || "";

      const role = document.createElement("select");

      ["user", "admin"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = value === user.role;
        role.appendChild(option);
      });

      role.onchange = () =>
        updateDoc(doc(db, "users", userDoc.id), {
          role: role.value,
        });

      block.append(name, email, role);
      usersContainer.appendChild(block);
    });

    renderOrders();
  });
}

function loadOrders() {
  onSnapshot(collection(db, "orders"), (snapshot) => {
    allOrders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    allOrders.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
    renderOrders();
  });
}

function renderOrders() {
  if (!ordersContainer) return;
  ordersContainer.innerHTML = "";

  let list = allOrders;
  if (currentOrderFilter !== "all") {
    list = list.filter((o) => o.status === currentOrderFilter);
  }

  if (!list.length) {
    ordersContainer.textContent = "Заказов нет.";
    return;
  }

  list.forEach((order) => {
    const user = usersCache[order.userId] || {};

    const block = document.createElement("div");
    block.className = "order";

    const title = document.createElement("h3");
    title.textContent = "Заказ #" + order.id.slice(0, 8).toUpperCase();
    block.appendChild(title);

    const statusBadge = document.createElement("span");
    statusBadge.className = "order-status";
    statusBadge.dataset.status = order.status || "Новый";
    statusBadge.textContent = order.status || "Новый";
    title.appendChild(statusBadge);

    const userLine = document.createElement("p");
    userLine.className = "order-user";
    userLine.innerHTML =
      "Покупатель: <strong>" +
      (user.name || user.email || "Неизвестный") +
      "</strong>" +
      (user.email ? " · " + user.email : "") +
      (user.phone ? " · " + user.phone : "");
    block.appendChild(userLine);

    const addressLine = document.createElement("p");
    addressLine.className = "order-user";
    addressLine.innerHTML = "Адрес: <strong>" + (user.address || "не указан") + "</strong>";
    block.appendChild(addressLine);

    const items = document.createElement("div");
    items.className = "order-items";
    (order.items || []).forEach((it) => {
      const row = document.createElement("div");
      row.textContent =
        `${it.name} × ${it.quantity} — ${Number(it.price).toLocaleString("ru-RU")} ₸` +
        (it.size ? ` (размер ${it.size})` : "");
      items.appendChild(row);
    });
    block.appendChild(items);

    const total = document.createElement("p");
    total.innerHTML =
      "Сумма: <strong>" +
      Number(order.total || 0).toLocaleString("ru-RU") +
      " ₸</strong>";
    block.appendChild(total);

    const payment = document.createElement("p");
    payment.textContent =
      "Оплата: " +
      (order.paymentMethod === "card" ? "Банковская карта" : "При получении");
    block.appendChild(payment);

    const statusLabel = document.createElement("p");
    statusLabel.style.marginTop = "10px";
    statusLabel.style.fontSize = "12px";
    statusLabel.style.fontWeight = "700";
    statusLabel.style.textTransform = "uppercase";
    statusLabel.style.color = "var(--muted)";
    statusLabel.textContent = "Изменить статус:";
    block.appendChild(statusLabel);

    const statusSelect = document.createElement("select");
    ["Новый", "В обработке", "Отправлен", "Доставлен", "Отменён"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === (order.status || "Новый");
      statusSelect.appendChild(option);
    });
    statusSelect.onchange = () =>
      updateDoc(doc(db, "orders", order.id), { status: statusSelect.value });
    block.appendChild(statusSelect);

    ordersContainer.appendChild(block);
  });
}

document.querySelectorAll(".admin-filters .filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".admin-filters .filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentOrderFilter = btn.dataset.status;
    renderOrders();
  });
});