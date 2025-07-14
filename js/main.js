// ✅ FINAL BUDGET.JS - FIXED + FOOTER/NAVBAR BUG RESOLVED
import { firebaseConfig} from './credential.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginPopup = document.getElementById('login-popup');
const googleLoginBtn = document.getElementById('google-login');
const desktopLogin = document.getElementById('desktop-login');
const mobileLogin = document.getElementById('mobile-login');
const closeLoginBtn = document.getElementById('close-login');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('email-login');
const registerBtn = document.getElementById('email-register');

// === ✅ Login Popup Handlers ===
desktopLogin.addEventListener('click', (e) => {
  e.preventDefault();
  if (auth.currentUser) {
    document.getElementById('profile-dropdown').classList.toggle('hidden');
  } else {
    loginPopup.classList.remove('hidden');
  }
});
mobileLogin.addEventListener('click', (e) => {
  e.preventDefault();
  if (auth.currentUser) {
    document.getElementById('profile-dropdown-mobile').classList.toggle('hidden');
  } else {
    loginPopup.classList.remove('hidden');
  }
});
closeLoginBtn.addEventListener('click', () => {
  loginPopup.classList.add('hidden');
});

// === ✅ Google Sign-In Handler ===
googleLoginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider).then(() => {
    loginPopup.classList.add('hidden');
  }).catch(err => alert("Login failed."));
});

// === ✅ Email/Password Login ===
loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password).then(() => {
    loginPopup.classList.add('hidden');
  }).catch(err => alert(err.message));
});

// === ✅ Email/Password Registration ===
registerBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password).then(() => {
    loginPopup.classList.add('hidden');
  }).catch(err => alert(err.message));
});

// === ✅ Show Profile Picture After Login ===
onAuthStateChanged(auth, (user) => {
  const profileDropdown = document.getElementById('profile-dropdown');
  const profileDropdownMobile = document.getElementById('profile-dropdown-mobile');

  if (user) {
    desktopLogin.innerHTML = `<img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email}" class="w-8 h-8 rounded-full cursor-pointer" alt="Profile">`;
    mobileLogin.innerHTML = `<img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.email}" class="w-8 h-8 rounded-full cursor-pointer" alt="Profile">`;

    profileDropdown.innerHTML = `<p class="mb-2">${user.displayName || user.email}</p><button id="logout-btn" class="text-red-600 font-bold">Logout</button>`;
    profileDropdownMobile.innerHTML = `<p class="mb-2">${user.displayName || user.email}</p><button id="logout-btn-mobile" class="text-red-600 font-bold">Logout</button>`;

    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
    document.getElementById('logout-btn-mobile').addEventListener('click', () => signOut(auth));
  } else {
    desktopLogin.innerHTML = `<span id="desktop-login-text">Login</span>`;
    mobileLogin.innerHTML = `<span id="mobile-login-text">Login</span>`;
    profileDropdown.classList.add('hidden');
    profileDropdownMobile.classList.add('hidden');
  }
});

  const textContainer = document.getElementById("rotating-text");
  const items = textContainer.children;
  const itemHeight = items[0].offsetHeight;
  let currentIndex = 0;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % items.length;
    textContainer.style.transform = `translateY(-${itemHeight * currentIndex}px)`;
  }, 2000);
 //scattered text
  const words = ['Travel Agent', 'Budget Planner', 'Packing Planner', 'Visa Agent'];
  const container = document.getElementById('staggered-text');
  let wordIndex = 0;

  function renderWord(word) {
    container.innerHTML = '';
    [...word].forEach((letter, index) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.className =
        'inline-block opacity-0 translate-y-full transition-all duration-500 ease-out';
      container.appendChild(span);

      setTimeout(() => {
        span.classList.remove('opacity-0', 'translate-y-full');
        span.classList.add('opacity-100', 'translate-y-0');
      }, index * 100); // stagger
    });
  }

  renderWord(words[wordIndex]);

  setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    renderWord(words[wordIndex]);
  }, 2500);
  
  //typing text
  const paragraph = `Planning a trip should be exciting — not stressful. That’s why we built TragencyAI — a smart, all-in-one travel assistant powered by advanced Agentic AI technology that thinks,
                    plans, and assists just like a human travel expert. Whether you’re dreaming of a weekend escape or a full-scale international adventure, our system combines multiple AI agents to handle 
                    every part of your journey — from itinerary planning to budgeting, packing, and even visa assistance. It’s travel planning, reimagined with intelligence.`;

  const element = document.getElementById('typed-paragraph');
  let charIndex = 0;

  function typeParagraph() {
    if (charIndex < paragraph.length) {
      element.textContent += paragraph.charAt(charIndex);
      charIndex++;
      let delay = 30;

      // Add a little natural delay for punctuation
      if (['.', ',', ';', ':'].includes(paragraph[charIndex - 1])) delay = 200;
      if (paragraph[charIndex - 1] === ' ') delay = 50;

      setTimeout(typeParagraph, delay);
    }
  }

  typeParagraph();

  // === ✅ Mobile Menu Toggle ===
const menuBtn = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const closeBtn = document.getElementById('close-menu');

menuBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-x-full');
  mobileMenu.classList.add('translate-x-0');
});
closeBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-x-0');
  mobileMenu.classList.add('translate-x-full');
});