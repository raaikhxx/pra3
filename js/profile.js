import { auth, db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const profile = document.getElementById("profile");
const newName = document.getElementById("newName");
const phone = document.getElementById("phone");
const address = document.getElementById("address");
const saveProfile = document.getElementById("saveProfile");
const logoutButton = document.getElementById("logoutButton");
const message = document.getElementById("message");

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    onSnapshot(doc(db, "users", user.uid), snapshot => {
        if (!snapshot.exists()) {
            profile.textContent = "Профиль не найден.";
            return;
        }

        const data = snapshot.data();

        profile.innerHTML = `
            <p><strong>Email:</strong> ${data.email || user.email}</p>
            <p><strong>Роль:</strong> ${data.role === "admin" ? "Администратор" : "Пользователь"}</p>
        `;

        newName.value = data.name || "";
        phone.value = data.phone || "";
        address.value = data.address || "";
    });
});

saveProfile.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const name = newName.value.trim();
    const userPhone = phone.value.trim();
    const userAddress = address.value.trim();

    if (!name || !userPhone || !userAddress) {
        message.textContent = "Заполните все поля.";
        return;
    }

    try {
        await updateDoc(doc(db, "users", user.uid), {
            name: name,
            phone: userPhone,
            address: userAddress
        });

        message.textContent = "Данные сохранены.";
    } catch (error) {
        console.error(error);
        message.textContent = "Ошибка сохранения.";
    }
});

logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});