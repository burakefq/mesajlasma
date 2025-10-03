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
const forgotPasswordLink = document.getElementById('forgot-password-link');

// Telefon Giriş DOM elemanları
const phoneNumberInput = document.getElementById('phone-number');
const sendCodeBtn = document.getElementById('send-code-btn');
const verifyCodeBtn = document.getElementById('verify-code-btn');
const verificationArea = document.getElementById('verification-area');
const verificationCodeInput = document.getElementById('verification-code');
const recaptchaContainer = document.getElementById('recaptcha-container');
const showPhoneBtn = document.getElementById('show-phone-btn');
const phoneAuthContainer = document.getElementById('phone-auth-container'); // Görünürlük için

// Global değişkenler
let confirmationResult = null; // Doğrulama sonucunu saklamak için

// profile.html için DOM elemanları
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username-input');

// chat.html için DOM elemanları
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');
const onlineCount = document.getElementById('online-count');
const chatTitle = document.getElementById('chat-title');

// Şifre hashleme fonksiyonu (Artık kullanılmıyor ama uyumluluk için tutulabilir)
const md5Hash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }
    return Math.abs(hash).toString(16);
};

// Sayfa yönlendirme mantığı
auth.onAuthStateChanged(user => {
    if (user) {
        if (!user.displayName && !window.location.pathname.includes('profile.html')) {
            window.location.href = 'profile.html';
        }
        else if (user.displayName && !window.location.pathname.includes('chat.html')) {
            window.location.href = 'chat.html';
        }

        if ('Notification' in window) {
            Notification.requestPermission();
        }

    }
    else {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
});


// Sadece index.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('index.html')) {

    // reCAPTCHA doğrulayıcıyı başlat
    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainer, {
        'size': 'invisible',
        'callback': (response) => {
            // reCAPTCHA başarılı
        },
        'expired-callback': () => {
            errorMessage.textContent = 'Güvenlik doğrulaması sona erdi. Tekrar deneyin.';
        }
    });

    // E-posta/Şifre Giriş/Kayıt
    if (authForm) {
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
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            auth.createUserWithEmailAndPassword(email, password)
                .catch((error) => {
                    errorMessage.textContent = error.message;
                });
        });
    }

    // Şifremi unuttum işlevi
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = emailInput.value;
            if (email) {
                auth.sendPasswordResetEmail(email)
                    .then(() => {
                        alert('Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.');
                    })
                    .catch((error) => {
                        alert('Hata: ' + error.message);
                    });
            } else {
                alert('Lütfen e-posta adresinizi girin.');
            }
        });
    }

    // Telefonla Giriş Alanını Göster/Gizle
    if (showPhoneBtn) {
        showPhoneBtn.addEventListener('click', () => {
            if (phoneAuthContainer.style.display === 'flex') {
                phoneAuthContainer.style.display = 'none';
                showPhoneBtn.textContent = '📞 Telefon Numarasıyla Giriş';
            } else {
                phoneAuthContainer.style.display = 'flex';
                showPhoneBtn.textContent = 'Telefon Girişini Gizle';
            }
        });
    }

    // SMS GÖNDERME İŞLEVİ
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', () => {
            let phoneNumber = phoneNumberInput.value.trim();
            // Kullanıcı +90 girmediyse otomatik ekle ve boşlukları temizle
            if (!phoneNumber.startsWith('+90')) {
                phoneNumber = '+90' + phoneNumber.replace(/\s/g, '');
            }

            errorMessage.textContent = '';

            // Telefon numarasının geçerli bir uzunlukta (+90 dahil 13 hane) olmasını kontrol et
            if (phoneNumber.length < 13) {
                errorMessage.textContent = 'Lütfen +90 ile başlayan geçerli bir telefon numarası girin.';
                return;
            }

            const appVerifier = window.recaptchaVerifier;

            auth.signInWithPhoneNumber(phoneNumber, appVerifier)
                .then((confirmation) => {
                    confirmationResult = confirmation;
                    sendCodeBtn.style.display = 'none';
                    verificationArea.style.display = 'flex';
                    phoneNumberInput.disabled = true;
                    alert('Doğrulama kodu telefonunuza gönderildi!');
                })
                .catch((error) => {
                    errorMessage.textContent = 'SMS gönderme hatası: ' + error.message;
                    // Hata durumunda reCAPTCHA'yı sıfırla
                    if (grecaptcha && grecaptcha.reset) {
                        window.recaptchaVerifier.render().then(function(widgetId) {
                            grecaptcha.reset(widgetId);
                        });
                    }
                });
        });
    }

    // SMS KODU DOĞRULAMA İŞLEVİ
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', () => {
            const code = verificationCodeInput.value;
            errorMessage.textContent = '';

            if (!code || code.length !== 6) {
                errorMessage.textContent = 'Lütfen 6 haneli kodu girin.';
                return;
            }

            if (confirmationResult) {
                confirmationResult.confirm(code)
                    .then((result) => {
                        console.log('Telefonla giriş başarılı:', result.user);
                    })
                    .catch((error) => {
                        errorMessage.textContent = 'Kod doğrulama hatası: ' + error.message;
                    });
            } else {
                errorMessage.textContent = 'Önce doğrulama kodu göndermelisiniz.';
            }
        });
    }
}

