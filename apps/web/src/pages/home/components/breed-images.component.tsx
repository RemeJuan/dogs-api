import { Box, Typography } from '@mui/joy';
import Snackbar from '@mui/joy/Snackbar';
import { useHomeContext } from '@web/pages/home/home.context';
import { useImages } from '@web/hooks/use.images';
import { Loading } from '@web/components/loading.component';
import { ErrorRetry } from '@web/components/error-retry.component';
import { useState } from 'react';
import { ImageTile } from '@web/pages/home/components/image-tile.component';
import { useFavourites } from '@web/hooks/use.favourite';
import { ImagePreviewModal } from '@web/components/preview-modal.component';

export function BreedImages() {
  const { selected } = useHomeContext();
  const { isFavourite, toggle, error: favErr, remove, add } = useFavourites();
  const { images, isLoading, error, refetch } = useImages(selected);
  const [isRetrying, setIsRetrying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
            <Box
              key={item}
              onClick={() => setPreviewUrl(item)}
              sx={{ cursor: 'pointer' }}
            >
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
            </Box>
          ))}
        </Box>
      ) : selected && (!images || images.length === 0) ? (
        <Typography>No images found for the {selected}.</Typography>
      ) : null}

      <ImagePreviewModal
        open={Boolean(previewUrl)}
        breed={selected ?? ''}
        isFavourite={isFavourite(previewUrl ?? '')}
        imageUrl={previewUrl}
        onClose={() => setPreviewUrl(null)}
        onRemove={remove}
        onAdd={(url) =>
          add({
            breed: selected ?? '',
            imageUrl: url,
          })
        }
      />

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
