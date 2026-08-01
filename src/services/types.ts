export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null, success: true };
}

export function fail<T>(error: string): ServiceResult<T> {
  return { data: null, error, success: false };
}
