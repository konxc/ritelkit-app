import { useQueryClient } from "@tanstack/svelte-query";

interface MutationOptions<TInput, TOutput> {
  invalidateKeys?: any[][];
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TOutput, variables: TInput) => void;
  onError?: (error: any) => void;
  onSettled?: () => void;
}

export function createAdminMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options: MutationOptions<TInput, TOutput> = {},
  getToastRef?: () =>
    | { show: (msg: string, msgType?: "success" | "error" | "info", customDuration?: number) => void }
    | undefined,
) {
  const queryClient = useQueryClient();
  let isPending = $state(false);

  const mutate = async (input: TInput) => {
    isPending = true;
    try {
      const data = await mutationFn(input);
      const toastRef = getToastRef?.();

      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      if (options.successMessage) {
        toastRef?.show(options.successMessage, "success");
      }

      options.onSuccess?.(data, input);
      return data;
    } catch (error: any) {
      const toastRef = getToastRef?.();
      const message = options.errorMessage || error.message || "Operation failed";
      toastRef?.show(message, "error");
      options.onError?.(error);
      throw error;
    } finally {
      isPending = false;
      options.onSettled?.();
    }
  };

  return {
    mutate,
    get isPending() {
      return isPending;
    },
  };
}
