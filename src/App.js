import { useState } from 'react';
import { 
        AppShell,
        Navbar,
        Header,
        Text,
        MediaQuery,
        Burger,
        useMantineTheme,
        Stack,
        ActionIcon
     } from '@mantine/core';
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';
import { IconAdjustments } from '@tabler/icons';

import Canvas from './Canvas';
import Map from  './Map';
import Home from './Home';
import Board from './Board';
function App() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  function clickHandler(){
    setOpened(!opened);
  }
  return (
    <BrowserRouter>
      <AppShell
        styles={{
          main: {
            background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          },
        }}
        navbarOffsetBreakpoint="sm"
        asideOffsetBreakpoint="sm"
        navbar={
          <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
            <Stack>
              <Text onClick={clickHandler} component={Link} variant='link' to='/'>Home</Text>
              <Text onClick={clickHandler} component={Link} variant='link' to='/Canvas'>Canvas</Text>
              <Text onClick={clickHandler} component={Link} variant='link' to='/Map'>Map</Text>
              <Text onClick={clickHandler} component={Link} variant='link' to='/Board'>Board</Text>
            </Stack>
          </Navbar>
        }
        header={
          <Header height={70} p="md">
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                <Burger
                  opened={opened}
                  onClick={clickHandler}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                  
                />
              </MediaQuery>

              <Text weight={500}>Sanvas</Text>
            </div>
          </Header>
        }
      >
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/Canvas" element={<Canvas/>}/>
          <Route path="/Map" element={<Map/>}/>
          <Route path="/Board" element={<Board/>}/>
          <Route/>
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}



export default App;