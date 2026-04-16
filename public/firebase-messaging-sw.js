importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC6uG2hu0zbgt_zfw4XRSQTI_1mbB0az_Q",
  messagingSenderId: "911000742263",
  appId: "1:911000742263:web:74eac83dd12f7822985972",
  projectId: "disco-history-430508-e3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Notifikasi Background:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // ganti dengan logo sekolah
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});