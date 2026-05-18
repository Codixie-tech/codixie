import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateNewNameForCopy = (name: string) => {
  const date = new Date();
  return `${name}-copy-${date.getUTCSeconds()}-${date.getUTCMinutes()}-${date.getUTCHours()}-${date.getUTCDate()}-${date.getUTCMonth()}-${date.getUTCFullYear()}`;
};
