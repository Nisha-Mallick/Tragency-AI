// ✅ FINAL BUDGET.JS - FIXED + FOOTER/NAVBAR BUG RESOLVED
import { firebaseConfig} from './credential.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const pastBudgets = document.getElementById('past-budgets');
const form = document.getElementById('budget-form');
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const budgetInput = document.getElementById('budget');
const daysInput = document.getElementById('days');
const peopleInput = document.getElementById('people');
const chatWindow = document.getElementById('chat-window');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const inputContainer = document.getElementById('input-container');
const toggleBtn = document.getElementById('toggle-form');
const loginPopup = document.getElementById('login-popup');
const googleLoginBtn = document.getElementById('google-login');
const desktopLogin = document.getElementById('desktop-login');
const mobileLogin = document.getElementById('mobile-login');
const closeLoginBtn = document.getElementById('close-login');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('email-login');
const registerBtn = document.getElementById('email-register');

let isCollapsed = false;
const originalChatHeight = chatWindow.offsetHeight;

function updateChatWindowHeight() {
  if (isCollapsed) {
    chatWindow.style.height = originalChatHeight + inputContainer.scrollHeight + 'px';
  } else {
    chatWindow.style.height = originalChatHeight + 'px';
  }
}

toggleBtn.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  toggleBtn.textContent = isCollapsed ? '⬆️' : '⬇️';
  inputContainer.style.maxHeight = isCollapsed ? '0px' : '1000px';
  inputContainer.style.opacity = isCollapsed ? '0' : '1';
  inputContainer.style.transition = 'all 0.3s ease';
  updateChatWindowHeight();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const destination = `From ${from} to ${to}`;
  const budget = budgetInput.value.trim();
  const days = daysInput.value.trim();
  const people = peopleInput.value.trim();

  if (!from || !to || !budget || !days || !people) {
    error.textContent = "Please fill all fields.";
    error.classList.remove('hidden');
    return;
  }

  error.classList.add('hidden');

  const userMessage = document.createElement('div');
  userMessage.className = "bg-blue-100 border border-blue-300 rounded p-3 self-end max-w-[80%]";
  userMessage.innerHTML = `<strong>You:</strong><br>Destination: ${destination}<br>Budget: ₹${budget}<br>Days: ${days}<br>People: ${people}`;
  chatWindow.appendChild(userMessage);

  const loadingMessage = document.createElement('div');
  loadingMessage.id = 'loading-message';
  loadingMessage.className = "text-gray-500 italic self-start px-3";
  loadingMessage.textContent = "Generating budget plan wait for 1-2 minutes...";
  chatWindow.appendChild(loadingMessage);

  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 100);

  const prompt = `You are a professional travel budget planner. Based on: Destination: ${destination}, Budget: ₹${budget}, Days: ${days}, People: ${people}. 
  Generate a full detailed budget in clean HTML only and make sure that the result should be responsive for both the site mobile and desktop and it should be 
  readable and clearly visible from the small screen , if you use tables, list or etc. make sure it is scrollable in the small devices (no markdown or code tags).`;

  try {
    const response = await fetch(`https://agentic-express-server-production.up.railway.app/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    let plan = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response from AI.";
    plan = plan.replace(/^```html|^```|```$/g, "").trim();

    const wrapper = document.createElement('div');
    wrapper.className = "w-full max-w-4xl mx-auto my-6 p-4 bg-white rounded-xl shadow-md";
    wrapper.innerHTML = `<div style="word-wrap: break-word; overflow-wrap: break-word;">${plan}</div>`;
    chatWindow.appendChild(wrapper);

    setTimeout(() => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 100);

     // ✅ Add auth check before writing to Firestore
  if (!auth.currentUser) {
    throw new Error("You must be logged in to save and view your past Budget plan.");
  }

    await addDoc(collection(db, "users", auth.currentUser.uid, "budget-plans"), {
      destination, budget, days, people, plan, created: new Date()
    });

  } catch (err) {
    console.error(err);
    error.textContent = `Error: ${err.message}`;
    error.classList.remove('hidden');
  } finally {
    const existingLoading = document.getElementById('loading-message');
    if (existingLoading) existingLoading.remove();
  }
});

// Load Past Budgets
async function loadPastBudgets() {
 chatWindow.innerHTML = `
  <h2 class="text-2xl font-bold text-center text-gray-700">Travel Budget Planner</h2>
  <p class="text-gray-400 italic text-center">Chat history will appear here...</p>
`;
  const user = auth.currentUser;
  if (!user) return;

  const budgetsRef = collection(db, "users", user.uid, "budget-plans");
  const q = query(budgetsRef, orderBy("created"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const { destination, budget, days, people, plan } = doc.data();

    const userMessage = document.createElement('li');
    userMessage.className = "bg-blue-100 border border-blue-300 rounded p-3 self-end max-w-[80%]";
    userMessage.innerHTML = `<strong>You:</strong><br>Destination: ${destination}<br>Budget: ₹${budget}<br>Days: ${days}<br>People: ${people}`;
    chatWindow.appendChild(userMessage);

    const aiMsg = document.createElement('div');
    aiMsg.className = "bg-green-100 p-2 rounded-md self-start max-w-[80%]";
    aiMsg.innerHTML = plan;
    chatWindow.appendChild(aiMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

  });

  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 100);
}

// === Auth & UI Logic ===
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
    loadPastBudgets();
  }).catch(err => alert("Login failed."));
});

// === ✅ Email/Password Login ===
loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password).then(() => {
    loginPopup.classList.add('hidden');
    loadPastBudgets();
  }).catch(err => alert(err.message));
});

// === ✅ Email/Password Registration ===
registerBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password).then(() => {
    loginPopup.classList.add('hidden');
    loadPastBudgets();
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

    loadPastBudgets();
  } else {
    desktopLogin.innerHTML = `<span id="desktop-login-text">Login</span>`;
    mobileLogin.innerHTML = `<span id="mobile-login-text">Login</span>`;
    profileDropdown.classList.add('hidden');
    profileDropdownMobile.classList.add('hidden');
    pastBudgets.innerHTML = '';
  }
});

// === ✅ Mobile Menu Toggle ===
const menuBtn = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuBtn = document.getElementById('close-menu');

menuBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-x-full');
  mobileMenu.classList.add('translate-x-0');
});
closeMenuBtn.addEventListener('click', () => {
  mobileMenu.classList.remove('translate-x-0');
  mobileMenu.classList.add('translate-x-full');
});
