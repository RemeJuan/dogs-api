import { AspectRatio, Skeleton } from '@mui/joy';
import { useState } from 'react';

export function ImageTile({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <AspectRatio
      ratio={1}
      sx={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        bgcolor: 'background.level1',
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
    </AspectRatio>
  );
}
