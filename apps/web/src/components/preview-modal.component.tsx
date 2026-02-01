import {
  Modal,
  ModalDialog,
  DialogContent,
  IconButton,
  DialogTitle,
  Box,
  Button,
} from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

type Props = {
  open: boolean;
  isFavourite: boolean;
  breed: string;
  imageUrl: string | null;
  onClose: () => void;
  onAdd: (url: string) => Promise<void> | void;
  onRemove: (url: string) => Promise<void> | void;
};

export function ImagePreviewModal({
  open,
  isFavourite,
  breed,
  imageUrl,
  onClose,
  onAdd,
  onRemove,
}: Props) {
  if (!imageUrl) return null;

  return (
    <Modal
      open={open}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
    >
      <ModalDialog
        layout="center"
        variant="outlined"
        sx={{
          width: 'min(600px, calc(80vw - 24px))',
          borderRadius: 16,
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <DialogTitle
            sx={{ textTransform: 'capitalize', color: 'text.primary' }}
          >
            {breed}
          </DialogTitle>
          <IconButton
            variant="plain"
            onClick={onClose}
            aria-label="Close preview"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          <img
            src={imageUrl}
            alt="Favourite dog"
            style={{
              width: '100%',
              height: 'calc(100vh - 200px)',
              objectFit: 'contain',
              backgroundColor: 'var(--dogapp-palette-background-surface)',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'end',
              mt: 1.5,
            }}
          >
            <Button
              variant="soft"
              color={isFavourite ? 'danger' : 'success'}
              startDecorator={
                isFavourite ? <DeleteOutlineIcon /> : <AddOutlinedIcon />
              }
              onClick={async () => {
                const func = isFavourite ? onRemove : onAdd;

                await func(imageUrl);
              }}
            >
              {isFavourite ? 'Remove' : 'Add'}
            </Button>
          </Box>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
