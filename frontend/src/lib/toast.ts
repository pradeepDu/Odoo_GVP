import toast from "react-hot-toast";

const defaultDuration = 4000;

export const showSuccess = (message: string): void => {
  toast.success(message, { duration: defaultDuration });
};

export const showError = (message: string): void => {
  toast.error(message, { duration: defaultDuration });
};

export const showApiError = (err: unknown): void => {
  const message = err instanceof Error ? err.message : "Something went wrong";
  showError(message);
};

export { toast };
