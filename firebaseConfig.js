import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDvkDI8Mzd9WterUiBs3hpDb2VjWUh--a4',
  authDomain: 'aaptha-mob-app.firebaseapp.com',
  projectId: 'aaptha-mob-app',
  storageBucket: 'aaptha-mob-app.firebasestorage.app',
  messagingSenderId: '5973256717',
  appId: '1:5973256717:web:a62348bdffb61d1a27c344',
  measurementId: 'G-DHEQZM2NCK',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
