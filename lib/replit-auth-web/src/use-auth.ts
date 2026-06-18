import { useGetCurrentAuthUser } from "@workspace/api-client-react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export function useAuth() {
  const { data, isLoading, error } = useGetCurrentAuthUser();

  const user: AuthUser | null = data?.user ?? null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
