export type AccountUpdatePlatform = typeof AccountUpdatePlatform[keyof typeof AccountUpdatePlatform];

export const AccountUpdatePlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;

export interface AccountUpdate {
  platform?: AccountUpdatePlatform;
  nama?: string;
  tgl_lahir?: string;
  jenis_kelamin?: string;
  email?: string;
  sandi?: string;
  sandi_fb?: string;
  kode_2fa?: string;
  uid?: string;
  sandi_email?: string;
  email_pemulihan?: string;
  status?: string;
  catatan?: string;
}
