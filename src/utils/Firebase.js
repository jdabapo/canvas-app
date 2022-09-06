import { getFirestore } from "firebase/firestore";
import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
    apiKey: "AIzaSyDcsr-FDygOtD2VHPwqNY9wKmU_lMPIucQ",
    authDomain: "sanvas-5ba8d.firebaseapp.com",
    projectId: "sanvas-5ba8d",
    storageBucket: "sanvas-5ba8d.appspot.com",
    messagingSenderId: "731507510180",
    appId: "1:731507510180:web:88ef579c6281ec640acf31"
  };
  
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
  