// Sadece profile.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('profile.html')) {
    if (profileForm) {
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
}


// Sadece chat.html sayfasında çalışacak kodlar
if (window.location.pathname.includes('chat.html')) {
    const originalTitle = document.title;

    auth.onAuthStateChanged(user => {
        if (user) {
            userInfo.textContent = `Hoş Geldin, ${user.displayName || 'Anonim'}!`;

            // Aktiflik (Presence) ayarı
            const presenceRef = db.ref(`presence/${user.uid}`);
            presenceRef.onDisconnect().remove();
            presenceRef.set(true);

            // Aktif kullanıcı sayısını dinle
            db.ref("presence").on('value', (snapshot) => {
                const count = snapshot.numChildren();
                if(onlineCount) onlineCount.textContent = `${count} kişi aktif`;
            });
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }

    // YENİ: Tek bir ana sohbet kanalını dinle (önceden "general" odasıydı, şimdi doğrudan "messages" altındaki mesajlar)
    db.ref("messages").on('value', (snapshot) => {
        chatMessages.innerHTML = '';
        const messages = [];
        snapshot.forEach(childSnapshot => {
            messages.push(childSnapshot.val());
        });
        messages.sort((a, b) => a.createdAt - b.createdAt);

        const lastMessage = messages[messages.length - 1];
        // Yeni mesaj geldiğinde ve pencere odaklanmamışsa bildirim
        if (lastMessage && auth.currentUser && lastMessage.uid !== auth.currentUser.uid && !document.hasFocus()) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(lastMessage.displayName, {
                    body: lastMessage.text,
                    icon: 'https://pbs.twimg.com/profile_images/1258677537510764546/S3WhrKLo_400x400.jpg'
                });
            }

            let isFlashing = false;
            const flashInterval = setInterval(() => {
                document.title = isFlashing ? "Yeni Mesaj!" : originalTitle;
                isFlashing = !isFlashing;
            }, 1000);

            window.addEventListener('focus', () => {
                clearInterval(flashInterval);
                document.title = originalTitle;
            }, { once: true });
        }


        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message-bubble');
            messageElement.classList.add(auth.currentUser && message.uid === auth.currentUser.uid ? 'sent-message' : 'received-message');
            messageElement.innerHTML = `
                <div class="message-sender">${message.displayName || 'Anonim'}</div>
                <div class="message-text">${message.text}</div>
            `;
            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // Mesaj gönderme
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user && messageInput.value.trim() !== '') {
                // Mesajı doğrudan "messages" altına yaz
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
}
