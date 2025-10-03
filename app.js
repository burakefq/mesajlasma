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

// YENİ EKLEMELER
const phoneNumberInput = document.getElementById('phone-number');
const sendCodeBtn = document.getElementById('send-code-btn');
const verifyCodeBtn = document.getElementById('verify-code-btn');
const verificationArea = document.getElementById('verification-area');
const verificationCodeInput = document.getElementById('verification-code');
const recaptchaContainer = document.getElementById('recaptcha-container');

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
const roomsBtn = document.getElementById('rooms-btn');
const roomsModal = document.getElementById('rooms-modal');
const closeModalBtn = document.querySelector('.close-btn');
const roomList = document.getElementById('room-list');
const createRoomForm = document.getElementById('create-room-form');
const roomNameInput = document.getElementById('room-name-input');
const roomPasswordInput = document.getElementById('room-password-input');
const onlineCount = document.getElementById('online-count');
const chatTitle = document.getElementById('chat-title');


let currentRoomId = 'general';

// Şifre hashleme için basit bir fonksiyon
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
        'size': 'invisible', // Butona gömülü görünmez reCAPTCHA
        'callback': (response) => {
            // reCAPTCHA başarılı, SMS gönderilebilir
        },
        'expired-callback': () => {
            errorMessage.textContent = 'Güvenlik doğrulaması sona erdi. Tekrar deneyin.';
        }
    });

    // E-posta/Şifre Giriş Formu
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

    // YENİ SMS GÖNDERME İŞLEVİ
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', () => {
            const phoneNumber = phoneNumberInput.value;
            errorMessage.textContent = '';

            if (!phoneNumber || phoneNumber.length < 10) {
                errorMessage.textContent = 'Lütfen geçerli bir telefon numarası girin.';
                return;
            }

            const appVerifier = window.recaptchaVerifier;

            auth.signInWithPhoneNumber(phoneNumber, appVerifier)
                .then((confirmation) => {
                    confirmationResult = confirmation;
                    sendCodeBtn.style.display = 'none'; // Kod gönderme butonunu gizle
                    verificationArea.style.display = 'flex'; // Kod giriş alanını göster
                    phoneNumberInput.disabled = true;
                    alert('Doğrulama kodu telefonunuza gönderildi!');
                })
                .catch((error) => {
                    errorMessage.textContent = 'SMS gönderme hatası: ' + error.message;
                    window.recaptchaVerifier.render().then(function(widgetId) {
                        grecaptcha.reset(widgetId); // Hata durumunda reCAPTCHA'yı sıfırla
                    });
                });
        });
    }

    // YENİ SMS KODU DOĞRULAMA İŞLEVİ
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
                        // Giriş başarılı, authStateChanged yönlendirmeyi yapacak.
                        // Kullanıcı yeni ise profile.html'ye, eski ise chat.html'ye gider.
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

    // Oda değiştirme ve mesajları dinleme fonksiyonu
    const switchRoom = (roomId) => {
        currentRoomId = roomId;
        chatTitle.textContent = roomId === 'general' ? 'Genel Sohbet' : `Özel Oda: ${roomId}`;

        // Önceki odanın dinleyicisini kapat
        db.ref(`rooms/${currentRoomId}/messages`).off('value');

        // Yeni odanın mesajlarını dinle
        db.ref(`rooms/${currentRoomId}/messages`).on('value', (snapshot) => {
            chatMessages.innerHTML = '';
            const messages = [];
            snapshot.forEach(childSnapshot => {
                messages.push(childSnapshot.val());
            });
            messages.sort((a, b) => a.createdAt - b.createdAt);

            const lastMessage = messages[messages.length - 1];
            // Yeni mesaj geldiğinde ve pencere odaklanmamışsa bildirim ve başlık flaşlama
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
        if(roomsModal) roomsModal.style.display = 'none';
    };

    // Mesaj gönderme
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (user && messageInput.value.trim() !== '') {
                // Mesajı aktif odanın altına yaz
                const newMessageRef = db.ref(`rooms/${currentRoomId}/messages`).push();
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

    // Odalar modalını açma ve listeyi yükleme
    if(roomsBtn) {
      roomsBtn.addEventListener('click', () => {
          roomsModal.style.display = 'flex';
          db.ref('rooms').on('value', (snapshot) => {
              roomList.innerHTML = '';

              // Genel sohbet odasını en üste ekle
              const generalRoomItem = document.createElement('div');
              generalRoomItem.classList.add('room-item');
              generalRoomItem.innerHTML = `<span class="room-item-name">Genel Sohbet</span>`;
              generalRoomItem.addEventListener('click', () => switchRoom('general'));
              roomList.appendChild(generalRoomItem);

              // Özel odaları listele
              snapshot.forEach(childSnapshot => {
                  const roomData = childSnapshot.val();
                  const roomId = childSnapshot.key;
                  const roomItem = document.createElement('div');
                  roomItem.classList.add('room-item');
                  roomItem.innerHTML = `
                      <span class="room-item-name">${roomData.name}</span>
                      ${roomData.password ? '<span class="lock-icon">🔒</span>' : ''}
                  `;
                  roomList.appendChild(roomItem);

                  roomItem.addEventListener('click', () => {
                      if (roomData.password) {
                          const enteredPassword = prompt('Bu oda şifre korumalı. Lütfen şifreyi girin:');
                          if (enteredPassword && md5Hash(enteredPassword) === roomData.password) {
                              switchRoom(roomId);
                          } else {
                              alert('Yanlış şifre!');
                          }
                      } else {
                          switchRoom(roomId);
                      }
                  });
              });

          });
      });
    }

    // Yeni oda oluşturma
    if(createRoomForm) {
      createRoomForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const roomName = roomNameInput.value;
          const password = roomPasswordInput.value;
          const user = auth.currentUser;

          if (user) {
              const newRoomRef = db.ref('rooms').push();
              await newRoomRef.set({
                  name: roomName,
                  createdAt: Date.now(),
                  createdBy: user.uid,
                  password: password ? md5Hash(password) : null
              });
              roomNameInput.value = '';
              roomPasswordInput.value = '';
              switchRoom(newRoomRef.key);
          }
      });
    }

    // Modalı kapatma
    if(closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
          roomsModal.style.display = 'none';
      });
    }

    // Uygulama başladığında genel odayı aç
    switchRoom('general');
}
