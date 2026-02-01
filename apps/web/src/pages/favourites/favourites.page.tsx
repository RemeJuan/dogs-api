import { useFavourites } from '@web/hooks/use.favourite';
import { Loading } from '@web/components/loading.component';
import { ErrorRetry } from '@web/components/error-retry.component';
import { useState, useMemo } from 'react';
import { Box, Button, Typography, Sheet, Chip, Autocomplete } from '@mui/joy';
import { useNavigate } from 'react-router-dom';
import { ImageTile } from '@web/pages/home/components/image-tile.component';
import { useAuthContext } from '@web/context/auth.context';
import Close from '@mui/icons-material/Close';
import { ImagePreviewModal } from '@web/components/preview-modal.component';
import { Favourite } from '@dogs-api/shared-interfaces';

type TNotificationProps = {
  heading: string;
  message: string;
  actionText: string;
  onActionClick: () => void;
};
function Notification({
  heading,
  message,
  actionText,
  onActionClick,
}: TNotificationProps) {
  return (
    <Sheet sx={{ p: 3, borderRadius: 12 }}>
      <Typography level="title-md">{heading}</Typography>
      <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {message}
      </Typography>
      <Button sx={{ mt: 2 }} onClick={() => onActionClick()}>
        {actionText}
      </Button>
    </Sheet>
  );
}

export function FavouritesPage() {
  const navigate = useNavigate();
  const { favourites, isLoading, error, remove, refetch, add, isFavourite } =
    useFavourites();
  const { isAuthenticated, toggleLoginModal } = useAuthContext();
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<Favourite | null>(null);

  const options = useMemo(() => {
    const set = new Set(
      favourites
        .map((favourite) => {
          const first = favourite.breed[0].toUpperCase();
          const rest = favourite.breed.slice(1);
          return first + rest;
        })
        .sort(),
    );

    return [...set];
  }, [favourites]);

  const filteredFavourites = useMemo(() => {
    const fav = favourites.sort((a, b) => a.breed.localeCompare(b.breed));

    if (selectedBreeds.length === 0) return fav;

    const selectedLower = selectedBreeds.map((s) => s.toLowerCase());

    return fav.filter((f) => selectedLower.includes(f.breed.toLowerCase()));
  }, [favourites, selectedBreeds]);

  if (!isAuthenticated) {
    return (
      <Notification
        heading="Logged Out"
        message="You need to be logged in in order to view this page"
        actionText="Log In"
        onActionClick={() => toggleLoginModal()}
      />
    );
  }

  if (isLoading) return <Loading />;

  if (error)
    return (
      <ErrorRetry
        message="Unable to load favourites"
        onClick={async () => {
          try {
            setIsRetrying(true);
            await refetch();
          } finally {
            setIsRetrying(false);
          }
        }}
        loading={isRetrying}
      />
    );

  if (favourites.length === 0) {
    return (
      <Notification
        heading="No favourites yet"
        message="Save images you like and they’ll show up here."
        actionText="Browse Breeds"
        onActionClick={() => navigate('/')}
      />
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography level="h3">Favourites</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Autocomplete
            multiple
            id="tags-favourites"
            placeholder="Favorites"
            limitTags={2}
            sx={{ maxWidth: '300px' }}
            options={options}
            value={selectedBreeds}
            onChange={(_, newValue) => setSelectedBreeds(newValue as string[])}
            renderTags={(tags, getTagProps) =>
              tags.map((item, index) => (
                <Chip
                  variant="solid"
                  color="primary"
                  endDecorator={<Close />}
                  sx={{ minWidth: 0 }}
                  {...getTagProps({ index })}
                >
                  {item}
                </Chip>
              ))
            }
          />
          <Chip variant="soft">
            {filteredFavourites.length} shown / {favourites.length} saved
          </Chip>
        </Box>
      </Box>

      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {filteredFavourites.map((f) => (
          <Box
            key={f.imageUrl}
            onClick={() => setPreviewItem(f)}
            sx={{ cursor: 'pointer' }}
          >
            <ImageTile
              url={f.imageUrl}
              isFavourite={true}
              onToggleFavourite={() => remove(f.imageUrl)}
            />
            <Typography
              level="body-sm"
              sx={{ mt: 0.5, textTransform: 'capitalize' }}
            >
              {f.breed}
            </Typography>
          </Box>
        ))}
      </Box>

      <ImagePreviewModal
        open={Boolean(previewItem)}
        breed={previewItem?.breed ?? ''}
        isFavourite={isFavourite(previewItem?.imageUrl ?? '')}
        imageUrl={previewItem?.imageUrl ?? ''}
        onClose={() => setPreviewItem(null)}
        onRemove={remove}
        onAdd={(url: string) =>
          add({
            breed: previewItem?.breed ?? '',
            imageUrl: url,
          })
        }
      />
    </Box>
  );
}
