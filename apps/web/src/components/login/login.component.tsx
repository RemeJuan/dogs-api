import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  Input,
  Button,
  Typography,
  IconButton,
  Divider,
  Box,
} from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import { useAuthContext } from '@web/context/auth.context';

type LoginValues = {
  username: string;
  password: string;
};

type LoginComponentProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginComponent({ open, onClose }: LoginComponentProps) {
  const { login } = useAuthContext();

  const [values, setValues] = useState<LoginValues>({
    username: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const u = values.username.trim();
    const p = values.password;
    return u.length > 0 && p.length > 0 && !submitting;
  }, [values, submitting]);

  useEffect(() => {
    if (!open) return;

    setValues({ username: '', password: '' });
    setSubmitting(false);
    setError(null);
  }, [open]);

  async function handleSubmit(e?: ChangeEvent) {
    e?.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await login({
        username: values.username.trim(),
        password: values.password,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
    >
      <ModalDialog
        variant="outlined"
        role="dialog"
        aria-labelledby="login-title"
        sx={{
          width: 'min(420px, calc(100vw - 24px))',
          borderRadius: '16px',
          boxShadow: 'md',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <DialogTitle id="login-title" sx={{ pr: 4, color: 'text.primary' }}>
            Sign in
          </DialogTitle>
          <IconButton
            variant="plain"
            color="neutral"
            onClick={onClose}
            aria-label="Close login dialog"
            sx={{ borderRadius: 999 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ gap: 1 }}>
          <Typography level="body-sm">
            Enter your username and password
          </Typography>
          <Divider sx={{ my: 1 }} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'grid', gap: 1.25 }}
          >
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                autoFocus
                placeholder="e.g. reme"
                value={values.username}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    username: (e.target as HTMLInputElement).value,
                  }))
                }
                autoComplete="username"
                sx={{ color: 'text.primary' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="Your password"
                value={values.password}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    password: (e.target as HTMLInputElement).value,
                  }))
                }
                autoComplete="current-password"
                sx={{ color: 'text.primary' }}
              />
            </FormControl>

            {error && (
              <Typography level="body-sm" color="danger" sx={{ mt: 0.25 }}>
                {error}
              </Typography>
            )}

            <DialogActions sx={{ mt: 1, gap: 1 }}>
              <Button
                variant="plain"
                color="neutral"
                onClick={onClose}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'var(--joy-palette-text-primary)',
                    opacity: 0.7,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                loading={submitting}
                sx={{
                  '&.Mui-disabled': {
                    color: 'var(--joy-palette-text-primary)',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    opacity: 0.7,
                  },
                }}
              >
                Sign in
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
