import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = 'G open';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'gopen';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "gopen",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A0A0F"
      },
      "package": `com.gopen.app${projectId || '0'}`
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#0A0A0F"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许 G open 访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许 G open 使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许 G open 访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": `G open 需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `G open 需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `G open 需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ],
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "允许 G open 使用 Face ID 进行快速身份验证。"
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "允许 G open 访问您的相册，以便保存收款码图片。",
          "saveToLibraryPermission": "允许 G open 保存图片到相册。"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": "0f1a9668-d1e3-493c-b6f0-9af9655df250"
      }
    }
  }
};
