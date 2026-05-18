/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#87CEEB'; // Sky Blue para botones y elementos interactivos
const tintColorDark = '#87CEEB';

export const Colors = {
  light: {
    text: '#4682B4', // Azul steel para textos en modo claro
    background: '#F5F5F5', // Gris claro para el fondo
    tint: tintColorLight, // Sky Blue para botones y elementos interactivos
    icon: '#4682B4',
    tabIconDefault: '#4682B4',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#87CEEB', // Sky Blue para textos en modo oscuro
    background: '#2C2C2E', // Gris oscuro para modo oscuro
    tint: tintColorDark, // Sky Blue para botones y elementos interactivos
    icon: '#87CEEB',
    tabIconDefault: '#87CEEB',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
