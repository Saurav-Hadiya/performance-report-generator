import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to check if a month is the current month
export function isCurrentMonth(month: string): boolean {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentMonthStr = `${currentYear}-${currentMonth}`;
  
  return month === currentMonthStr;
}

// Helper to check if a month is completed (past month)
export function isCompletedMonth(month: string): boolean {
  const [year, monthNum] = month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  const currentDate = new Date();
  
  // Set current date to first day of current month for comparison
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  return monthDate < currentMonthStart;
}

// Helper to check if a month is in the future
export function isFutureMonth(month: string): boolean {
  const [year, monthNum] = month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  const currentDate = new Date();
  
  // Set current date to first day of current month for comparison
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  return monthDate > currentMonthStart;
}
