import { Alert, Typography } from '@mui/joy';

interface ErrorBannerProps {
  message: string;
  title?: string;
}

export function ErrorBanner({ message, title = 'Error' }: ErrorBannerProps) {
  return (
    <Alert color="danger" variant="soft" sx={{ my: 2 }}>
      <Typography level="title-md" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography level="body-sm">{message}</Typography>
    </Alert>
  );
}
