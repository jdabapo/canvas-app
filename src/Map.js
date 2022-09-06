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
const placeholder_item = {
    description:'',
    imagePNG:'',
    artName:'',
    displayName:'',
    timeEpoch:'',
}    

const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
function Map(){
    // array should be 10x10 (0-9)
    const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
    const [itemList,setItemList] = useState([]);
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
            const clickHandler = (event) =>{
                const coords = event.currentTarget.value;
                const x = Number(coords[1]);
                const y = Number(coords[0]);
                setCurrentCoords({x,y})
                setCurrentItem(map_array[y][x]);
                let tmp_list = [];
                console.log("click",itemList)
                // TODO: problem is itemList is not being updated before the clickhandler fires
                // itemList.forEach(inner => {
                //     console.log(inner);
                //     tmp_list.push(inner.slice())
                //     console.log(tmp_list);
                // });
                // tmp_list[y][x] = <div>fjj</div>
                // setItemList(tmp_list)
            }
            // set up the listener
            unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
                querySnapshot.docChanges().forEach((change)=>{
                    const x = change.doc.id[0];
                    const y = change.doc.id[2];
                    if (change.type === "modified") {
                        // update the item list at that coordinate
                        if (change.doc.data().displayName){
                            map_array[x][y] = change.doc.data();
                            showNotification({
                                id:'new-item',
                                loading:false,
                                title:`${change.doc.data().displayName} added a new image at (${x},${y})`,
                                autoClose:3600,
                            })
                            MapButton(x,y,change.doc.data(),clickHandler);
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
                        // update the item list at that coordinate
                        map_array[x][y] = change.doc.data();
                        // console.log(x,y," added item @ map array data:",map_array[x][y]);
                        MapButton(x,y,change.doc.data(),clickHandler);
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