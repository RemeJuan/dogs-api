import { Route, Routes } from 'react-router-dom';
import { Box, Container, Typography, Sheet } from '@mui/joy';
import { HomePage } from '@web/pages/home/home.page';
import PetsIcon from '@mui/icons-material/Pets';

export function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Sheet
        variant="solid"
        color="neutral"
        sx={{
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'linear-gradient(90deg, #0F172A 0%, #132042 100%)',
          borderBottom: '1px solid rgba(43, 178, 255, 0.2)',
        }}
      >
        <Box
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        >
          <PetsIcon sx={{ mr: 1.5 }} />
          <Typography level="h4" component="h1">
            Dog Breeds Explorer
          </Typography>
        </Box>
      </Sheet>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
