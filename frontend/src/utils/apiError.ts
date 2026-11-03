import axios from "axios";

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) return (err.response?.data as { message?: string } | undefined)?.message ?? fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function getApiErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}
