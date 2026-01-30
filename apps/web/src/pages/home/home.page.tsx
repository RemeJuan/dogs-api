import { Sheet, Grid } from '@mui/joy';
import { BreedsList } from './components/breeds-list.component';
import { HomeContextProvider } from '@web/pages/home/home.context';
import { BreedImages } from '@web/pages/home/components/breed-images.component';

export function HomePage() {
  return (
    <HomeContextProvider>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} md={3}>
          <Sheet variant="plain" sx={{ p: 3, borderRadius: 'md' }}>
            <BreedsList />
          </Sheet>
        </Grid>

        <Grid xs={12} md={9}>
          <BreedImages />
        </Grid>
      </Grid>
    </HomeContextProvider>
  );
}
