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
  Textarea, 
  Popover,
  SimpleGrid} from '@mantine/core';
import { useForm } from '@mantine/form';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';

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
    displayName:''
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
  const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
  const [itemList,setItemList] = useState([]);

  const clickHandler = (event) =>{
    const coords = event.currentTarget.value;
    const x = coords[0];
    const y = coords[1];
    setCurrentCoords({x,y})
  }

  function createMapButton(row_idx,col_idx,cell) {
    let coords = '' + row_idx + col_idx;
    let obj = {
        coords: coords,
        color: cell.displayName ? "red" : "blue",
    }
    return (<Button
        size='xs'
        color={obj.color}
        key={obj.coords}
        value={coords}
        onClick={clickHandler}
        variant="filled">
    </Button>)
  }

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

                map_array[x][y] = change.doc.data();
                console.log(x,y," added item @ map array data:",map_array[x][y]);
                createMapButton(x,y,change.doc.data());
              }
            })
        });
        // start the initial item list
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
            <Paper shadow="xl" radius="md" p="md" withBorder>
              <canvas
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onMouseLeave={endDrawing}
                ref = {canvasRef} 
              />
              <Center>
                <Text weight={500}>select line color: </Text>
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
            <Popover width={400} trapFocus position="right">
              <Popover.Target>
                <Button>select coordinates</Button>
              </Popover.Target>
              <Popover.Dropdown>
                <SimpleGrid cols={10}>
                  {dropdown}
                </SimpleGrid>
              </Popover.Dropdown>
            </Popover>
            <Button
              type="submit"
            >
              submit your art
            </Button>
          </form>
        </Paper>
      </Grid.Col> 
    </Grid>

    </>
  );
}

export default Canvas;
