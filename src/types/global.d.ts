export type SnapPayOptions = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

export {};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: SnapPayOptions) => void;
    };
  }
}
