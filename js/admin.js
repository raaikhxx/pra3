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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  const userSnapshot = await getDoc(doc(db, "users", user.uid));

  if (!userSnapshot.exists() || userSnapshot.data().role !== "admin") {
    adminMessage.textContent = "У вас нет доступа к админ-панели.";
    productForm.style.display = "none";
    return;
  }

  loadProducts();
  loadOrders();
  loadUsers();
});

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

function loadOrders() {
  const ordersQuery = query(
    collection(db, "orders"),
    where("status", "==", "Новый")
  );

  onSnapshot(ordersQuery, (snapshot) => {
    ordersContainer.innerHTML = "";

    if (snapshot.empty) {
      ordersContainer.textContent = "Новых заказов нет.";
      return;
    }

    snapshot.forEach((orderDoc) => {
      const order = orderDoc.data();
      const block = document.createElement("div");
      block.className = "order";

      const title = document.createElement("h3");
      title.textContent = "Заказ #" + orderDoc.id;

      const total = document.createElement("p");
      total.textContent =
        "Сумма: " + Number(order.total || 0).toLocaleString("ru-RU") + " ₸";

      const status = document.createElement("select");

      ["Новый", "В обработке", "Отправлен", "Доставлен", "Отменён"].forEach(
        (value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          option.selected = value === order.status;
          status.appendChild(option);
        }
      );

      status.onchange = () =>
        updateDoc(doc(db, "orders", orderDoc.id), {
          status: status.value,
        });

      block.append(title, total, status);
      ordersContainer.appendChild(block);
    });
  });
}

function loadUsers() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    usersContainer.innerHTML = "";

    snapshot.forEach((userDoc) => {
      const user = userDoc.data();
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
  });
}
