import {
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Divider,
} from '@mui/joy';
import { useAuthContext } from '@web/context/auth.context';
import { User } from '@dogs-api/shared-interfaces';

export function UserAvatarComponent() {
  const { user, logout, toggleLoginModal } = useAuthContext();

  const getInitials = (user: User) => {
    const { firstName = '', lastName = '' } = user;

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (user) {
    return (
      <Dropdown>
        <MenuButton
          variant="plain"
          sx={{
            color: 'text.primary',
            borderRadius: 999,
            p: 0.5,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
          }}
        >
          <Avatar alt={user.firstName} src={user.image}>
            {getInitials(user)}
          </Avatar>
        </MenuButton>

        <Menu
          placement="bottom-end"
          sx={{
            minWidth: 240,
            borderRadius: 12,
            p: 1,
          }}
        >
          <Box sx={{ px: 1, pb: 1 }}>
            <Typography level="title-sm">
              {user.firstName} {user.lastName}
            </Typography>
            <Typography level="body-xs" color="neutral">
              {user.email}
            </Typography>
          </Box>

          <Divider />

          <MenuItem
            sx={{
              color: 'text.primary',
              '&:hover, &:hover *': {
                color: '#ffffff !important',
              },
            }}
          >
            Favourites
          </MenuItem>

          <Divider />

          <MenuItem
            sx={{
              '&:hover, &:hover *': {
                backgroundColor: 'rgba(255,255,255,0.08) !important',
              },
            }}
            color="danger"
            onClick={() => logout()}
          >
            Sign out
          </MenuItem>
        </Menu>
      </Dropdown>
    );
  }

  return (
    <Avatar onClick={() => toggleLoginModal(true)} sx={{ cursor: 'pointer' }}>
      ?
    </Avatar>
  );
}
