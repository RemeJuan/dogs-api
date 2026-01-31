import { AspectRatio, Skeleton, IconButton, Tooltip } from '@mui/joy';
import { useState } from 'react';
import Favorite from '@mui/icons-material/Favorite';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';

type TProps = {
  url: string;
  isFavourite: boolean;
  onToggleFavourite: (imageUrl: string) => void;
};

export function ImageTile({ url, isFavourite, onToggleFavourite }: TProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <AspectRatio
      ratio={1}
      sx={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        bgcolor: 'background.level1',
        '&:hover .fav-btn': { opacity: 1, transform: 'scale(1)' },
      }}
    >
      {!loaded && (
        <Skeleton
          variant="overlay"
          animation="wave"
          sx={{ position: 'absolute', inset: 0, zIndex: 1 }}
        />
      )}
      <img
        src={url}
        alt="Dog"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity 200ms ease',
          opacity: loaded ? 1 : 0,
        }}
      />

      <Tooltip
        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
      >
        <IconButton
          size="sm"
          variant={isFavourite ? 'solid' : 'soft'}
          color={isFavourite ? 'danger' : 'neutral'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite(url);
          }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 3,
            borderRadius: 999,
            backdropFilter: 'blur(6px)',
            backgroundColor: isFavourite ? undefined : 'rgba(11,16,32,0.35)',
            '&:hover': {
              backgroundColor: isFavourite ? undefined : 'rgba(11,16,32,0.50)',
            },
            opacity: isFavourite ? 1 : 0,
            transition: 'opacity 120ms ease, transform 120ms ease',
            transform: isFavourite ? 'scale(1)' : 'scale(0.98)',
          }}
          className="fav-btn"
          aria-label={
            isFavourite ? 'Remove from favourites' : 'Add to favourites'
          }
        >
          {isFavourite ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </Tooltip>
    </AspectRatio>
  );
}
