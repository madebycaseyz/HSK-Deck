import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.madebycaseyz.hskdeck',
  appName: 'HSK Deck',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
