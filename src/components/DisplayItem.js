
import React from 'react'
import {
    Card,
    Image,
    Group,
    Text,
    Badge,
    Button,
    TextInput,
    ActionIcon,
    Center
} from '@mantine/core';
import { openModal, closeAllModals } from '@mantine/modals';
import {Link} from 'react-router-dom';
import * as firebase from '../utils/Firebase';
import { IconThumbUp, IconThumbDown, IconAlertTriangle } from '@tabler/icons';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { useCounter } from '@mantine/hooks';
const db = firebase.db;


function DisplayItem({d, text, tmp, currentCoords={x:-1,y:-1}}){
    // change image to the biggest image size
    const key = '' + currentCoords.y +'.'+ currentCoords.x;
    const [downvotes, downvoteinc] = useCounter(tmp.downvotes, { min: 0 });
    const [upvotes,upvoteinc] = useCounter(tmp.upvotes, { min: 0 });
    function reportHandler(){
        // TODO: edit this
        openModal({
            title: 'what was wrong with this artwork?',
            children: (
              <>
                <TextInput label="report " placeholder="report " data-autofocus />
                <Button fullWidth onClick={closeAllModals} mt="md">
                  Submit
                </Button>
              </>
            ),
          });
    }
    // increment upvote by 1
    // give notification too
    async function upvoteHandler(){
        console.log(currentCoords.x,currentCoords.y);
        const artDoc = doc(db,"map",key);
        const artDocSnap = await getDoc(artDoc);
        upvoteinc.increment();
        if(artDocSnap.data().upvotes !== undefined){
            await updateDoc(artDoc,{
                upvotes:increment(1)
            });
        }
        else{
            await updateDoc(artDoc,{
                upvotes:1
            });
        }
    }

    async function downvoteHandler(){
        console.log(key);
        console.log(currentCoords.x,currentCoords.y);
        const artDoc = doc(db,"map",key);
        const artDocSnap = await getDoc(artDoc);
        downvoteinc.increment();
        if(artDocSnap.data().downvotes !== undefined){
            await updateDoc(artDoc,{
                downvotes:increment(1)
            });
        }
        else{
            await updateDoc(artDoc,{
                downvotes:1
            });
        }
    }
    let ratingString = <Group>
                            <ActionIcon  color="green" variant="outline" size="lg" onClick={upvoteHandler}>
                                <IconThumbUp/>
                            </ActionIcon><Text>{upvotes}</Text>
                            <ActionIcon color="red" variant="outline" size="lg" onClick={downvoteHandler}>
                                <IconThumbDown/>
                            </ActionIcon>     
                            <Text>{downvotes}</Text>
                        </Group>;
    if(!tmp.description){
        tmp.description = "the author did not write anything for this art..."
    }
    else if(!d || d.toLocaleString() === 'Invalid Date'){
        d = "no time yet...";
    }
    if(!text){
        text = "there is no art here..."
    }
    return(
            <Card shadow="sm" radius="md" withBorder>
                <Center>
                <Card.Section>
                    <Image
                        src={tmp.imagePNG}
                        height={350}
                        width={350}
                        alt={tmp.artName}
                    />
                </Card.Section>
                </Center>
                <Group position="apart" mt="md" mb="xs">
                    <Text weight={500}>
                        {text}
                    </Text>
                    <Badge color="pink" variant="light">
                        {d ? d.toLocaleString(): "no time yet"}
                    </Badge>
                    {ratingString}
                </Group>
                <Text size="sm" color="dimmed"  lineClamp={5}>
                    {tmp.description}
                </Text>
                {currentCoords.x !== -1 &&
                    <Group>
                        <Button component={Link} to="/Canvas" state={{coords:currentCoords}}variant='outline'>put your art here at {currentCoords.x},{currentCoords.y}</Button>
                        <ActionIcon  variant='outline' color='red' size="lg" onClick={reportHandler}>
                            <IconAlertTriangle/>
                        </ActionIcon>         
                    </Group>
                }
            </Card>
    );
}

export default DisplayItem;