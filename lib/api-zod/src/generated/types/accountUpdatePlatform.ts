export type AccountUpdatePlatform = typeof AccountUpdatePlatform[keyof typeof AccountUpdatePlatform];

export const AccountUpdatePlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;
