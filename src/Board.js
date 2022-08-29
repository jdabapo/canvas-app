import React, { useState, useEffect, useRef }from 'react';
import { getFirestore, collection } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { useCollection } from 'react-firebase-hooks/firestore';
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
  const [snapshot,loading,error] = useCollection(
    collection(db, 'map'),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  )
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  function drawImageOnCanvas(image,x,y){
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    console.log(x,y);
    try{
      context.drawImage(image,x*100,y*100);
    }
    catch (e) {
      console.log(e);
    }
  }

  useEffect(()=>{
    // set up canvas
    const canvas = canvasRef.current;
    canvas.width = "3500";
    canvas.height = "3500";
    canvas.style.width = "3500px";
    canvas.style.height = "3500px";
    canvas.style.border = "1px solid black";
    
    const context = canvas.getContext('2d');
    context.scale(1,1);
    contextRef.current = context;
  },[]);

  useEffect(() =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.scale(1,1);
    contextRef.current = context;
    if (error){
      console.log('Firebase Error',error);
    }
    try{
      if (snapshot){
        snapshot.docChanges().map((change)=> {
          const x = change.doc.id[0];
          const y = change.doc.id[2];
          const html_img = new Image(350,350);
          html_img.src = change.doc.data().imagePNG;
          drawImageOnCanvas(html_img,x,y);
        })
      }
    }
    catch (error) {
      console.log(error)
    }
  },[snapshot,loading]);
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