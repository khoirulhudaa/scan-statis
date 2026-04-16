import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC6uG2hu0zbgt_zfw4XRSQTI_1mbB0az_Q",
  authDomain: "disco-history-430508-e3.firebaseapp.com",
  projectId: "disco-history-430508-e3",
  storageBucket: "disco-history-430508-e3.firebasestorage.app",
  messagingSenderId: "911000742263",
  appId: "1:911000742263:web:74eac83dd12f7822985972",
  measurementId: "G-CCKW3XP725"
};

const app = initializeApp(firebaseConfig);

// Inisialisasi messaging secara lazy (ditunda) untuk menghindari crash
let messaging: any = null;

const getMessagingSafe = async () => {
  if (messaging) return messaging;
  
  // CRITICAL: Cek apakah browser mendukung FCM sebelum inisialisasi
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
};

export const requestForToken = async () => {
  try {
    const msg = await getMessagingSafe();
    if (!msg) {
      console.warn("FCM tidak didukung di browser ini.");
      return null;
    }

    const currentToken = await getToken(msg, {
      vapidKey: "BPYrxky9d6pB5sIsvYco5SbchJB3fpUwNcgipOH3a0fFw1-vrxhNqoQvWs1zKkpIlNqJYWaxy754fWdZgDwTtdU"
    });

    if (currentToken) {
      console.log("Token FCM didapat:", currentToken);
      return currentToken;
    } else {
      console.log("Izin notifikasi ditolak atau token kosong");
    }
  } catch (err) {
    console.error("Error mengambil token FCM:", err);
  }
};

export const onMessageListener = async () => {
  const msg = await getMessagingSafe();
  if (!msg) return null;

  return new Promise((resolve) => {
    onMessage(msg, (payload) => {
      resolve(payload);
    });
  });
};