import React, { useState, useEffect, useRef }from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { Paper } from '@mantine/core';

const firebaseConfig = {
  apiKey: "AIzaSyDcsr-FDygOtD2VHPwqNY9wKmU_lMPIucQ",
  authDomain: "sanvas-5ba8d.firebaseapp.com",
  projectId: "sanvas-5ba8d",
  storageBucket: "sanvas-5ba8d.appspot.com",
  messagingSenderId: "731507510180",
  appId: "1:731507510180:web:88ef579c6281ec640acf31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Board() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  function drawImageOnCanvas(image,x,y){
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    try{
      context.drawImage(image,y*350,x*350);
    }
    catch (e) {
      console.log(e);
    }
  }

  useEffect(()=>{
    // set up canvas
    // TODO: MESS WITH THESE AND ALSO MAYBE ADD A ZOOM FEATURE?
    const canvas = canvasRef.current;
    canvas.width = "1750";
    canvas.height = "1750";
    canvas.style.width = "1750px";
    canvas.style.height = "1750px";
    canvas.style.padding = "50px";
    canvas.style.border = "1px solid black";
    
    const context = canvas.getContext('2d');
    context.scale(0.5,0.5);
    contextRef.current = context;
  },[]);

  useEffect(() =>{
    let unsubscribe;
    async function getMap(db){
     unsubscribe = onSnapshot(collection(db,"map"),(snapShot)=>{
      snapShot.docChanges().forEach((change)=>{
        const x = change.doc.id[0];
        const y = change.doc.id[2];
        const html_img = new Image(350,350);
        html_img.src = change.doc.data().imagePNG;
        drawImageOnCanvas(html_img,x,y);
      })
     }) 
    }
    getMap(db);
  },[]);

  return (
    <>
    <Paper>
      <canvas
      ref = {canvasRef} 
      />
    </Paper>
    </>
  )
}