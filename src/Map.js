import React, { useEffect, useState, useRef } from 'react';
import { SimpleGrid,
         Grid,
         Paper,
         Center,
         Image, 
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
const noitem = "/noitem.jpg";
const mapArray = new Array(10).fill(placeholderItem).map(() => new Array(10).fill(placeholderItem));
function Map(){
    // array should be 10x10 (0-9)
    const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
    const [priorCoords,setPriorCoords] = useState({x:-1,y:-1});
    const [itemList,setItemList] = useState([]);
    const [currentItem,setCurrentItem] = useState({});
    const [displayImage,setDisplayImage] = useState(null);
    const rootRefs = useRef(new Array(10).fill(null).map(()=> new Array(10).fill(null)));
    const imageRefs = useRef(new Array(10).fill(null).map(()=> new Array(10).fill(null)));

    const mouseEnterHandler = (event) =>{
        // const coords = event.currentTarget.value;
        const coords = event.currentTarget.id;
        const x = Number(coords[2]);
        const y = Number(coords[0]);
        imageRefs.current[y][x].style.border = "5px solid black";
    }

    const mouseLeaveHandler = (event) =>{
        const coords = event.currentTarget.id;
        const x = Number(coords[2]);
        const y = Number(coords[0]);
        imageRefs.current[y][x].style.border = "0px solid black";
    }

    const clickHandler = (event) =>{
        const coords = event.currentTarget.id;
        const x = Number(coords[2]);
        const y = Number(coords[0]);
        setCurrentCoords({x,y})
        setCurrentItem(mapArray[y][x]);
        imageRefs.current[y][x].src = "/select.png";
    }
    
    // whenever a different is clicked
    useEffect(()=>{
        // pass the currentItem props to the thing
        if(priorCoords.x === -1){
            setPriorCoords(currentCoords);
        }
        else{
            let img = noitem;
            if(mapArray[priorCoords.y][priorCoords.x].displayName){
                img = mapArray[priorCoords.y][priorCoords.x].imagePNG;
            }
            imageRefs.current[priorCoords.y][priorCoords.x].src = img;
            setPriorCoords(currentCoords);
        }
        let tmp = {
            imagePNG:"/cat.jpg",
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
            // set up the listener
            unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
                querySnapshot.docChanges().forEach((change)=>{
                    const x = change.doc.id[0];
                    const y = change.doc.id[2];
                    if (change.type === "modified") {
                        // update the item list at that coordinate
                        if (change.doc.data().displayName){
                            mapArray[x][y] = change.doc.data();
                            if (currentCoords.x === x && currentCoords.y === y){
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
                        if (currentCoords.x === x && currentCoords.y === y){
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
                        let key = ''+row_idx+'.'+col_idx;
                        let img;
                        if(!cell.imagePNG){
                            img = noitem;
                        }
                        else{
                            img = cell.imagePNG;
                        }
                        tmp.push(
                        <Image
                            key={key}
                            width={36}
                            height={36}
                            onClick={clickHandler}
                            onMouseEnter={mouseEnterHandler}
                            onMouseLeave={mouseLeaveHandler}
                            id={key}
                            src={img}
                            ref={el => rootRefs.current[row_idx][col_idx] = el}
                            imageRef={el => imageRefs.current[row_idx][col_idx] = el}
                        />);
                    });
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