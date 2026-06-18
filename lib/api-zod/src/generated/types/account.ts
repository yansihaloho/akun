export type AccountPlatform = typeof AccountPlatform[keyof typeof AccountPlatform];

export const AccountPlatform = {
  facebook: 'facebook',
  instagram: 'instagram',
} as const;

export interface Account {
  id: number;
  platform: AccountPlatform;
  nama: string;
  tgl_lahir?: string | null;
  jenis_kelamin?: string | null;
  email: string;
  sandi: string;
  sandi_fb?: string | null;
  kode_2fa?: string | null;
  uid?: string | null;
  sandi_email?: string | null;
  email_pemulihan?: string | null;
  status: string;
  catatan?: string | null;
  createdAt: string;
}
