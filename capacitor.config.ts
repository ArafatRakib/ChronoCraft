export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  backgroundColor?: string;
}

const config: CapacitorConfig = {
  appId: 'com.arafat.chrono',
  appName: 'Chrono',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  backgroundColor: '#020617',
};

export default config;
