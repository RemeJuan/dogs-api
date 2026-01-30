import { Box, Typography, Button } from '@mui/joy';

type TProps = {
  message: string;
  onClick: () => Promise<void>;
  loading: boolean;
};

export function ErrorRetry({ message, onClick, loading }: TProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography color="danger">{message}</Typography>
      <Button onClick={onClick} loading={loading}>
        Retry
      </Button>
    </Box>
  );
}
