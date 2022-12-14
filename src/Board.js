import React, { useState, useEffect, useRef }from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { Button, Paper } from '@mantine/core';

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
  const buttonRef = useRef(null);
  const [images,setImages] = useState([]);

  function clickHandler(){
    for(let i = 0; i < images.length;i++){
      drawImageOnCanvas(images[i].htmlImg,images[i].x,images[i].y);
    }
  }

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


  useEffect(() =>{
    let unsubscribe;
    async function getMap(db){
      const canvas = canvasRef.current;
      canvas.width = "1750";
      canvas.height = "1750";
      canvas.style.width = "1750px";
      canvas.style.height = "1750px";
      canvas.style.padding = "5px";
      canvas.style.border = "1px solid black";
      
      const context = canvas.getContext('2d');
      context.scale(0.5,0.5);
      contextRef.current = context;
      unsubscribe = onSnapshot(collection(db,"map"),(snapShot)=>{
        let items = [];
        snapShot.docChanges().forEach((change)=>{
          const x = change.doc.id[0];
          const y = change.doc.id[2];
          const htmlImg = new Image(350,350);
          htmlImg.src = change.doc.data().imagePNG;
          htmlImg.alt = change.doc.data().artName;
          drawImageOnCanvas(htmlImg,x,y);
          items.push({htmlImg:htmlImg,x:x,y:y});
          setImages(items);
        })
      })
    }

    getMap(db).then(
      console.log(images)
    );
    return () => unsubscribe();
  },[]);

  return (
    <>
    <Button
    onClick={clickHandler}
    ref={buttonRef}
    variant='outline'
    mb='md'
    >
      refresh the board
    </Button>
    <Paper>
      <canvas
      ref = {canvasRef} 
      />
    </Paper>
    </>
  )
}