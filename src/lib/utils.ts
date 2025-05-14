
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", 
    options || {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}
