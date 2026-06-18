export type ListAccountsPlatform = typeof ListAccountsPlatform[keyof typeof ListAccountsPlatform];

export const ListAccountsPlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;
