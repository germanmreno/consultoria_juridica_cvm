import { createTheme } from '@mantine/core';

const cvmBlue = [
  '#EDF2FF', '#DBE4FF', '#BAC8FF', '#91A7FF', '#748FFC',
  '#5C7CFA', '#4C6EF5', '#1F3A6E', '#1A2F5C', '#15244A',
];

const cvmGreen = [
  '#EBFBEE', '#D3F9D8', '#B2F2BB', '#8CE99A', '#69DB7C',
  '#51CF66', '#40C057', '#7AB317', '#5D8F10', '#406A0D',
];

const cvmYellow = [
  '#FFF9DB', '#FFF3BF', '#FFEC99', '#FFE082', '#FFD43B',
  '#FCC419', '#FAB005', '#F2A900', '#D49500', '#B67A00',
];

export const theme = createTheme({
  fontFamily: 'Georama, system-ui, sans-serif',
  fontFamilyMonospace: 'Georama, monospace',
  headings: { fontFamily: 'Georama, system-ui, sans-serif', fontWeight: '600' },
  primaryColor: 'cvm-blue',
  primaryShade: { light: 7, dark: 7 },
  colors: {
    'cvm-blue': cvmBlue,
    'cvm-green': cvmGreen,
    'cvm-yellow': cvmYellow,
  },
  defaultRadius: 'sm',
  components: {
    Table: { defaultProps: { striped: true, highlightOnHover: true } },
    Badge: { defaultProps: { size: 'lg' } },
  },
});
