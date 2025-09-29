// Firebase projenizin yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyC5etJPFTlduOzg70Q3AN-ScOihwhvx9TM",
  authDomain: "torbali-anadolu-lisesi-65124.firebaseapp.com",
  databaseURL: "https://torbali-anadolu-lisesi-65124-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "torbali-anadolu-lisesi-65124",
  storageBucket: "torbali-anadolu-lisesi-65124.firebasestorage.app",
  messagingSenderId: "538082684710",
  appId: "1:538082684710:web:e621ebe075edac5d301be7",
  measurementId: "G-5RC8MD7R3C"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firebase servislerini al
const auth = firebase.auth();
const db = firebase.database();

// index.html için DOM elemanları
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const forgotPasswordLink = document.getElementById('forgot-password-link'); // YENİ: Şifremi unuttum linki

// profile.html için DOM elemanları
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username-input');

// chat.html için DOM elemanları
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');


// Sayfa yönlendirme mantığı
auth.onAuthStateChanged(user => {
    // Kullanıcı oturum açmışsa
    if (user) {
        // Kullanıcı adı ayarlı değilse ve profil sayfasında değilse
        if (!user.displayName && !window.location.pathname.includes('profile.html')) {
            window.location.href = 'profile.html';
        }
        // Kullanıcı adı ayarlıysa ve sohbet sayfasında değilse
        else if (user.displayName && !window.location.pathname.includes('chat.html')) {
            window.location.href = 'chat.html';
        }
    }
    // Kullanıcı oturum açmamışsa
    else {
        // Eğer giriş/kayıt sayfasında değilse, oraya yönlendir
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
});


// Sadece index.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('index.html')) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        if (e.submitter.id === 'login-btn') {
            auth.signInWithEmailAndPassword(email, password)
                .catch((error) => {
                    errorMessage.textContent = error.message;
                });
        }
    });

    signupBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        auth.createUserWithEmailAndPassword(email, password)
            .catch((error) => {
                errorMessage.textContent = error.message;
            });
    });

    // YENİ: Şifremi unuttum işlevi
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const email = emailInput.value;
        if (email) {
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('Şifre sıfırlama linki e-posta adresinize gönderildi.');
                })
                .catch((error) => {
                    alert('Hata: ' + error.message);
                });
        } else {
            alert('Lütfen e-posta adresinizi girin.');
        }
    });
}

// Sadece profile.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('profile.html')) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user && usernameInput.value.trim() !== '') {
            await user.updateProfile({
                displayName: usernameInput.value.trim()
            });
            window.location.href = 'chat.html';
        }
    });
}


// Sadece chat.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('chat.html')) {
    auth.onAuthStateChanged(user => {
        if (user) {
            userInfo.textContent = `Hoş Geldin, ${user.displayName}!`;
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    db.ref("messages").on('value', (snapshot) => {
        chatMessages.innerHTML = '';
        const messages = [];
        snapshot.forEach(childSnapshot => {
            messages.push(childSnapshot.val());
        });

        messages.sort((a, b) => a.createdAt - b.createdAt);

        messages.forEach(message => {
            const messageElement = document.createElement('div');
           messageElement.classList.add('message-bubble');
           messageElement.classList.add(message.uid === auth.currentUser.uid ? 'sent-message' : 'received-message');
          messageElement.innerHTML = `
    <div class="message-sender">${message.displayName || 'Anonim'}</div>
    <div class="message-text">${message.text}</div>
`;


            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user && messageInput.value.trim() !== '') {
            const newMessageRef = db.ref("messages").push();
            await newMessageRef.set({
                text: messageInput.value,
                createdAt: Date.now(),
                uid: user.uid,
                displayName: user.displayName
            });
            messageInput.value = '';
        }
    });
}
