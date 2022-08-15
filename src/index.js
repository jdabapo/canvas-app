import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { MantineProvider } from '@mantine/core';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { ModalsProvider } from '@mantine/modals';
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: "AIzaSyDcsr-FDygOtD2VHPwqNY9wKmU_lMPIucQ",
  authDomain: "sanvas-5ba8d.firebaseapp.com",
  projectId: "sanvas-5ba8d",
  storageBucket: "sanvas-5ba8d.appspot.com",
  messagingSenderId: "731507510180",
  appId: "1:731507510180:web:88ef579c6281ec640acf31"
};

const app = initializeApp(firebaseConfig);
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <ModalsProvider>
      <App />
      </ModalsProvider>
    </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
