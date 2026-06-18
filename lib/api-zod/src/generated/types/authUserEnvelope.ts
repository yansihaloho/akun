import type { AuthUser } from './authUser';

export interface AuthUserEnvelope {
  user: AuthUser | null;
}
