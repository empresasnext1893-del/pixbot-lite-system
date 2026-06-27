import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useClientAuth() {
  const { data: session, isLoading, refetch } = trpc.clientAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5_000, // Reduzido para 5s para refletir mudanças do admin mais rápido
    refetchOnWindowFocus: true,
  });

  const loginMutation = trpc.clientAuth.login.useMutation();
  const registerMutation = trpc.clientAuth.register.useMutation();
  const logoutMutation = trpc.clientAuth.logout.useMutation();
  const utils = trpc.useUtils();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password });
      await utils.clientAuth.me.invalidate();
      await utils.clientAuth.myWallet.invalidate();
      return result;
    },
    [loginMutation, utils]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await registerMutation.mutateAsync({ name, email, password });
      await utils.clientAuth.me.invalidate();
      await utils.clientAuth.myWallet.invalidate();
      return result;
    },
    [registerMutation, utils]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    await utils.clientAuth.me.invalidate();
    await utils.clientAuth.myWallet.invalidate();
  }, [logoutMutation, utils]);

  return {
    session,
    account: session ?? null,
    wallet: null,
    isAuthenticated: !!session,
    isLoading,
    login,
    register,
    logout,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    refetch,
  };
}
