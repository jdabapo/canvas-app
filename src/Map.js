import React, { useEffect } from 'react';
import { SimpleGrid } from '@mantine/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, docRef } from 'firebase/firestore';
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

  
function Map(){
    // get the map from firebase
    const map = {};
    useEffect(()=>{
        async function getMap(db){
            console.log(db);
            try{
                const querySnapshot = await getDocs(collection(db, "map"));
                querySnapshot.forEach((doc) =>{
                    map[doc.id] = doc.data();
                })
                console.log(map);
            }
            catch (e) {
                console.log(e);
            }
        }
        getMap(db);
    },[]);
    return(
        <SimpleGrid cols={10} spacing="xs">
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>
      </SimpleGrid>
    )
    // read entire table
}
export default Map;