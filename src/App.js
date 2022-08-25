import { useState } from 'react';
import { 
        AppShell,
        Navbar,
        Header,
        Text,
        MediaQuery,
        Burger,
        useMantineTheme,
        Stack
     } from '@mantine/core';
import { BrowserRouter, Route, Link, Routes } from 'react-router-dom';
import Canvas from './Canvas';
import Map from  './Map';
import Home from './Home'
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
              <Link to="/" onClick={clickHandler}> Home</Link>
              <Link to="/Canvas" onClick={clickHandler}>Canvas</Link>
              <Link to="/Map" onClick={clickHandler}>Map</Link>
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
          <Route/>
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}



export default App;