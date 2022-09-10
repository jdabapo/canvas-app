import React, { useEffect, useState } from 'react';
import { SimpleGrid,
         Grid,
         Paper,
         Center, 
        } from '@mantine/core';
import { collection, onSnapshot } from 'firebase/firestore';
import { Carousel } from '@mantine/carousel';
import { showNotification } from '@mantine/notifications';
import DisplayItem from './components/DisplayItem';
import MapButton from './components/MapButton';
import * as firebase from './utils/Firebase';

let db = firebase.db;
const placeholderItem = {
    description:'',
    imagePNG:'',
    artName:'',
    displayName:'',
    timeEpoch:'',
}    

const mapArray = new Array(10).fill(placeholderItem).map(() => new Array(10).fill(placeholderItem));
function Map(){
    // array should be 10x10 (0-9)
    const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
    const [itemList,setItemList] = useState([]);
    const [images,setImages] = useState([]);
    const [currentItem,setCurrentItem] = useState({});
    const [displayImage,setDisplayImage] = useState(null);


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
        let allDisplay = [];
        if (currentItem.displayName === ''){
            tmp.description = "nothing is here...";
            tmp.imagePNG = noitem;
            allDisplay.push(<DisplayItem key={tmp.timeEpoch} d={tmp.timeEpoch} tmp={tmp} currentCoords={currentCoords}/>)
            setDisplayImage(allDisplay);
        }
        else if(currentCoords.x === -1 && currentCoords.y === -1){
            allDisplay.push(<DisplayItem key={tmp.timeEpoch} d={tmp.timeEpoch} tmp={tmp} currentCoords={currentCoords}/>)
            setDisplayImage(allDisplay);
        }
        else if (currentItem.priorImages && currentItem.priorImages.length > 0){
            let imageText;
            let tmpFix = 0;
            // add all the prior images
            currentItem.priorImages.map((image)=>{
                imageText = `${image.artName} by ${image.displayName}`;
                d = new Date(0);
                d.setUTCMilliseconds(image.timeEpoch);
                allDisplay.unshift(
                    <Carousel.Slide key={tmpFix}>
                        <DisplayItem  d={d} text={imageText} tmp={image} currentCoords={currentCoords}/>
                    </Carousel.Slide>
                );
                tmpFix += 1;
            });
            // push current item
            imageText = `${currentItem.artName} by ${currentItem.displayName}`;
            d = new Date(0);
            d.setUTCMilliseconds(currentItem.timeEpoch);
            allDisplay.unshift(
                <Carousel.Slide key={tmpFix}>
                    <DisplayItem  d={d} text={imageText} tmp={currentItem} currentCoords={currentCoords}/>
                </Carousel.Slide>
            );
            setDisplayImage(
                <Carousel>
                    {allDisplay}
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
            const clickHandler = (event) =>{
                const coords = event.currentTarget.value;
                const x = Number(coords[1]);
                const y = Number(coords[0]);
                setCurrentCoords({x,y})
                setCurrentItem(mapArray[y][x]);
                let tmpList = [];
                // console.log("click",itemList)
                // TODO: problem is itemList is not being updated before the clickhandler fires
                // itemList.forEach(inner => {
                //     console.log(inner);
                //     tmpList.push(inner.slice())
                //     console.log(tmpList);
                // });
                // tmpList[y][x] = <div>fjj</div>
                // setItemList(tmpList)
            }
            // set up the listener
            unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
                querySnapshot.docChanges().forEach((change)=>{
                    const x = change.doc.id[0];
                    const y = change.doc.id[2];
                    if (change.type === "modified") {
                        // update the item list at that coordinate
                        if (change.doc.data().displayName){
                            mapArray[x][y] = change.doc.data();
                            // MapButton(x,y,change.doc.data(),clickHandler);
                            if (currentCoords.x === x && currentCoords.y === y){
                                // TODO: add something here to make like transition?
                                // TODO: use setDisplay image here IF current item changes, should change what is being shown
                                // maybe keep a small log of last X pictures?
                                // update current item
                                setCurrentItem(mapArray[x][y]);
                                let imageText = `${currentItem.artName} by ${currentItem.displayName}`;
                                setDisplayImage(<DisplayItem d={currentItem.timeEpoch} text={imageText} tmp={change.doc.data()} currentCoords={currentCoords}/>)
                            }
                        }
                    }
                    if (change.type === "added" || change.type === "removed") {
                        showNotification({
                            id:'new-item',
                            loading:false,
                            title:`${change.doc.data().displayName} added a new image at (${y},${x})`,
                            autoClose:3600,
                        })
                        // update the item list at that coordinate
                        mapArray[x][y] = change.doc.data();
                        // console.log(x,y," added item @ map array data:",mapArray[x][y]);
                        // MapButton(x,y,change.doc.data(),clickHandler);
                        if (currentCoords.x === x && currentCoords.y === y){
                            // TODO: add something here to make like transition?
                            // TODO: use setDisplay image here
                            // maybe keep a small log of last X pictures?
                            // update current item
                            setCurrentItem(mapArray[x][y]);
                            let imageText = `${currentItem.artName} by ${currentItem.displayName}`;
                            setDisplayImage(<DisplayItem d={currentItem.timeEpoch} text={imageText} tmp={currentItem} currentCoords={currentCoords}/>)
                        }
                    }
                });
                // start the initial item list
                let item_list;
                item_list = mapArray.map((rows,row_idx)=>{
                    let tmp = [];
                    rows.map((cell,col_idx)=>{
                        tmp.push(MapButton(row_idx,col_idx,cell,clickHandler));
                    })
                    return tmp;
                })
                setItemList(item_list);
            });
        };
        getMap(db).then(console.log('Map has been loaded')).then(console.log(itemList));
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