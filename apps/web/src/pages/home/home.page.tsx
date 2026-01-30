import { Typography, Sheet, Grid } from '@mui/joy';
import { BreedsList } from './components/breeds-list.component';

export function HomePage() {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid xs={12} md={3}>
        <Sheet variant="plain" sx={{ p: 3, borderRadius: 'md' }}>
          <BreedsList />
        </Sheet>
      </Grid>

      <Grid xs={12} md={9}>
        <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
          <Typography level="h2" component="h1" sx={{ mb: 2 }}>
            Welcome to Dog Breeds Explorer
          </Typography>
        </Sheet>
      </Grid>
    </Grid>
  );
}
