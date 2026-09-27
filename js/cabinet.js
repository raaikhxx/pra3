import { auth, db } from "./firebase.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ordersContainer = document.getElementById("orders");
const reviewsContainer = document.getElementById("reviews");
const logoutButton = document.getElementById("logoutButton");
const message = document.getElementById("message");

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadOrders(user.uid);
    loadReviews(user.uid);
});

function loadOrders(userId) {
    const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", userId)
    );

    onSnapshot(ordersQuery, snapshot => {
        ordersContainer.innerHTML = "";

        if (snapshot.empty) {
            ordersContainer.textContent = "Заказов пока нет.";
            return;
        }

        snapshot.forEach(orderDoc => {
            const order = orderDoc.data();

            const block = document.createElement("div");
            block.className = "order";

            const title = document.createElement("h3");
            title.textContent = "Заказ #" + orderDoc.id;

            const status = document.createElement("p");
            status.textContent = "Статус: " + (order.status || "Новый");

            const total = document.createElement("p");
            total.textContent =
                "Сумма: " +
                Number(order.total || 0).toLocaleString("ru-RU") +
                " ₸";

            const payment = document.createElement("p");

            if (order.paymentMethod === "card") {
                payment.textContent = "Способ оплаты: Банковская карта";
            } else if (order.paymentMethod === "cash") {
                payment.textContent = "Способ оплаты: При получении";
            } else {
                payment.textContent = "Способ оплаты: Не указан";
            }

            block.append(title, status, payment, total);

            if (order.items) {
                order.items.forEach(item => {
                    const product = document.createElement("p");
                    product.textContent =
                        item.name + " × " + item.quantity;

                    block.appendChild(product);
                });
            }

            ordersContainer.appendChild(block);
        });
    });
}

function loadReviews(userId) {
    const reviewsQuery = query(
        collection(db, "reviews"),
        where("userId", "==", userId)
    );

    onSnapshot(reviewsQuery, snapshot => {
        reviewsContainer.innerHTML = "";

        if (snapshot.empty) {
            reviewsContainer.textContent = "Вы пока не оставляли отзывов.";
            return;
        }

        snapshot.forEach(reviewDoc => {
            const review = reviewDoc.data();

            const block = document.createElement("div");
            block.className = "review";

            const rating = document.createElement("p");
            rating.textContent =
                "Оценка: " + "⭐".repeat(Number(review.rating) || 0);

            const text = document.createElement("p");
            text.textContent = review.text || "";

            const editButton = document.createElement("button");
            editButton.textContent = "Изменить";

            editButton.onclick = async () => {
                const newText = prompt(
                    "Измените отзыв:",
                    review.text || ""
                );

                if (!newText || !newText.trim()) return;

                try {
                    await updateDoc(
                        doc(db, "reviews", reviewDoc.id),
                        { text: newText.trim() }
                    );

                    message.textContent = "Отзыв изменён.";
                } catch (error) {
                    console.error(error);
                    message.textContent = "Ошибка изменения отзыва.";
                }
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Удалить";

            deleteButton.onclick = async () => {
                if (!confirm("Удалить отзыв?")) return;

                try {
                    await deleteDoc(
                        doc(db, "reviews", reviewDoc.id)
                    );

                    message.textContent = "Отзыв удалён.";
                } catch (error) {
                    console.error(error);
                    message.textContent = "Ошибка удаления отзыва.";
                }
            };

            block.append(rating, text, editButton, deleteButton);
            reviewsContainer.appendChild(block);
        });
    });
}

logoutButton.onclick = async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error(error);
    }
};