export type AccountInputPlatform = typeof AccountInputPlatform[keyof typeof AccountInputPlatform];

export const AccountInputPlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;

export interface AccountInput {
  platform: AccountInputPlatform;
  nama: string;
  tgl_lahir?: string;
  jenis_kelamin?: string;
  email: string;
  sandi: string;
  sandi_fb?: string;
  kode_2fa?: string;
  uid?: string;
  sandi_email?: string;
  email_pemulihan?: string;
  status?: string;
  catatan?: string;
}
