export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    url?: string;
    cleartext?: boolean;
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

// ⚡ CHANGE THIS TO 'true' FOR INSTANT LIVE CODING, 'false' FOR REAL APK RELEASES
const IS_DEV_MODE = true; 

const config: CapacitorConfig = {
  appId: 'com.arafat.chrono',
  appName: 'ChronoCraft',
  webDir: 'dist',
  backgroundColor: '#020617',
  server: IS_DEV_MODE 
    ? {
        // Point to your Termux Vite server
        url: 'http://localhost:3000', 
        cleartext: true
      }
    : {
        androidScheme: 'https',
      },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#4F46E5',
      sound: 'alarm.wav',
    },
  },
};

export default config;
