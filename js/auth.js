import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      message.textContent = "Регистрация успешна!";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      console.error(error);
      message.textContent = "Ошибка: " + error.message;
    }
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    try {
      await signInWithEmailAndPassword(auth, email, password);

      message.textContent = "Вход выполнен!";

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      console.error(error);
      message.textContent = "Неверный email или пароль.";
    }
  });
}

const forgotLink = document.getElementById("forgotPassword");

if (forgotLink) {
  forgotLink.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message");

    if (!email) {
      message.textContent = "Введите email.";
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      message.textContent = "Ссылка для сброса пароля отправлена на email.";
    } catch (error) {
      console.error(error);
      message.textContent = "Ошибка: " + error.message;
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  const loginIcon = document.getElementById("loginIcon");
  const profileIcon = document.getElementById("profileIcon");
  const adminNavLink = document.getElementById("adminNavLink");

  if (user) {
    if (loginIcon) loginIcon.style.display = "none";
    if (profileIcon) profileIcon.style.display = "";

    if (adminNavLink) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().role === "admin") {
          adminNavLink.style.display = "";
        } else {
          adminNavLink.style.display = "none";
        }
      } catch (err) {
        console.error(err);
      }
    }
  } else {
    if (loginIcon) loginIcon.style.display = "";
    if (profileIcon) profileIcon.style.display = "none";
    if (adminNavLink) adminNavLink.style.display = "none";
  }
});