import React, { useState, useEffect, useRef }from 'react';
import { 
  ColorPicker,
  DEFAULT_THEME,
  Paper,
  Text, 
  TextInput, 
  Button, 
  Radio,
  Center,
  Grid,
  Textarea,
  SimpleGrid,
  Stack,
  Popover,
  Modal,
  Card,
  Image,
  Menu,
  ActionIcon,
  Highlight,
  Group
  } from '@mantine/core';
import MapButton from './components/MapButton';
import { enableUndo } from 'undo-canvas';
import { useForm } from '@mantine/form';
import { useOs, useDisclosure, useToggle } from '@mantine/hooks';
import { doc, setDoc, getDoc, onSnapshot, collection, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { showNotification, updateNotification } from '@mantine/notifications';
import { IconCheck, IconQuestionMark, IconArrowBackUp, IconArrowForwardUp, IconEraser, IconPencil, IconPalette, IconClearAll, IconTrash, IconColorPicker } from '@tabler/icons';
import { openModal } from '@mantine/modals';
import { useLocation } from 'react-router-dom';
import * as firebase from './utils/Firebase';

const app = firebase.app;
const db = firebase.db;

function Canvas() {
  const placeholderItem = {
    description:'',
    imagePNG:'',
    artName:'',
    displayName:'',
    timeEpoch:''
  }
  const mapArray = new Array(10).fill(placeholderItem).map(() => new Array(10).fill(placeholderItem));
  const clickedCoords = useLocation();
  const form = useForm({
    initialValues: {
      displayName: '',
      artName: '',
      description: '',
      x:-1,
      y:-1,
    },
  });
  const noitem = "/noitem.jpg";
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [lineWidth,setLineWidth] = useState('5');
  const [isDrawing,setIsDrawing] = useState(false);
  const [color,setColor] = useState('#CC0000');
  const [currentCoords,setCurrentCoords] = useState({x:-1,y:-1});
  const [priorCoords,setPriorCoords] = useState({x:-1,y:-1});
  const [dropdown,setDropdown] = useState([]);
  const [openedModal,setOpenedModal] = useState(false);
  const [openColors,setOpenColors] = useState(false);
  const [openPopover, { close, open }] = useDisclosure(false);
  const [draw_erase, toggle] = useToggle(['draw', 'erase']);
  const rootRefs = useRef(new Array(10).fill(null).map(()=> new Array(10).fill(null)));
  const imageRefs = useRef(new Array(10).fill(null).map(()=> new Array(10).fill(null)));

  const os = useOs();
  // TODO: Make the text work
  // TODO: Make modal open when art is submitted
  // TODO: Make live update to text (make this into a component?) https://mantine.dev/core/modal/


  const openModalHandler = (toSubmit) => {
    openModal({
      title: 'view your art!',
      children: (
        <Card>
          <Card.Section>
            <Image
              src={toSubmit.imagePNG}
              height={350}
              width={350}
              alt={toSubmit.artName}
            />
          </Card.Section>
          <Text size="sm" color="dimmed">
            {toSubmit.description}
          </Text>
          <a href="Board">
            click to view your art on the board
          </a>
        </Card>
      ),
    });
  }

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

const mapClickHandler = (event) =>{
    const coords = event.currentTarget.id;
    const x = Number(coords[2]);
    const y = Number(coords[0]);
    setCurrentCoords({x,y})
}



  const redoHandler = () =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.redoTag()
  }

  const undoHandler = () =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.undoTag()
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
        upvotes:toSubmit.upvotes,
        downvotes:toSubmit.downvotes,
      });
    }
    else{
      // if no images there, add a new field 
      toSubmit["priorImages"] = []
      await setDoc(docRef,toSubmit);
    }
  }

  function showErrorNotif(e){
    let msg;
    if (e === "no-coords"){
      msg = 'select valid coords!'
    }
    else if(e === "no-artName"){
      msg = 'write a name for your masterpiece!'

    }
    else if(e === "no-displayName"){
      msg = 'what is the name of the artist?'

    }
    return(showNotification({
      id: 'error-msg',
      loading: false,
      color: "red",
      title: 'error',
      message: msg,
      autoClose: 5000,
      disallowClose: false,
    }))
  }

  function submitHandler(values){
    // get the image saved in ref & timeEpoch
    if(currentCoords.x === -1 || currentCoords.y === -1){
      showErrorNotif("no-coords");
      return;
    }
    else if (!values.artName){
      showErrorNotif("no-artName");
      return;

    }
    else if (!values.displayName){
      showErrorNotif("no-displayName");
      return;
    }
    const img = canvasRef.current.toDataURL('image/png',0.3);
    const toSubmit = {
      artName:values.artName,
      displayName:values.displayName,
      description:values.description,
      timeEpoch:Date.now(),
      imagePNG:img,
      upvotes:0,
      downvotes:0
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
    ).then(()=>{
      openModalHandler(toSubmit)
    });
    
    
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
      unsubscribe = onSnapshot(collection(db, "map"),(querySnapshot)=>{
        querySnapshot.docChanges().forEach((change)=>{
            const x = change.doc.id[0];
            const y = change.doc.id[2];
            mapArray[x][y] = change.doc.data();
        });
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
                  width={29}
                  height={29}
                  onClick={mapClickHandler}
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
      setDropdown(item_list);
    })};
    getMap(db);
    return () => unsubscribe();
  },[])

  // set up the canvas and current coords if necessary
  useEffect(() =>{
    // load the canvas initially, make it size of screen width
    if(clickedCoords.state && clickedCoords.state.coords){
      let x = clickedCoords.state.coords.y;
      let y = clickedCoords.state.coords.x;
      setCurrentCoords({x,y});
    }
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

    enableUndo(context);
    if (os === 'ios'){
      window.addEventListener("touchstart",startDrawing);
      canvas.style["touch-action"] = "none";
    }
  },[])

  useEffect(()=>{
    if(priorCoords.x === -1){
      setPriorCoords(currentCoords);
    }
  },[currentCoords.x,currentCoords.y]);

  // when color or linewidth changes
  useEffect(() =>{
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = "round";
    context.lineWidth = lineWidth;
    if(draw_erase === "draw"){
      context.strokeStyle = color;
    }
    else{
      context.strokeStyle = "#FFFFFF";
    }
  },[color,lineWidth,draw_erase])

  // drawing functions
  const startDrawing = ({nativeEvent}) =>{
    contextRef.current.beginPath();
    if(os === 'ios' || os === 'android'){
      if (nativeEvent && nativeEvent.touches){
        const clientX = nativeEvent.touches[0].clientX;
        const clientY = nativeEvent.touches[0].clientY;
        const { cx, cy } = computePointInCanvas(clientX,clientY);
        contextRef.current.putTag();
        contextRef.current.moveTo(cx, cy);
      }
    }
    else{
      const { x, y } = computePointInCanvas(nativeEvent.x,nativeEvent.y);
      contextRef.current.putTag();
      contextRef.current.moveTo(x,y);
    }
    setIsDrawing(true);
  }
  
  const endDrawing = () => {
    contextRef.current.closePath();
    contextRef.current.putTag();
    setIsDrawing(false);
  }
  
  const draw = ({nativeEvent}) => {
    if (!isDrawing){
      return;
    }
    if(os === 'ios' || os === 'android'){
      const clientX = nativeEvent.touches[0].clientX;
      const clientY = nativeEvent.touches[0].clientY;
      const { x, y } = computePointInCanvas(clientX,clientY);
      contextRef.current.lineTo(x, y);
    }
    else{
      const { x, y } = computePointInCanvas(nativeEvent.x,nativeEvent.y);
      contextRef.current.lineTo(x,y);

    }
    contextRef.current.stroke();
  }

  return (
    <>
    <Grid grow>
      {/* Canvas */}
      <Grid.Col span={3}>
            <Paper shadow="xl" radius="md" p="md" withBorder>
              <Center
              mb={3}>
              <canvas
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={endDrawing}
                onTouchMove={draw}
                ref = {canvasRef} 
              />
              </Center>
              <Center>
                <Menu opened={openColors} onChange={setOpenColors}>
                  <Menu.Target>
                    <Button
                    mr={5}
                    size='xs'
                    styles={(theme) => ({
                      root: {
                        backgroundColor:color,
                        '&:hover': {
                          backgroundColor: theme.fn.darken(color, 0.05),
                        },
    
                      },
    
                    })}
                    > <Text weight={500}>select line color</Text></Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <ColorPicker
                    format="hex"
                    value={color}
                    onChange={setColor}
                    withPicker={false}
                    size='md'
                    swatches={[
                      ...DEFAULT_THEME.colors.red,
                      ...DEFAULT_THEME.colors.green,
                      ...DEFAULT_THEME.colors.cyan,
                      ...DEFAULT_THEME.colors.grape,
                      ...DEFAULT_THEME.colors.blue,
                      ...DEFAULT_THEME.colors.yellow,
                      ...DEFAULT_THEME.colors.gray,
                    ]}
                  />
                  </Menu.Dropdown>
                </Menu>
                  <ActionIcon
                    onClick={()=>toggle()}
                    variant='filled'
                    color="gray"
                    mr={3}
                  >
                    {draw_erase === "draw" && <IconPencil/>}
                    {draw_erase === "erase" && <IconEraser/>}
                  </ActionIcon>
                  <ActionIcon
                    onClick={undoHandler}
                    variant='outline'
                    color="orange"
                    mr={3}
                  >
                    <IconArrowBackUp/>
                  </ActionIcon>
                  <ActionIcon
                    onClick={redoHandler}
                    variant='outline'
                    color="green"
                    mr={3}
                  >
                    <IconArrowForwardUp/>
                  </ActionIcon>
                  <ActionIcon
                    onClick={clearCanvas}
                    variant='outline'
                    color="red"
                    mr={3}
                  >
                    <IconTrash/>
                  </ActionIcon>
              </Center>
              <Center>
              <Radio.Group
                color='black'
                value={lineWidth}
                onChange={setLineWidth}
                label="select line width"
              >
                <Radio value="2" label="sm" />
                <Radio value="5" label="md" />
                <Radio value="10" label="lg" />
                <Radio value="15" label="xl" />
                <Radio value="50" label="really big" />
              </Radio.Group>
              </Center>
            </Paper>
      </Grid.Col>
      {/* Form */}
      <Grid.Col span={3}>
        <Paper shadow="xl" radius="md" p="md" withBorder>
          <form onSubmit={form.onSubmit((values)=> submitHandler(values))}>
            <Group spacing={10}>
              <Text weight={500}>enter information about your art</Text>
              

            </Group>
            <TextInput
              mb="md"
              description="required"
              label="art name"
              placeholder="enter art name here!"
              {...form.getInputProps('artName')}
            />
            <TextInput
            label="artist"
            description="required"
            placeholder="enter artist name here!"
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
            <Group spacing={5}>
            {currentCoords.x === -1 && currentCoords.y === -1 && <Text weight={500}>select your coordinates first!</Text>}
            {currentCoords.x !== -1 && currentCoords.y !== -1 && <Text weight={500}>current coordinates are x:{currentCoords.y},  y:{currentCoords.x}</Text>}
            <Popover width={200} position="bottom" withArrow shadow="md" opened={openPopover}>
                <Popover.Target>
                  <ActionIcon variant='outline' size={'xs'} onMouseEnter={open} onMouseLeave={close}>
                    <IconQuestionMark />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown sx={{ pointerEvents: 'none' }}>
                  <Highlight highlightColor="red" highlight={[
                    "tiles",
                    "red"
                  ]}>tiles with red are taken</Highlight>
                  <Highlight highlightColor="blue" highlight={[
                    "tiles",
                    "blue"
                  ]}>tiles with blue are open</Highlight>
                </Popover.Dropdown>
              </Popover>
              </Group>
            <br></br>
            <Stack spacing="sm">
              {/*TODO: fix this, does not appear on some screens */}
              <Button
                  variant='outline'
                  gradient={{ from: 'blue', to:'pink', deg:25}}
                  onClick={() => {setOpenedModal(true)}}
                  >select coordinates
              </Button>
              <Button
                variant='outline'
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

    <Modal
      opened={openedModal}
      onClose={() => setOpenedModal(false)}
      title="select coordinate!"
    >
      
      {currentCoords.x === -1 && currentCoords.y === -1 && <Text weight={500}>select your coordinates first!</Text>}
      {currentCoords.x !== -1 && currentCoords.y !== -1 && <Text weight={500}>current coordinates are x:{currentCoords.y},  y:{currentCoords.x}</Text>}
      <SimpleGrid cols={10}>
        {dropdown}
      </SimpleGrid>
    </Modal>
    </>
  );
}

export default Canvas;
