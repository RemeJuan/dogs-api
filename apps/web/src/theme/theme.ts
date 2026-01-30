import { extendTheme } from '@mui/joy/styles';

export const theme = extendTheme({
  cssVarPrefix: 'dogapp',

  fontFamily: {
    display:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    body: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    code: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        background: {
          body: '#0B1020',
          surface: '#0F172A',
          level1: '#111B33',
          level2: '#132042',
          level3: '#16254F',
          popup: '#0F172A',
          tooltip: '#0F172A',
        },
        text: {
          primary: '#E6EAF2',
          secondary: '#AAB4CF',
          tertiary: '#7F8AA8',
        },
        primary: {
          50: '#E6F6FF',
          100: '#BDEBFF',
          200: '#8DDBFF',
          300: '#5BC8FF',
          400: '#2BB2FF',
          500: '#1499F5',
          600: '#0F7BD1',
          700: '#0C5DA6',
          800: '#083F73',
          900: '#05284B',
          solidBg: '#1499F5',
          solidHoverBg: '#0F7BD1',
          solidActiveBg: '#0C5DA6',
          solidColor: '#07101F',
          outlinedBorder: '#2BB2FF',
          outlinedHoverBg: 'rgba(43, 178, 255, 0.12)',
          outlinedActiveBg: 'rgba(43, 178, 255, 0.18)',
          plainHoverBg: 'rgba(43, 178, 255, 0.10)',
          plainActiveBg: 'rgba(43, 178, 255, 0.16)',
        },
        neutral: {
          50: '#F4F6FB',
          100: '#E6EAF2',
          200: '#C9D1E3',
          300: '#AAB4CF',
          400: '#7F8AA8',
          500: '#58627E',
          600: '#3D4663',
          700: '#2A324C',
          800: '#1C233A',
          900: '#12182B',
          outlinedBorder: 'rgba(230, 234, 242, 0.14)',
          outlinedHoverBg: 'rgba(230, 234, 242, 0.06)',
          plainHoverBg: 'rgba(230, 234, 242, 0.05)',
          plainActiveBg: 'rgba(230, 234, 242, 0.08)',
        },
        divider: 'rgba(230, 234, 242, 0.10)',
        focusVisible: 'rgba(43, 178, 255, 0.35)',
      },
    },
  },

  radius: {
    xs: '8px',
    sm: '10px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },

  components: {
    JoyTypography: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          lineHeight: 1.6,
          ...(ownerState.level === 'h1' && {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }),
          ...(ownerState.level === 'h2' && {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }),
          ...(ownerState.level === 'h3' && {
            fontWeight: 650,
            letterSpacing: '-0.015em',
          }),
        }),
      },
    },
    JoyCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage:
            'radial-gradient(1200px 400px at 0% 0%, rgba(43,178,255,0.10), transparent 40%), radial-gradient(900px 300px at 100% 0%, rgba(46,229,157,0.08), transparent 45%)',
          border: `1px solid ${theme.vars.palette.divider}`,
          backdropFilter: 'blur(6px)',
        }),
      },
    },
    JoyButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.radius.md,
        }),
      },
    },
    JoyInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.radius.md,
          borderColor: theme.vars.palette.neutral.outlinedBorder,
          backgroundColor: theme.vars.palette.background.level1,
        }),
      },
    },
    JoySelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.radius.md,
          backgroundColor: theme.vars.palette.background.level1,
        }),
      },
    },
  },
});
