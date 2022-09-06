import { Text, Anchor, Button, Center, Highlight, List, Paper, Title } from '@mantine/core';
import React, { useState, useEffect, useRef }from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import DisplayItem from './components/DisplayItem';
import { Carousel } from '@mantine/carousel';
import * as firebase from './utils/Firebase'

const db = firebase.db;



export default function Home(){
    const [images,setImages] = useState([]);
    const [displayImage,setDisplayImage] = useState(null);
    const [items,setItems] = useState([]);
    const clickHandler = () =>{
        console.log(items);
        let selected = items.sort(() => Math.random() - Math.random()).slice(0, 5);
        setImages(selected);
    }
    useEffect(()=>{
        // grab 5 random images from board here
        async function getRandomImages(db,numOfImages=5){
            const mapCollection = collection(db, "map");
            const docsSnap = await getDocs(mapCollection);
            let tmp = []
            docsSnap.forEach((doc) =>{
                if(doc.data().displayName){
                    tmp.push(doc.data());
                }
            });
            // Shuffle array
            const shuffled = tmp.sort(() => 0.5 - Math.random());
            // Get sub-array of first n elements after shuffled
            let selected = shuffled.slice(0, numOfImages);
            setImages(selected);
            setItems(tmp);
        }
        getRandomImages(db);
    },[])

    useEffect(()=>{
        if(images.length === 0){
            return;
        }
        let allDisplay = [];
        let imageText;
        let tmpFix = 0;
        let d;
        images.map((image)=>{
            imageText = `${image.artName} by ${image.displayName}`;
            d = new Date(0);
            d.setUTCMilliseconds(image.timeEpoch);
            allDisplay.unshift(
                <Carousel.Slide key={tmpFix}>
                    <DisplayItem  d={d} text={imageText} tmp={image} />
                </Carousel.Slide>
            );
            tmpFix += 1;
        })
        setDisplayImage(
            <Carousel
            slideSize="70%"  slideGap="md" 
            >
                {allDisplay}
            </Carousel>
        )
    },[images,items])
    return(
        <>
        <Center>
            <Paper>
                <Title 
                    order={1}
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}
                    weight={500}
                >
                    this is doodlepad!
                </Title>
                        <Text>
                        to start, click on <Anchor href='/Canvas'>canvas</Anchor> to begin drawing
                        </Text>
                        <Text>
                        view all art on the <Anchor href='/Board'>board</Anchor>
                        </Text>
                        <Text>
                        see all prior art on the <Anchor href='/Map'>map</Anchor>
                        </Text>
                <Button onClick={clickHandler}>
                    view more art
                </Button>
            </Paper>
        </Center>
        {displayImage}
        </>
    )
}