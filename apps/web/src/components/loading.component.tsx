import { Box, CircularProgress, Typography } from '@mui/joy';

export function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <CircularProgress size="sm" />
      <Typography level="body-md" sx={{ mt: 2, color: 'text.secondary' }}>
        Loading...
      </Typography>
    </Box>
  );
}
