import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.caliemprende.app",
  appName: "Cali Emprende",
  webDir: "out",
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: "#63158a",
      showSpinner: false
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#63158a"
    }
  }
};

export default config;
