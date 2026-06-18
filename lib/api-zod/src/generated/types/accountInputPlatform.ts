export type AccountInputPlatform = typeof AccountInputPlatform[keyof typeof AccountInputPlatform];

export const AccountInputPlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;
