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


let currentRoomId = 'general'; // Varsayılan olarak genel sohbet odası

// Şifre hashleme için basit bir fonksiyon (Güvenlik için daha gelişmiş kütüphaneler önerilir)
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

        // Bildirim izni isteği
        if ('Notification' in window) {
            Notification.requestPermission();
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

    // Şifremi unuttum işlevi
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
    const originalTitle = document.title;

    auth.onAuthStateChanged(user => {
        if (user) {
            userInfo.textContent = `Hoş Geldin, ${user.displayName}!`;

            // Firebase Realtime Database bağlantı durumu
            const presenceRef = db.ref(`presence/${user.uid}`);

            // Kullanıcı bağlantısı kesildiğinde otomatik olarak silinsin
            presenceRef.onDisconnect().remove();

            // Kullanıcı aktif olduğunda veritabanına yaz
            presenceRef.set(true);

            // Aktif kullanıcı sayısını dinle
            db.ref("presence").on('value', (snapshot) => {
                const count = snapshot.numChildren();
                if(onlineCount) onlineCount.textContent = `${count} kişi aktif`;
            });
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    const switchRoom = (roomId) => {
        currentRoomId = roomId;
        chatTitle.textContent = roomId === 'general' ? 'Genel Sohbet' : `Özel Oda: ${roomId}`;

        // Önceki dinleyiciyi kapat
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
            if (lastMessage && lastMessage.uid !== auth.currentUser.uid && !document.hasFocus()) {
                // Bildirim gönder
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
                messageElement.classList.add(message.uid === auth.currentUser.uid ? 'sent-message' : 'received-message');
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

    // Mesaj gönderme fonksiyonu
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user && messageInput.value.trim() !== '') {
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

    if(roomsBtn) {
      roomsBtn.addEventListener('click', () => {
          roomsModal.style.display = 'flex';
          db.ref('rooms').on('value', (snapshot) => {
              roomList.innerHTML = '';
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
              const generalRoomItem = document.createElement('div');
              generalRoomItem.classList.add('room-item');
              generalRoomItem.innerHTML = `<span class="room-item-name">Genel Sohbet</span>`;
              generalRoomItem.addEventListener('click', () => switchRoom('general'));
              roomList.prepend(generalRoomItem);
          });
      });
    }

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

    if(closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
          roomsModal.style.display = 'none';
      });
    }

    switchRoom('general');
}
