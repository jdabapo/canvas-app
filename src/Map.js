import React, { useEffect, useState } from 'react';
import { SimpleGrid,
         Button,
         Grid,
         Paper,
         Group,
         Card,
         Image,
         Text,
         Badge,
         Center,
        } from '@mantine/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, docRef, query, onSnapshot } from 'firebase/firestore';
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

    // used to create a button or update a button on the map
    function createMapButton(row_idx,col_idx,cell) {
        let coords = '' + row_idx + col_idx;
        let obj = {
            coords: coords,
            color: cell.displayName ? "red" : "blue",
        }
        return (<Button
            size='sm'
            color={obj.color} 
            key={obj.coords}
            value={coords}
            onClick={clickHandler}
            variant="filled">
        </Button>)
    }

    const placeholder_item = {
        description:'',
        imagePNG:'',
        artName:'',
        displayName:''
    }
    const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
    const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
    const [itemList,setItemList] = useState([]);
    const [currentItem,setCurrentItem] = useState({});
    const [displayImage,setDisplayImage] = useState(null);

    const clickHandler = (event) =>{
        const coords = event.currentTarget.value;
        const x = coords[0];
        const y = coords[1];
        setCurrentCoords({x,y})
        setCurrentItem(map_array[x][y]);
    }

    // whenever a different is clicked
    useEffect(()=>{
        // pass the currentItem props to the thing
        let noitem = "https://media.istockphoto.com/photos/empty-pedestal-inside-exhibition-gallery-picture-id1271894342?k=20&m=1271894342&s=170667a&w=0&h=4Cy45Werofk-XvvjgxU_dYgoQgXRawE_TEEn3BsVbx0=";
        let tmp = {
            imagePNG:"https://consciouscat.net/wp-content/uploads/2012/11/cat-immune-system-e1587891908928.jpg",
            artName:"cute cat",
            displayName:"jeremy",
            timestamp:"earlier today",
            description:"select any box to see art work!"
        };
        let text;
        if (currentCoords.x !== -1 && currentCoords.y !== -1 && currentItem.displayName !== ''){
            tmp = currentItem;
        }
        text = `${tmp.artName} by ${tmp.displayName}`;
        if (currentItem.displayName === ''){
            text = "nothing is here...";
            tmp.imagePNG = noitem;
        }
        setDisplayImage(<Card shadow="sm" p="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                src={tmp.imagePNG}
                                height="100%"
                                alt={tmp.artName}
                                />
                            </Card.Section>
                            <Group position="apart" mt="md" mb="xs">
                                <Text weight={500}>
                                    {text}
                                </Text>
                                <Badge color="pink" variant="light">
                                {tmp.timestamp}
                                </Badge>
                            </Group>
                            <Text size="sm" color="dimmed">
                                {tmp.description}
                            </Text>
                            {currentCoords.x !== -1 ?
                            <Button variant="light" color="blue" fullWidth mt="md" radius="md">
                                item located at x:{currentCoords.x} y:{currentCoords.y}
                            </Button>
                            :
                            <Button variant="light" color="blue" fullWidth mt="md" radius="md" disabled>
                                select a red box to show an image!
                            </Button>
                            }
                        </Card>);
    },[currentItem,currentCoords])

    // initialize the grid
    // set up the listener
    useEffect(()=>{
        let unsubscribe;
        async function getMap(db){
            // set up the listener
            unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
                querySnapshot.docChanges().forEach((change)=>{
                    if (change.type === "modified") {
                        const x = change.doc.id[0];
                        const y = change.doc.id[2];
                        // update the item list at that coordinate
                        if (change.doc.data().displayName){
                            map_array[x][y] = change.doc.data();
                            console.log(x,y," added item @ map array data:",map_array[x][y]);
                            createMapButton(x,y,change.doc.data());
                            if (currentCoords.x === x && currentCoords.y === y){
                                // TODO: add something here to make like transition?
                                // maybe keep a small log of last X pictures?
                                // update current item
                                setCurrentItem(map_array[x][y]);
                            }
                        }
                    }
                    if (change.type === "added") {
                        const x = change.doc.id[0];
                        const y = change.doc.id[2];
                        // update the item list at that coordinate
                        if (change.doc.data().displayName){
                            map_array[x][y] = change.doc.data();
                            console.log(x,y," added item @ map array data:",map_array[x][y]);
                            createMapButton(x,y,change.doc.data());
                            if (currentCoords.x === x && currentCoords.y === y){
                                // TODO: add something here to make like transition?
                                // maybe keep a small log of last X pictures?
                                // update current item
                                setCurrentItem(map_array[x][y]);
                            }
                        }
                    }
                });
                // start the initial item list
                let item_list;
                item_list = map_array.map((rows,row_idx)=>{
                    let tmp = [];
                    rows.map((cell,col_idx)=>{
                        tmp.push(createMapButton(row_idx,col_idx,cell));
                    })
                    return tmp;
                })
                setItemList(item_list);
            });
        };
        getMap(db);
        return () => unsubscribe();
    },[]);

    // if change in the snapshot, update that button
    return(
        // first make an empty 10x10 grid
        <>
        <Grid grow>

            <Grid.Col span={6}>
                <Center inline>
                    <Paper shadow="xs" p="md" withBorder>
                        {displayImage}
                    </Paper>
                </Center>
            </Grid.Col>
            <Grid.Col span={3} style={{ minWidth: 600 }}>
                <Center inline>
                    <Paper shadow="xl" radius="md" p="md" withBorder>
                        <SimpleGrid cols={10}>
                            {itemList}
                        </SimpleGrid>
                    </Paper>
                </Center>
            </Grid.Col>
        </Grid>
        </>
    )
    // read entire table
}
export default Map;