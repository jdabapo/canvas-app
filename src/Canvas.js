import React, { useState, useEffect, useRef, useContext }from 'react';
import { 
  ColorInput, 
  Paper,
  Text, 
  TextInput, 
  Button, 
  Radio,
  Center,
  Grid,
  Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

  const form = useForm({
    initialValues: {
      displayName: '',
      artName: '',
      description: '',
    },
  });

  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [lineWidth,setLineWidth] = useState(5);
  const [isDrawing,setIsDrawing] = useState(false);
  const [color,setColor] = useState('rgb(222, 0, 0)');
  // const currentCoords = useContext(CoordsContext);

  function submitHandler(values){
    // get the image saved in ref & timestamp
    const tmp = canvasRef.current.toDataURL('image/png',0.3);
    const toSubmit = {
      artName:values.artName,
      displayName:values.displayName,
      description:values.description,
      timeEpoch:Date.now(),
      imagePNG:tmp,
    };
    console.log(toSubmit);
    async function setInMap(x,y){
      const key = x + "." + y;
      // get the doc, see if there is a exists
      const docRef = await getDoc(db,"map",key);
      if (docRef.exists()){
        console.log('changing this doc');
      }
      await setDoc(doc(db,"map",key),toSubmit);
    }
    setInMap(0,0);
    // first, try to read from square that is being written to
    
    // if there is square, check time since last written, if >5 minutes override

    // if not, request does not go through, send notification
    // construct object to send to db

    
    // resize picture, from whatever window height to 100 x 100 px 
    // resizePicture
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
    console.log('clicked');
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() =>{
    // load the canvas initially, make it size of screen width
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

  useEffect(() =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = "round";
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
  },[color,lineWidth])

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
            <Paper shadow="xl" radius="md" p="md" withBorder>
              <canvas
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onMouseLeave={endDrawing}
                ref = {canvasRef} 
              />
              <Center >
                <Text>select line color: </Text>
                <ColorInput format="rgb" value={color} onChange={setColor} />
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
            <TextInput
            required
            label="display name"
            placeholder="enter display name here!"
            {...form.getInputProps('displayName')}
            />
            <TextInput
              mt="md"
              label="art name"
              placeholder="enter art name here!"
              {...form.getInputProps('artName')}
            />
            <Textarea
              mt="md"
              mb="md"
              label="note"
              description="optional"
              placeholder="leave a note here!"
              {...form.getInputProps('description', { type: 'Textarea' })}
            />
            <Button
              type="submit"
            >
              Submit
            </Button>
          </form>
        </Paper>
      </Grid.Col>

    </Grid>

    </>
  );
}

export default Canvas;
