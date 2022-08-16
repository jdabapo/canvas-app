import React, { useEffect, useState } from 'react';
import { SimpleGrid, Button } from '@mantine/core';
import { useHover } from '@mantine/hooks';
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
    // array should be 10x10 (0-9)
    let map_array;
    let t = [1,2,3,4,5]
    let item_list;
    const {hovered, ref} = useHover();
    const [z,setZ] = useState();
    const placeholder_item = {
        description:'',
        imagePNG:'',
        artName:'',
        displayName:''
    }
    useEffect(()=>{
        async function getMap(db){
            const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
            try{
                const querySnapshot = await getDocs(collection(db, "map"));
                querySnapshot.forEach((doc) =>{
                    const x = doc.id[0];
                    const y = doc.id[2];
                    if (doc.data().displayName){
                        map_array[x][y] = doc.data();
                    }
                })

                item_list = map_array.map((rows,row_idx)=>{
                    let tmp = [];
                    rows.map((cell,col_idx)=>{
                        tmp.push(<Button key={`${row_idx}` + `${col_idx}`} variant="outline">{map_array[row_idx][col_idx].displayName}</Button>);
                    })
                    return tmp;
                })
                setZ(item_list);
                console.log(item_list)
            }
            catch (e) {
                console.log(e);
            }
 
        }
        map_array = getMap(db);

        // initialize the grid
    },[]);


    return(
        // first make an empty 10x10 grid
        <>
            <SimpleGrid cols={10} spacing={0}>
                {z}
            </SimpleGrid>
        </>
        // <SimpleGrid cols={10} spacing="xs">
        //     {mapped_items}
        // </SimpleGrid>
    )
    // read entire table
}
export default Map;