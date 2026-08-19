export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  backgroundColor?: string;
  plugins?: {
    LocalNotifications?: {
      smallIcon?: string;
      iconColor?: string;
      sound?: string;
    };
  };
}

const config: CapacitorConfig = {
  appId: 'com.arafat.chrono',
  appName: 'ChronoCraft',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  backgroundColor: '#020617',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#4F46E5',
      sound: 'alarm.wav',
    },
  },
};

export default config;
