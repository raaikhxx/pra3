import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const cartContainer = document.getElementById("cart");
const cartTotal = document.getElementById("cartTotal");
const orderButton = document.getElementById("orderButton");
const paymentMethod = document.getElementById("paymentMethod");
const message = document.getElementById("message");

let cartItems = [];

onAuthStateChanged(auth, user => {
    if (!user) {
        cartContainer.innerHTML = "<p>Войдите, чтобы увидеть корзину.</p>";
        orderButton.style.display = "none";
        return;
    }

    loadCart(user.uid);
});

function loadCart(userId) {
    const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", userId)
    );

    onSnapshot(cartQuery, async snapshot => {
        cartItems = [];

        for (const itemDoc of snapshot.docs) {
            const item = {
                id: itemDoc.id,
                ...itemDoc.data()
            };

            if (!item.image && item.productId) {
                try {
                    const productSnapshot = await getDoc(
                        doc(db, "products", item.productId)
                    );

                    if (productSnapshot.exists()) {
                        item.image = productSnapshot.data().image || "";
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            cartItems.push(item);
        }

        renderCart();
    }, error => {
        console.error(error);
        cartContainer.innerHTML = "<p>Ошибка загрузки корзины.</p>";
    });
}

function renderCart() {
    cartContainer.innerHTML = "";

    if (!cartItems.length) {
        cartContainer.innerHTML = "<p class='empty-cart'>Корзина пуста.</p>";
        cartTotal.textContent = "0 ₸";
        orderButton.style.display = "none";
        return;
    }

    orderButton.style.display = "block";

    let total = 0;

    cartItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "cart-card";

        const imageBox = document.createElement("div");
        imageBox.className = "cart-product-image";

        if (item.image) {
            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.name || "Товар";
            imageBox.appendChild(image);
        } else {
            imageBox.textContent = "STREET SHOP";
        }

        const info = document.createElement("div");
        info.className = "cart-product-info";

        const name = document.createElement("h3");
        name.textContent = item.name || "Товар";

        const price = document.createElement("p");
        price.textContent =
            Number(item.price || 0).toLocaleString("ru-RU") + " ₸";

        const size = document.createElement("p");
        size.textContent = "Размер: " + (item.size || "Не указан");

        const quantityBlock = document.createElement("div");
        quantityBlock.className = "cart-quantity";

        const quantityLabel = document.createElement("span");
        quantityLabel.textContent = "Количество";

        const quantity = document.createElement("input");
        quantity.type = "number";
        quantity.min = "1";
        quantity.value = item.quantity || 1;

        quantity.addEventListener("change", async () => {
            let value = Number(quantity.value);

            if (!value || value < 1) {
                value = 1;
                quantity.value = 1;
            }

            try {
                await updateDoc(doc(db, "cart", item.id), {
                    quantity: value
                });
            } catch (error) {
                console.error(error);
                message.textContent = "Ошибка изменения количества.";
            }
        });

        quantityBlock.append(quantityLabel, quantity);

        const deleteButton = document.createElement("button");
        deleteButton.className = "cart-delete";
        deleteButton.textContent = "УДАЛИТЬ";

        deleteButton.addEventListener("click", async () => {
            try {
                await deleteDoc(doc(db, "cart", item.id));
            } catch (error) {
                console.error(error);
                message.textContent = "Ошибка удаления товара.";
            }
        });

        info.append(
            name,
            price,
            size,
            quantityBlock,
            deleteButton
        );

        card.append(imageBox, info);
        cartContainer.appendChild(card);

        total += Number(item.price || 0) * Number(item.quantity || 1);
    });

    cartTotal.textContent =
        total.toLocaleString("ru-RU") + " ₸";
}

orderButton.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user) {
        location.href = "login.html";
        return;
    }

    if (!cartItems.length) {
        message.textContent = "Корзина пуста.";
        return;
    }

    try {
        const total = cartItems.reduce(
            (sum, item) =>
                sum + Number(item.price || 0) * Number(item.quantity || 1),
            0
        );

        const items = cartItems.map(item => ({
            productId: item.productId || "",
            name: item.name || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            size: item.size || "",
            image: item.image || ""
        }));

        await addDoc(collection(db, "orders"), {
            userId: user.uid,
            items: items,
            total: total,
            paymentMethod: paymentMethod.value,
            status: "Новый",
            createdAt: serverTimestamp()
        });

        for (const item of cartItems) {
            await deleteDoc(doc(db, "cart", item.id));
        }

        message.textContent = "Заказ успешно оформлен.";
    } catch (error) {
        console.error(error);
        message.textContent = "Ошибка оформления заказа.";
    }
});