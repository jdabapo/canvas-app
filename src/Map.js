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
         LoadingOverlay, 
        } from '@mantine/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, docRef, query, onSnapshot } from 'firebase/firestore';
import { Carousel } from '@mantine/carousel';
import { IconCheck } from '@tabler/icons';
import { showNotification, updateNotification } from '@mantine/notifications';
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



function DisplayItem({d, text, tmp, currentCoords}){
    // change image to the biggest image size
    if(!tmp.description){
        tmp.description = "the author did not write anything for this art..."
    }
    else if(!d || d.toLocaleString() === 'Invalid Date'){
        d = "no time yet...";
    }
    return(
            <Card shadow="sm" radius="md" withBorder>
                <Card.Section>
                    <Image
                        src={tmp.imagePNG}
                        height={350}
                        width={350}
                        alt={tmp.artName}
                    />
                </Card.Section>
                <Group position="apart" mt="md" mb="xs">
                    <Text weight={500}>
                        {text}
                    </Text>
                    <Badge color="pink" variant="light">
                        {d ? d.toLocaleString(): "no time yet"}
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
            </Card>
    );
}

function Map(){
    // array should be 10x10 (0-9)

    // used to create a button or update a button on the map
    function createMapButton(row_idx,col_idx,cell) {
        let coords = '' + row_idx + col_idx;
        let color = cell.displayName ? "red" : "blue"
        return (<Button
            size='sm'
            color={color} 
            key={coords}
            value={coords}
            onClick={clickHandler}
            variant="filled">
        </Button>)
    }

    const placeholder_item = {
        description:'',
        imagePNG:'',
        artName:'',
        displayName:'',
        timeEpoch:'',
    }
    const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
    const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
    const [itemList,setItemList] = useState([]);
    const [currentItem,setCurrentItem] = useState({});
    const [displayImage,setDisplayImage] = useState(null);
    const clickHandler = (event) =>{
        const coords = event.currentTarget.value;
        const x = coords[1];
        const y = coords[0];
        setCurrentCoords({x,y})
        setCurrentItem(map_array[y][x]);
    }

    // whenever a different is clicked
    // TODO: Fix carousel bc images just keep getting bigger
    useEffect(()=>{
        // pass the currentItem props to the thing
        let noitem = "https://media.istockphoto.com/photos/empty-pedestal-inside-exhibition-gallery-picture-id1271894342?k=20&m=1271894342&s=170667a&w=0&h=4Cy45Werofk-XvvjgxU_dYgoQgXRawE_TEEn3BsVbx0=";
        let tmp = {
            imagePNG:"https://consciouscat.net/wp-content/uploads/2012/11/cat-immune-system-e1587891908928.jpg",
            artName:"cute cat",
            displayName:"jeremy",
            timeEpoch:"earlier today",
            description:"select any box to see art work!"
        };
        let d;
        let all_display = [];
        if (currentItem.displayName === ''){
            tmp.description = "nothing is here...";
            tmp.imagePNG = noitem;
            all_display.push(<DisplayItem key={tmp.timeEpoch} d={tmp.timeEpoch} tmp={tmp} currentCoords={currentCoords}/>)
            setDisplayImage(all_display);
        }
        else if(currentCoords.x === -1 && currentCoords.y === -1){
            all_display.push(<DisplayItem key={tmp.timeEpoch} d={tmp.timeEpoch} tmp={tmp} currentCoords={currentCoords}/>)
            setDisplayImage(all_display);
        }
        else if (currentItem.priorImages && currentItem.priorImages.length > 0){
            let image_text;
            let tmpFix = 0;
            // add all the prior images
            currentItem.priorImages.map((image)=>{
                image_text = `${image.artName} by ${image.displayName}`;
                d = new Date(0);
                d.setUTCMilliseconds(image.timeEpoch);
                all_display.unshift(
                    <Carousel.Slide>
                        <DisplayItem key={tmpFix} d={d} text={image_text} tmp={image} currentCoords={currentCoords}/>
                    </Carousel.Slide>
                );
                tmpFix += 1;
            });
            // push current item
            image_text = `${currentItem.artName} by ${currentItem.displayName}`;
            d = new Date(0);
            d.setUTCMilliseconds(currentItem.timeEpoch);
            all_display.unshift(
                <Carousel.Slide>
                    <DisplayItem key={tmpFix} d={d} text={image_text} tmp={currentItem} currentCoords={currentCoords}/>
                </Carousel.Slide>
            );
            setDisplayImage(
                <Carousel
                withIndicators

                >
                    {all_display}
                </Carousel>
                );
        }
        else{
            d = new Date(0);
            d.setUTCMilliseconds(currentItem.timeEpoch);
            let text = `${currentItem.artName} by ${currentItem.displayName}`;
            setDisplayImage(<DisplayItem d={d} text={text} tmp={currentItem} currentCoords={currentCoords}/>);
        }

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
                            showNotification({
                                id:'new-item',
                                loading:false,
                                title:`${change.doc.data().displayName} added a new image at (${x},${y})`,
                                autoClose:3600,
                            })
                            createMapButton(x,y,change.doc.data());
                            if (currentCoords.x === x && currentCoords.y === y){
                                // TODO: add something here to make like transition?
                                // TODO: use setDisplay image here IF current item changes, should change what is being shown
                                // maybe keep a small log of last X pictures?
                                // update current item
                                setCurrentItem(map_array[x][y]);
                                let image_text = `${currentItem.artName} by ${currentItem.displayName}`;
                                setDisplayImage(<DisplayItem d={currentItem.timeEpoch} text={image_text} tmp={currentItem} currentCoords={currentCoords}/>)
                            }
                        }
                    }
                    if (change.type === "added") {
                        const x = change.doc.id[0];
                        const y = change.doc.id[2];
                        // update the item list at that coordinate
                        map_array[x][y] = change.doc.data();
                        // console.log(x,y," added item @ map array data:",map_array[x][y]);
                        createMapButton(x,y,change.doc.data());
                        if (currentCoords.x === x && currentCoords.y === y){
                            // TODO: add something here to make like transition?
                            // TODO: use setDisplay image here
                            // maybe keep a small log of last X pictures?
                            // update current item
                            setCurrentItem(map_array[x][y]);
                            let image_text = `${currentItem.artName} by ${currentItem.displayName}`;
                            setDisplayImage(<DisplayItem d={currentItem.timeEpoch} text={image_text} tmp={currentItem} currentCoords={currentCoords}/>)
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
        <Grid>
            <Grid.Col span={6} style={{ maxWidth: 500}}>
                    <Paper shadow="xs" p="md" withBorder>
                        {displayImage}
                    </Paper>
            </Grid.Col>
            <Grid.Col span={3} style={{ minWidth: 500 }}>
                <Center inline>
                    <Paper shadow="xl" radius="md" p="md" withBorder>
                        <SimpleGrid cols={10}>
                            {itemList}
                        </SimpleGrid>
                    </Paper>
                </Center>
            </Grid.Col>
        </Grid>
    )
    // read entire table
}
export default Map;