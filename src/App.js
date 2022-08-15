import { AppShell, Navbar, Header, Container } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import Canvas from './Canvas';
import Map from  './Map'
function App() {
  return (
    <AppShell
      padding="md"
      navbar={<Navbar width={{ base: 300 }} height={500} p="xs">{/* Navbar content */}</Navbar>}
      header={<Header height={60} p="xs">{/* Header content */}</Header>}
      styles={(theme) => ({
        main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
      })}
    >
      {/* <Container>
      <Routes>
        <Route path="/Canvas" element={<Canvas/>}/>
      </Routes>
      </Container> */}
      <Canvas/>
      <Map/>
    </AppShell>
  );
}



export default App;