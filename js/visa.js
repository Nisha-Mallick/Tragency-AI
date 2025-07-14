// visa.js
import { firebaseConfig} from './credential.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const pastVisas = document.getElementById('past-visas');
const form = document.getElementById('visa-form');
const fromInput = document.getElementById('visa-from');
const toInput = document.getElementById('visa-to');
const daysInput = document.getElementById('visa-days');
const purposeInput = document.getElementById('visa-purpose');
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

  if (isCollapsed) {
    inputContainer.style.maxHeight = '0px';
    inputContainer.style.opacity = '0';
    inputContainer.style.transition = 'all 0.3s ease';
  } else {
    inputContainer.style.maxHeight = '1000px';
    inputContainer.style.opacity = '1';
    inputContainer.style.transition = 'all 0.3s ease';
  }

  updateChatWindowHeight();
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const days = daysInput.value.trim();
  const purpose = purposeInput.value;

  if (!from || !to || !days || !purpose) {
    error.textContent = 'Please fill all fields.';
    error.classList.remove('hidden');
    return;
  }
  error.classList.add('hidden');

  const userMessage = document.createElement('div');
  userMessage.className = 'bg-blue-100 border border-blue-300 rounded p-3 self-end max-w-[80%]';
  userMessage.innerHTML = `<strong>You:</strong><br>From: ${from}<br>To: ${to}<br>Days: ${days}<br>Purpose: ${purpose}`;
  chatWindow.appendChild(userMessage);

  const loadMsg = document.createElement('div');
  loadMsg.id = 'loading-message';
  loadMsg.className = 'text-gray-500 italic self-start px-3';
  loadMsg.textContent = 'Generating visa information wait for 1-2 minutes...';
  chatWindow.appendChild(loadMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const prompt = `
             You are a professional visa consultant. Based on a person who wants to travel from ${from} to ${to} for ${days} days (purpose: ${purpose}).
             Generate a full detailed visa plan in clean HTML only and make sure that the result should be responsive for both the site mobile and desktop and it should be 
             readable and clearly visible from the small screen , if you use tables, list or etc. make sure it is scrollable in the small devices and also You don't have to mention that it is the HTml response in your output just show the details.
             `;


try {
  const res = await fetch(`https://agentic-express-server-production.up.railway.app/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  let plan = data?.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'No response.';
  plan = plan.replace(/^```html\s*|```$/g, "")         // remove ```html ... ```
             .replace(/^```|```$/g, "")                // remove generic ```
             .replace(/<\/?p[^>]*>/g, (m) => m.trim()) // trim <p> if AI messes spacing
             .trim();


  const aiResponse = document.createElement('div');
  aiResponse.className = "bg-green-100 border border-green-300 rounded p-3 self-start max-w-[80%]";
  aiResponse.innerHTML = plan;
  chatWindow.appendChild(aiResponse);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // ✅ Add auth check before writing to Firestore
  if (!auth.currentUser) {
    throw new Error("You must be logged in to save and view your past visa plans.");
  }

  // ✅ Safe Firestore write
  await addDoc(collection(db, 'users', auth.currentUser.uid, 'visa-plans'), {
    from, to, days, purpose, plan, created: new Date()
  });

} catch (err) {
  console.error(err);
  error.textContent = `Error: ${err.message}`;
  error.classList.remove('hidden');
} finally {
  document.getElementById('loading-message')?.remove();
}

});
async function loadPastVisas() {
  chatWindow.innerHTML = `
  <h2 class="text-2xl font-bold text-center text-gray-700">Your Visa Assistent</h2>
  <p class="text-gray-400 italic text-center">Chat history will appear here...</p>
`;
  const user = auth.currentUser;
  if (!user) return;
 
  const visaRef = collection(db, "users", user.uid, "visa-plans");
  const q = query(visaRef, orderBy("created"));
  const querySnapshot = await getDocs(q);

    querySnapshot .forEach(doc => {
    const { from, to, days, purpose, plan } = doc.data();
    const um = document.createElement('div');
    um.className = 'bg-blue-100 border border-blue-300 rounded p-3 self-end max-w-[80%]';
    um.innerHTML = `<strong>You:</strong><br>From: ${from}<br>To: ${to}<br>Days: ${days}<br>Purpose: ${purpose}`;
    chatWindow.appendChild(um);

    const vm = document.createElement('div');
    vm.className = 'bg-green-100 p-2 rounded-md self-start max-w-[80%]';
    vm.innerHTML = plan;
    chatWindow.appendChild(vm);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 100);

}

// Authentication & login handlers (identical to packing.js)
desktopLogin.addEventListener('click', e => { e.preventDefault(); auth.currentUser ? document.getElementById('profile-dropdown').classList.toggle('hidden') : loginPopup.classList.remove('hidden'); });
mobileLogin.addEventListener('click', e => { e.preventDefault(); auth.currentUser ? document.getElementById('profile-dropdown-mobile').classList.toggle('hidden') : loginPopup.classList.remove('hidden'); });
closeLoginBtn.addEventListener('click', () => loginPopup.classList.add('hidden'));
googleLoginBtn.addEventListener('click', () => signInWithPopup(auth, provider).then(() => { loginPopup.classList.add('hidden'); loadPastVisas(); }).catch(() => alert('Login failed.')));
loginBtn.addEventListener('click', () => signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).then(() => { loginPopup.classList.add('hidden'); loadPastVisas(); }).catch(err => alert(err.message)));
registerBtn.addEventListener('click', () => createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value).then(() => { loginPopup.classList.add('hidden'); loadPastVisas(); }).catch(err => alert(err.message)));

onAuthStateChanged(auth, user => {
  const pd = document.getElementById('profile-dropdown');
  const pdm = document.getElementById('profile-dropdown-mobile');
  if (user) {
    desktopLogin.innerHTML = `<img src="${user.photoURL||'https://ui-avatars.com/api/?name='+user.email}" class="w-8 h-8 rounded-full cursor-pointer">`;
    mobileLogin.innerHTML = `<img src="${user.photoURL||'https://ui-avatars.com/api/?name='+user.email}" class="w-8 h-8 rounded-full cursor-pointer">`;
    pd.innerHTML = `<p class="mb-2">${user.displayName||user.email}</p><button id="logout-btn" class="text-red-600 font-bold">Logout</button>`;
    pdm.innerHTML = `<p class="mb-2">${user.displayName||user.email}</p><button id="logout-btn-mobile" class="text-red-600 font-bold">Logout</button>`;
    pd.querySelector('#logout-btn').addEventListener('click', () => signOut(auth));
    pdm.querySelector('#logout-btn-mobile').addEventListener('click', () => signOut(auth));
    loadPastVisas();
  } else {
    desktopLogin.innerHTML = '<span id="desktop-login-text">Login</span>';
    mobileLogin.innerHTML = '<span id="mobile-login-text">Login</span>';
    pd.classList.add('hidden');
    pdm.classList.add('hidden');
    pastVisas.innerHTML = '';
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