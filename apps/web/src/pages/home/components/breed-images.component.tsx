import { Box, Typography } from '@mui/joy';
import Snackbar from '@mui/joy/Snackbar';
import { useHomeContext } from '@web/pages/home/home.context';
import { useImages } from '@web/hooks/use.images';
import { Loading } from '@web/components/loading.component';
import { ErrorRetry } from '@web/components/error-retry.component';
import { useState } from 'react';
import { ImageTile } from '@web/pages/home/components/image-tile.component';
import { useFavourites } from '@web/hooks/use.favourite';

export function BreedImages() {
  const { selected } = useHomeContext();
  const { isFavourite, toggle, error: favErr } = useFavourites();
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
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!selected && (
        <Typography>
          Please select a dog breed from the left to view images.
        </Typography>
      )}

      {selected && images && images.length > 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2,
            alignContent: 'start',
            mt: 2,
          }}
        >
          {images.map((item) => (
            <ImageTile
              key={item}
              url={item}
              isFavourite={isFavourite(item)}
              onToggleFavourite={(imageUrl) =>
                toggle({
                  breed: selected,
                  imageUrl,
                })
              }
            />
          ))}
        </Box>
      ) : selected && (!images || images.length === 0) ? (
        <Typography>No images found for the {selected}.</Typography>
      ) : null}

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={Boolean(favErr)}
        color="danger"
      >
        {favErr}
      </Snackbar>
    </Box>
  );
}
