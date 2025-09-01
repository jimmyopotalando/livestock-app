// theme.js

export const COLORS = {
    primary: '#4CAF50',        // Main color (e.g., buttons, headers)
    secondary: '#2E7D32',      // Secondary (optional)
    white: '#FFFFFF',
    black: '#000000',
    gray: '#BDBDBD',
    lightGray: '#F0F0F0',
    red: '#E53935',
    background: '#FAFAFA',
  };
  
  export const SIZES = {
    base: 8,
    font: 14,
    radius: 10,
    padding: 20,
  
    // Font sizes
    h1: 24,
    h2: 20,
    h3: 18,
    body: 14,
    small: 12,
  };
  
  export const FONTS = {
    h1: { fontSize: SIZES.h1, fontWeight: '700' },
    h2: { fontSize: SIZES.h2, fontWeight: '600' },
    h3: { fontSize: SIZES.h3, fontWeight: '500' },
    body: { fontSize: SIZES.body },
    small: { fontSize: SIZES.small },
  };
  
  export default { COLORS, SIZES, FONTS };
  