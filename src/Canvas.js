import React, { useState, useEffect, useRef }from 'react';
import { 
  ColorInput, 
  Paper,
  Text, 
  TextInput, 
  Button, 
  Radio,
  Center,
  Grid,
  Textarea, 
  Popover,
  SimpleGrid,
  Stack,
  Dialog,
  Group
  } from '@mantine/core';
import { useForm } from '@mantine/form';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { showNotification, updateNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons';

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

// given a set of images, find largest width and height, and draw each of the images onto a canvas with that size.
function normalizeImages(images){

}

function Canvas() {
  const placeholder_item = {
    description:'',
    imagePNG:'',
    artName:'',
    displayName:'',
    timeEpoch:''
}
  const map_array = new Array(10).fill(placeholder_item).map(() => new Array(10).fill(placeholder_item));
  
  const form = useForm({
    initialValues: {
      displayName: '',
      artName: '',
      description: '',
      x:-1,
      y:-1,
    },
  });
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [lineWidth,setLineWidth] = useState(5);
  const [isDrawing,setIsDrawing] = useState(false);
  const [color,setColor] = useState('rgb(222, 0, 0)');
  const [currentCoords,setCurrentCoords] = useState({x:0,y:0});
  const [opened,setOpened] = useState(false);
  const [dropdown,setDropdown] = useState([]);

  const clickHandler = (event) => {
    const coords = event.currentTarget.value;
    const tmp = {x:coords[0],y:coords[1]};
    setCurrentCoords(tmp);
  }

  function createMapButton(row_idx,col_idx,cell) {
    let coords = '' + row_idx + col_idx;
    // TODO: find out how to change color of button
    return (
      <Button
          size='xs'
          color="blue"
          key={coords}
          value={coords}
          onClick={clickHandler}
          variant="filled">
      </Button>
    )
  }

  async function submitToDB(x,y,toSubmit){
    const key = x + "." + y;
    const docRef = doc(db,"map",key);
    const docSnap = await getDoc(docRef);
    // see if doc exists @ that x,y
    if(docSnap.exists()){
      const docData = docSnap.data();
      // TODO: look at this https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array
      // if doc has an array, update it
      if (docData.priorImages){
        // if goes to 10, need to replace it so only 10 datapoints exist
        if (docData.priorImages.length === 10){
          console.log('removing oldest');
          await updateDoc(docRef,{
            priorImages:arrayRemove(docData.priorImages[0])
          })
        }
        delete docData.priorImages;
        await updateDoc(docRef,{
          priorImages:arrayUnion(docData)
        });
        // if not, just add onto back of array
      }
      else{
        await updateDoc(docRef,{
          priorImages:[]
        });
      }
      await updateDoc(docRef,{
        artName: toSubmit.artName,
        description: toSubmit.description,
        displayName: toSubmit.displayName,
        imagePNG: toSubmit.imagePNG,
      });
    }
    else{
      // if no images there, add a new field
      let tmp = toSubmit;
      console.log(tmp);
      await setDoc(docRef,toSubmit);
    }
  }

  function submitHandler(values){
    // get the image saved in ref & timeEpoch
    const tmp = canvasRef.current.toDataURL('image/png',0.3);
    const toSubmit = {
      artName:values.artName,
      displayName:values.displayName,
      description:values.description,
      timeEpoch:Date.now(),
      imagePNG:tmp,
    };
    showNotification({
      id: 'load-data',
      loading: true,
      title: 'uploading your art...',
      message: 'you cannot close this yet, please wait for your data to send!',
      autoClose: false,
      disallowClose: true,
    });
    submitToDB(currentCoords.x,currentCoords.y,toSubmit).then(
      setTimeout(() => {
        updateNotification({
          id: 'load-data',
          color: 'teal',
          title: 'data successfully uploaded!',
          message: `go to the map coordinates (${currentCoords.x},${currentCoords.y}) to view your art!`,
          icon: <IconCheck size={16} />,
          autoClose: 2500,
        });
      }, 1000)
    );

    
  }

  function computePointInCanvas(x, y){
    // subtract top left canvas from mouse move listener
    // need bounding box
    if (!canvasRef.current){
      return null;
    }
    const boundingBox = canvasRef.current.getBoundingClientRect();
    return {
      x: x - boundingBox.left,
      y: y - boundingBox.top,
    };
  }

  function clearCanvas(){
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  // set up onSnapshot for the grid
  useEffect(()=>{
    let unsubscribe;
    async function getMap(db){
        // set up the listener
        unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{

            querySnapshot.docChanges().forEach((change)=>{

              const x = change.doc.id[0];
              const y = change.doc.id[2];
              if (change.doc.data().displayName){
                // all the filled squares shoud now be red
                // TODO: find out why its not turning red
                map_array[x][y] = change.doc.data();
                createMapButton(x,y,change.doc.data());
              }
            })
        });
        // start the initial item list
        // every button should be blue
        let dropdown;
        dropdown = map_array.map((rows,row_idx)=>{
            let tmp = [];
            rows.map((cell,col_idx)=>{
                tmp.push(createMapButton(row_idx,col_idx,cell));
            })
            return tmp;
        })
        setDropdown(dropdown);
    };
    getMap(db);
    return () => unsubscribe();
  },[])

  // set up the canvas
  useEffect(() =>{
    // load the canvas initially, make it size of screen width
    // TODO: Fix this width && Fix for mobile
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth / 3;
    canvas.height = window.innerHeight / 3;
    canvas.style.width = `${window.innerWidth / 3}`;
    canvas.style.height = `${window.innerHeight / 3}`;
    canvas.style.border = "1px solid black";
    
    const context = canvas.getContext('2d');
    context.scale(1,1);
    context.lineCap = "round";
    context.lineWidth = 5;
    context.strokeStyle = color;
    contextRef.current = context;

  },[])

  // when color or linewidth changes
  useEffect(() =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = "round";
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
  },[color,lineWidth])

  // drawing functions
  const startDrawing = ({nativeEvent}) =>{
    const { x, y } = computePointInCanvas(nativeEvent.x,nativeEvent.y);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x,y);
    setIsDrawing(true);
  }
  
  const endDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  }
  
  const draw = ({nativeEvent}) => {
    if (!isDrawing){
      return;
    }
    const { x, y } = computePointInCanvas(nativeEvent.x,nativeEvent.y);
    contextRef.current.lineTo(x,y);
    contextRef.current.stroke();
  }

  return (
    <>
    <Grid grow>
      {/* Canvas */}
      <Grid.Col span={3}>
          <Center inline>
            <Paper shadow="xl" radius="md" p="md" withBorder >
              <canvas
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onMouseLeave={endDrawing}
                ref = {canvasRef} 
              />
              <Center>
                <Text weight={500}>select line color: </Text>
                {/* TODO: Change this because it lags too much*/}
                <ColorInput ml="sm" format="rgb" value={color} onChange={setColor} />
                <Button
                  m="md"
                  variant='gradient'
                  onClick={clearCanvas}
                  gradient={{from: 'blue', to:'black', deg:105}}
                >
                  clear canvas
                </Button>
              </Center>
              <Radio.Group
                color='black'
                value={lineWidth}
                onChange={setLineWidth}
                label="select line width"
              >
                <Radio value="2" label="small" />
                <Radio value="5" label="medium" />
                <Radio value="10" label="large" />
                <Radio value="15" label="xtra large" />
              </Radio.Group>
            </Paper>
          </Center>
      </Grid.Col>
      {/* Form */}
      <Grid.Col span={3}>
        <Paper shadow="xl" radius="md" p="md" withBorder>
          <form onSubmit={form.onSubmit((values)=> submitHandler(values))}>
            <Text mb="md" weight={500}>enter information about your art</Text>
            <TextInput
              required
              mb="md"
              label="art name"
              placeholder="enter art name here!"
              {...form.getInputProps('artName')}
            />
            <TextInput
            required
            label="display name"
            placeholder="enter display name here!"
            {...form.getInputProps('displayName')}
            />
            <Textarea
              mt="md"
              mb="md"
              label="note"
              description="optional"
              placeholder="leave a note here!"
              {...form.getInputProps('description', { type: 'Textarea' })}
            />
            <Text weight={500}>current selected coordinates are x: {currentCoords.x} y: {currentCoords.y}</Text>
            <br></br>
            <Stack spacing="sm">
              {/*TODO: fix this, does not appear on some screens */}
              <Button
                  variant='outline'
                  gradient={{ from: 'blue', to:'pink', deg:25}}
                  onClick={() => setOpened((o) => !o)}
                  >select coordinates
              </Button>
              <Button
                variant='gradient'
                gradient={{from: 'blue', to:'pink', deg:5}}
                onClick={() => setTimeout(setOpened(() => false),250)}
                type="submit"
              >
                submit your art
              </Button>
            </Stack>
          </form>
        </Paper>
      </Grid.Col>
    </Grid>
    <Dialog
        opened={opened}
        size="lg"
        shadow="xl" p={30} 
        withCloseButton
        onClose={() => setOpened(false)}
        radius="md"
        position={{ bottom: 20, left: 20 }}

      >
        <Stack>
          <Paper align="center">
            <Text weight={500}>select box to place art</Text>
            <Text>current selected coordinates are ({currentCoords.x},{currentCoords.y})</Text>
          </Paper>
        </Stack>
        <SimpleGrid cols={10}>
          {dropdown}
        </SimpleGrid>
    </Dialog>
    </>
  );
}

export default Canvas;
