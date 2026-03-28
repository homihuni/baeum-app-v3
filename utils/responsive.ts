import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function wp(size: number): number {
  return Math.round((size / BASE_WIDTH) * SCREEN_WIDTH);
}

export function hp(size: number): number {
  return Math.round((size / BASE_HEIGHT) * SCREEN_HEIGHT);
}

export function fp(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export { SCREEN_WIDTH, SCREEN_HEIGHT };
