import { useState } from 'react';
import { 
        AppShell,
        Navbar,
        Header,
        Text,
        MediaQuery,
        Burger,
        Menu,
        Group,
        Image
     } from '@mantine/core';
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';


import { CurrentUser } from './Auth';
import Canvas from './Canvas';
import Map from  './Map';
import Home from './Home';
import Board from './Board';
import { UserContextProvider } from './utils/UserContext';


function App() {
  const [opened, setOpened] = useState(false);
  function clickHandler(){
    setOpened(!opened);
  }
  return (
      <BrowserRouter>
        <AppShell
          navbarOffsetBreakpoint="sm"
          asideOffsetBreakpoint="sm"
          navbar={
            <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
              <Menu>
                <Menu.Item onClick={clickHandler} component={Link} variant='link' to='/'>home</Menu.Item>
                <Menu.Item onClick={clickHandler} component={Link} variant='link' to='/Canvas'>canvas</Menu.Item>
                <Menu.Item onClick={clickHandler} component={Link} variant='link' to='/Map'>map</Menu.Item>
                <Menu.Item onClick={clickHandler} component={Link} variant='link' to='/Board'>board</Menu.Item>
                <Menu.Item onClick={clickHandler} component={Link} variant='link' to='/SignIn'>signin</Menu.Item>
              </Menu>
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
                    mr="xl"
                    
                  />
                </MediaQuery>
                <Group>
                  <Image src="/favicon.ico" width={50} height={50}/>
                  <Text weight={500}>doodlepad</Text>
                </Group>
              </div>
            </Header>
          }
        >
        <UserContextProvider>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/Canvas" element={<Canvas/>}/>
            <Route path="/Map" element={<Map/>}/>
            <Route path="/Board" element={<Board/>}/>
            <Route path="/SignIn" element={<CurrentUser/>}/>
            <Route/>
          </Routes>
        </UserContextProvider>
        </AppShell>
      </BrowserRouter>
  );
}



export default App;