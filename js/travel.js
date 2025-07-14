// === ✅ Firebase & Config Imports ===
import { firebaseConfig} from './credential.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// === ✅ Initialize Firebase ===
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// === ✅ DOM Elements ===
const form = document.getElementById('trip-form');
const input = document.getElementById('trip-input');
const error = document.getElementById('error');
const chatWindow = document.getElementById('chat-window');
const pastTrips = document.getElementById('past-trips');
const loginPopup = document.getElementById('login-popup');
const googleLoginBtn = document.getElementById('google-login');
const desktopLogin = document.getElementById('desktop-login');
const mobileLogin = document.getElementById('mobile-login');
const closeLoginBtn = document.getElementById('close-login');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('email-login');
const registerBtn = document.getElementById('email-register');

const loginReminderPopup = document.getElementById('login-reminder-popup');
const loginReminderOk = document.getElementById('login-reminder-ok');

let hasShownReminder = false;

// === ✅ Chat Form Submit Handler ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const goal = input.value.trim();
  if (!goal) return;
  error.classList.add('hidden');

  const userMsg = document.createElement('div');
  userMsg.className = "bg-blue-100 p-2 rounded-md self-end max-w-[80%]";
  userMsg.textContent = goal;
  chatWindow.appendChild(userMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const loadingMsg = document.createElement('div');
  loadingMsg.className = "text-gray-500 text-center w-full py-2 italic";
  loadingMsg.textContent = "Generating trip plan wait for 1-2 minutes...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  input.value = '';

  try {
    const prompt = `You are a professional travel planner. Generate a beautiful detailed trip plan for the users based on the user's goal: "${goal}" in a clean HTML only and make sure that the result should be responsive for both the mobile and desktop sites
                    and it should be readable and clearly visible from the small screen and if you are using tables, list or etc. make sure it is scrollable in the small devices also do not use any tick marks in your response output and no need to mention that it is a html format response in your output.
                    just provide the detailed perfectly planed trip to the users also ensure not to use any broken tags in your response so that our website UI elements does not get effected from your response.
                  `;

    const response = await fetch(`https://agentic-express-server-production.up.railway.app/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    let plan = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response from AI.";
    plan = plan.replace(/^```html|^```|```$/g, "").trim()
               .replace(/^```|```$/g, "")                // remove generic ```
               .replace(/<\/?p[^>]*>/g, (m) => m.trim()) // trim <p> if AI messes spacing
               .trim();

    chatWindow.removeChild(loadingMsg);

    const aiMsg = document.createElement('div');
    aiMsg.className = "bg-green-100 p-2 rounded-md self-start max-w-[80%]";
    aiMsg.innerHTML = plan;
    chatWindow.appendChild(aiMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    const user = auth.currentUser;
    if (!user && !hasShownReminder) {
        loginReminderPopup.classList.remove('hidden');
        hasShownReminder = true;
  }
    else if (user) {
      const userTripsRef = collection(db, "users", user.uid, "trips");
      await addDoc(userTripsRef, {
        conversation: [{ role: "user", message: goal }, { role: "ai", message: plan }],
        created: new Date()
      });
    }
  } catch (err) {
    console.error(err);
    error.textContent = `Oops! Something failed: ${err.message}`;
    error.classList.remove('hidden');
    chatWindow.removeChild(loadingMsg);
  }
});

loginReminderOk.addEventListener('click', () => {
  loginReminderPopup.classList.add('hidden');
});

// === ✅ Load Saved Trips (for logged-in user only) ===
async function loadPastTrips() {
  pastTrips.innerHTML = '';
  const user = auth.currentUser;
  if (!user) return;

  const tripsRef = collection(db, "users", user.uid, "trips");
  const q = query(tripsRef, orderBy("created"));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const { conversation } = doc.data();
    const li = document.createElement('li');
    li.className = "bg-gray-100 p-2 rounded-md mb-2";
    li.innerHTML = conversation.map(msg => `<p><strong>${msg.role.toUpperCase()}:</strong><br>${msg.message}</p>`).join('<br>');
    pastTrips.appendChild(li);
  });
}

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
  signInWithPopup(auth, provider)
    .then(() => {
      loginPopup.classList.add('hidden');
      loadPastTrips();
    })
    .catch(err => alert("Login failed."));
});

// === ✅ Email/Password Login ===
loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginPopup.classList.add('hidden');
      loadPastTrips();
    })
    .catch(err => alert(err.message));
});

// === ✅ Email/Password Registration ===
registerBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginPopup.classList.add('hidden');
      loadPastTrips();
    })
    .catch(err => alert(err.message));
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

    loadPastTrips();
  } else {
    desktopLogin.innerHTML = `<span id="desktop-login-text">Login</span>`;
    mobileLogin.innerHTML = `<span id="mobile-login-text">Login</span>`;
    profileDropdown.classList.add('hidden');
    profileDropdownMobile.classList.add('hidden');
    pastTrips.innerHTML = '';
  }
});

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
