import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const delayMessages = [
  'Activity must be at least 3 minutes long to save.',
  "Keep going! Save your activity after 3 minutes.",
  'Activity must be at least 3 minutes long to save.',
  "Almost there! Let's go for at least 3 minutes.",
  "Please continue for at least 3 minutes to save this activity.",
  "Almost there! Let's go for at least 3 minutes.",
  "Keep going! Save your activity after 3 minutes.",
  "Minimum duration to save is 3 minutes.",
  "Warm-up complete! Continue for 3 minutes to log your activity.",
  "Minimum duration to save is 3 minutes.",
  "Warm-up complete! Continue for 3 minutes to log your activity.",
]

export const getDelayMessage = () => {
  const random = Math.floor(Math.random() * 10)
  return delayMessages[(random)]
}

export const duration = (start: Date, finish: Date) => {
  const milliseconds = finish.getTime() - start.getTime();
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainderMinutes = minutes % 60
  const remainderSeconds = seconds % 60
  return `${String(hours).padStart(2, "0")}:${String(remainderMinutes).padStart(2, "0")}:${String(remainderSeconds).padStart(2, "0")}`
}
export const getInitials = (name: string) => {
  return name.split(" ").map(word => word.charAt(0)).join();
} 