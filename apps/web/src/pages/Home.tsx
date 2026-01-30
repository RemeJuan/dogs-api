import {
  Card,
  CardContent,
  Typography,
  Box,
  Sheet,
  List,
  ListItem,
  ListItemDecorator,
  Grid,
} from '@mui/joy';
import Search from '@mui/icons-material/Search';

export function Home() {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid xs={12} md={3}>
        <Sheet
          variant="outlined"
          sx={{ p: 3, height: '100%', borderRadius: 'md' }}
        >
          <Typography level="h4" component="h2">
            Browse Breeds
          </Typography>
        </Sheet>
      </Grid>

      <Grid xs={12} md={9}>
        <Sheet
          variant="outlined"
          sx={{ p: 4, height: '100%', borderRadius: 'md' }}
        >
          <Typography level="h2" component="h1" sx={{ mb: 2 }}>
            Welcome to Dog Breeds Explorer
          </Typography>
        </Sheet>
      </Grid>
    </Grid>
  );
}
