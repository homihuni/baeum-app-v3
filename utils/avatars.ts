import { ImageSourcePropType } from 'react-native';

export const AVATAR_KEYS = [
  'avatar_01', 'avatar_02', 'avatar_03', 'avatar_04', 'avatar_05',
  'avatar_06', 'avatar_07', 'avatar_08', 'avatar_09', 'avatar_10',
  'avatar_11', 'avatar_12', 'avatar_13', 'avatar_14', 'avatar_15',
  'avatar_16', 'avatar_17', 'avatar_18', 'avatar_19', 'avatar_20',
  'avatar_21', 'avatar_22', 'avatar_23', 'avatar_24', 'avatar_25',
  'avatar_26', 'avatar_27', 'avatar_28', 'avatar_29',
];

export const AVATAR_MAP: Record<string, ImageSourcePropType> = {
  avatar_01: require('../assets/images/avatar_01.png'),
  avatar_02: require('../assets/images/avatar_02.png'),
  avatar_03: require('../assets/images/avatar_03.png'),
  avatar_04: require('../assets/images/avatar_04.png'),
  avatar_05: require('../assets/images/avatar_05.png'),
  avatar_06: require('../assets/images/avatar_06.png'),
  avatar_07: require('../assets/images/avatar_07.png'),
  avatar_08: require('../assets/images/avatar_08.png'),
  avatar_09: require('../assets/images/avatar_09.png'),
  avatar_10: require('../assets/images/avatar_10.png'),
  avatar_11: require('../assets/images/avatar_11.png'),
  avatar_12: require('../assets/images/avatar_12.png'),
  avatar_13: require('../assets/images/avatar_13.png'),
  avatar_14: require('../assets/images/avatar_14.png'),
  avatar_15: require('../assets/images/avatar_15.png'),
  avatar_16: require('../assets/images/avatar_16.png'),
  avatar_17: require('../assets/images/avatar_17.png'),
  avatar_18: require('../assets/images/avatar_18.png'),
  avatar_19: require('../assets/images/avatar_19.png'),
  avatar_20: require('../assets/images/avatar_20.png'),
  avatar_21: require('../assets/images/avatar_21.png'),
  avatar_22: require('../assets/images/avatar_22.png'),
  avatar_23: require('../assets/images/avatar_23.png'),
  avatar_24: require('../assets/images/avatar_24.png'),
  avatar_25: require('../assets/images/avatar_25.png'),
  avatar_26: require('../assets/images/avatar_26.png'),
  avatar_27: require('../assets/images/avatar_27.png'),
  avatar_28: require('../assets/images/avatar_28.png'),
  avatar_29: require('../assets/images/avatar_29.png'),
};

export const DEFAULT_AVATAR = AVATAR_MAP['avatar_01'];

export function resolveAvatar(value: any): ImageSourcePropType {
  if (!value) return DEFAULT_AVATAR;
  if (typeof value === 'string' && AVATAR_MAP[value]) return AVATAR_MAP[value];
  if (typeof value === 'string') {
    const match = value.match(/avatar_(\d+)/);
    if (match && AVATAR_MAP['avatar_' + match[1]]) return AVATAR_MAP['avatar_' + match[1]];
    return DEFAULT_AVATAR;
  }
  return DEFAULT_AVATAR;
}

export function resolveAvatarKey(value: any): string {
  if (!value) return 'avatar_01';
  if (typeof value === 'string' && AVATAR_MAP[value]) return value;
  if (typeof value === 'string') {
    const match = value.match(/avatar_(\d+)/);
    if (match && AVATAR_MAP['avatar_' + match[1]]) return 'avatar_' + match[1];
    return 'avatar_01';
  }
  return 'avatar_01';
}
