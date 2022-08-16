import React, { useEffect, useState } from 'react';
import { SimpleGrid,
         Button,
         Grid,
         Paper,
         Card,
         Image,
         Group,
         Text,
         Badge
        } from '@mantine/core';
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

function DisplayArt(props){
    return(
        <>
            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Card.Section>
                    <Image
                    src={props.imagePNG}
                    height="100%"
                    alt={props.artName}
                    />
                </Card.Section>

                <Group position="apart" mt="md" mb="xs">
                    <Text weight={500}>{props.displayName}</Text>
                    <Badge color="pink" variant="light">
                    Timestamp here
                    </Badge>
                </Group>

                <Text size="sm" color="dimmed">
                    {props.description}
                </Text>

                <Button variant="light" color="blue" fullWidth mt="md" radius="md">
                    place your art here?
                </Button>
                </Card>
        </>
    )
}

function Map(){
    // array should be 10x10 (0-9)
    const placeholder_item = {
        description:'',
        imagePNG:'',
        artName:'',
        displayName:''
    }
    const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
    const [itemList,setItemList] = useState([]);
    const [currentItem,setCurrentItem] = useState({});
    const [displayImage,setDisplayImage] = useState(<div>1</div>);
    const hoverEffect = (value) => {
        //console.log(ref)
    }

    const clickHandler = (event) =>{
        const coords = event.currentTarget.value;
        const x = coords[0];
        const y = coords[1];
        setCurrentItem(map_array[x][y]);
    }

    useEffect(()=>{
        // pass the currentItem props to the thing
        console.log('changed');
        setDisplayImage(<div></div>);
    },[currentItem])

    useEffect(()=>{
        async function getMap(db){
            const querySnapshot = await getDocs(collection(db, "map"));
            querySnapshot.forEach((doc) =>{
                const x = doc.id[0];
                const y = doc.id[2];
                if (doc.data().displayName){
                    map_array[x][y] = doc.data();
                }
            })
            let item_list;
            item_list = map_array.map((rows,row_idx)=>{
                let tmp = [];
                rows.map((cell,col_idx)=>{
                    let coords = '' + row_idx + col_idx;
                    let obj = {
                        coords: coords,
                        color: cell.displayName ? "red" : "blue",
                    }
                    tmp.push(
                    <Button 
                        color={obj.color} 
                        key={obj.coords}
                        value={coords}
                        onClick={clickHandler}
                        onMouseOver={hoverEffect}
                        variant="outline">
                    </Button>
                    );
                })
                return tmp;
            })
            setItemList(item_list);
            
 
        }
        getMap(db);

        // initialize the grid
    },[]);


    return(
        // first make an empty 10x10 grid
        <>
            <Grid grow>
                <Grid.Col span={4}>
                    <Paper shadow="xs" p="md" withBorder>
                        <SimpleGrid 
                        cols={10}
                        breakpoints={[
                            {maxWidth:450, spacing:2},
                        ]}
                        >
                            {itemList}
                        </SimpleGrid>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Paper shadow="xs" p="md" withBorder>
                        {displayImage}
                    </Paper>
                </Grid.Col>
            </Grid>
        </>
    )
    // read entire table
}
export default Map;