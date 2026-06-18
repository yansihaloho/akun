export type AccountPlatform = typeof AccountPlatform[keyof typeof AccountPlatform];

export const AccountPlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;
