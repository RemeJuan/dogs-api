import { Sheet, Typography } from '@mui/joy';
import { useHomeContext } from '@web/pages/home/home.context';
import { useImages } from '@web/hooks/use.images';
import { Loading } from '@web/components/loading.component';
import { ErrorRetry } from '@web/components/error-retry.component';
import { useState } from 'react';

export function BreedImages() {
  const { selected } = useHomeContext();
  const { images, isLoading, error, refetch } = useImages(selected);
  const [isRetrying, setIsRetrying] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ErrorRetry
        message="Unable to load breeds, please try again."
        onClick={async () => {
          try {
            setIsRetrying(true);
            await refetch({ revalidate: true });
          } finally {
            setIsRetrying(false);
          }
        }}
        loading={isRetrying}
      />
    );
  }

  return (
    <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
      <Typography level="h2" component="h1" sx={{ mb: 2 }}>
        Welcome to Dog Breeds Explorer
      </Typography>
    </Sheet>
  );
}
