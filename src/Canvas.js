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
import { useOs, useForceUpdate } from '@mantine/hooks';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { showNotification, updateNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons';
import { openModal, closeAllModals } from '@mantine/modals';


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
  const [dropdown,setDropdown] = useState([]);
  const os = useOs();
  const forceUpdate = useForceUpdate();

  // TODO: Make the text work
  // TODO: Make modal open when art is submitted
  // TODO: Make live update to text (make this into a component?) https://mantine.dev/core/modal/
  const openModalHandler = ({selectedCoords}) => {
    let coords;
    if(!selectedCoords){
      coords = "no coords selected yet!"
    }
    else{
      coords = `(${selectedCoords[0]},${selectedCoords[1]})`;
    }
    openModal({
      title: 'select box to place art',
      children: (
        <>
        <Text>current selected coords are: {coords}</Text>
        <SimpleGrid cols={10}>
          {dropdown}
        </SimpleGrid>
        </>
      ),
    });
  }

  const clickHandler = (event) => {
    const coords = event.currentTarget.value;
    console.log(coords);
    setCurrentCoords({x:coords[0],y:coords[1]});
    //forceUpdate();
  }

  function createMapButton(row_idx,col_idx,cell) {
    let coords = '' + row_idx + col_idx;
    let color = "blue";
    if(cell.displayName){
      color = "red";
    }
    return (
      <Button
          size='xs'
          color={color}
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
      // if doc has an array, update it. ELSE, create an empty priorImages array
      if (docData.priorImages){
        // if goes to 10, need to replace it so only 10 datapoints exist
        if (docData.priorImages.length === 10){
          await updateDoc(docRef,{
            priorImages:arrayRemove(docData.priorImages[0])
          })

        }
          // TODO: Bug here, deletes the first image shown
          // delete docData.priorImages;
          let tmp = docData;
          tmp.priorImages = []
          await updateDoc(docRef,{
            priorImages:arrayUnion(tmp)
          });
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
        timeEpoch: toSubmit.timeEpoch,
      });
    }
    else{
      // if no images there, add a new field 
      toSubmit["priorImages"] = []
      await setDoc(docRef,toSubmit);
    }
  }

  function submitHandler(values){
    // get the image saved in ref & timeEpoch
    const img = canvasRef.current.toDataURL('image/png',0.3);
    const toSubmit = {
      artName:values.artName,
      displayName:values.displayName,
      description:values.description,
      timeEpoch:Date.now(),
      imagePNG:img,
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
          message: `go to the map coordinates (${currentCoords.y},${currentCoords.x}) to view your art!`,
          icon: <IconCheck size={16} />,
          autoClose: 2500,
        });
      }, 1000)
    ).then(
      // create modal to show artwork and link to the map
      // TODO
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
      // start the initial item list
      // every button should be blue
      let dropdown;
      dropdown = map_array.map((rows,row_idx)=>{
          let row = [];
          rows.map((cell,col_idx)=>{
              row.push(createMapButton(row_idx,col_idx,cell));
          })
          return row;
      });
      setDropdown(dropdown);
      unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
          querySnapshot.docChanges().forEach((change)=>{
            const x = change.doc.id[0];
            const y = change.doc.id[2];
            if (change.doc.data().displayName){
              map_array[x][y] = change.doc.data();
              let changed_item = createMapButton(x,y,change.doc.data());
              dropdown[x][y] = changed_item;
              setDropdown(dropdown);
            }
          })
      });
    };
    getMap(db);
    return () => unsubscribe();
  },[])

  // set up the canvas
  useEffect(() =>{
    // load the canvas initially, make it size of screen width
    // TODO: Fix this width && Fix for mobile
    
    const canvas = canvasRef.current;
    canvas.width = "300";
    canvas.height = "300";
    canvas.style.width = "300px";
    canvas.style.height = "300px";
    canvas.style.border = "1px solid black";
    
    const context = canvas.getContext('2d');
    context.scale(1,1);
    context.lineCap = "round";
    context.lineWidth = 5;
    context.strokeStyle = color;
    contextRef.current = context;

    if (os === 'ios'){
      console.log("window is",document.body.getBoundingClientRect().width);

      canvas.width = document.body.getBoundingClientRect().width;
      canvas.height = document.body.getBoundingClientRect().width;
      canvas.style.width = document.body.getBoundingClientRect().width;
      canvas.style.height = document.body.getBoundingClientRect().width;
    }
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
            <Paper shadow="xl" radius="md" p="md" withBorder>
              <Center>
              <canvas
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onMouseLeave={endDrawing}
                ref = {canvasRef} 
              />
              </Center>
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
              <Center>
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
              </Center>
            </Paper>
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
            <Text weight={500}>current selected coordinates are x: {currentCoords.y} y: {currentCoords.x}</Text>
            <br></br>
            <Stack spacing="sm">
              {/*TODO: fix this, does not appear on some screens */}
              <Button
                  variant='outline'
                  gradient={{ from: 'blue', to:'pink', deg:25}}
                  onClick={openModalHandler}
                  >select coordinates
              </Button>
              <Button
                variant='gradient'
                gradient={{from: 'blue', to:'pink', deg:5}}
                type="submit"
              >
                submit your art
              </Button>
            </Stack>
          </form>
        </Paper>
      </Grid.Col>
    </Grid>
    </>
  );
}

export default Canvas;
