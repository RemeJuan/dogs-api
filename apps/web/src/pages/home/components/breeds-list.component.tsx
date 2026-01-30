import { useBreeds } from '@web/hooks/use.breeds';
import { Loading } from '@web/components/loading.component';
import {
  Box,
  Input,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Divider,
} from '@mui/joy';
import Search from '@mui/icons-material/Search';
import { useMemo, useState } from 'react';
import { ErrorRetry } from '@web/components/error-retry.component';

export function BreedsList() {
  const { dogs, isLoading, error, refetch } = useBreeds();
  const [query, setQuery] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!dogs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return dogs;
    return dogs.filter((b) => (b.name || '').toLowerCase().includes(q));
  }, [dogs, query]);

  const select = (item: string) => {
    if (selected === item) {
      setSelected(null);
    } else {
      setSelected(item);
    }
  };

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
        flexGrow: 1,
        overflowY: 'auto',
        maxHeight: '80vh',
        pr: 0.5,
        borderColor: 'divider',
        pt: 1,
      }}
    >
      <Input
        placeholder="Search breeds..."
        value={query}
        onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
        aria-label="Search breeds"
        size="sm"
        startDecorator={
          <Search
            sx={{ color: 'var(--joy-palette-text-tertiary)', fontSize: 18 }}
            aria-hidden
          />
        }
        sx={{
          width: '100%',
          color: 'text.primary',
          '--Input-placeholderColor': 'var(--joy-palette-text-tertiary)',
          '--Input-focusedThickness': '2px',
          mb: 1.25,
        }}
      />

      <Divider sx={{ mt: 2 }} />

      <List
        size="sm"
        sx={{
          '--ListItem-radius': '10px',
          '--List-gap': '4px',
          px: 0.5,
        }}
      >
        {filtered.map((breed) => {
          const isSelected = selected === breed.name;

          return (
            <ListItem key={breed.name}>
              <ListItemButton
                selected={isSelected}
                onClick={() => select(breed.name)}
                sx={{
                  position: 'relative',
                  py: 0.9,
                  px: 1.25,
                  borderRadius: '10px',
                  textTransform: 'capitalize',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isSelected ? 'text.primary' : 'text.secondary',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 6,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 999,
                    backgroundColor: isSelected
                      ? 'rgba(43,178,255,0.95)'
                      : 'transparent',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(43,178,255,0.18)'
                      : 'none',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(230,234,242,0.07)',
                  },
                  ...(isSelected && {
                    backgroundColor: 'rgba(43,178,255,0.12)',
                    color: 'text.primary',
                  }),
                  '&:focus-visible': {
                    outline: '2px solid rgba(43,178,255,0.55)',
                    outlineOffset: '2px',
                  },
                }}
              >
                <Typography
                  level="body-sm"
                  sx={{ fontWeight: isSelected ? 650 : 500 }}
                >
                  {breed.name}
                </Typography>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
