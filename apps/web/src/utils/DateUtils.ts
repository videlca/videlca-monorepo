import { parseISO, parse } from "date-fns";

/**
 * Safely parses a date string to avoid timezone issues
 * @param dateString - The date string from the API (e.g., "2025-09-05")
 * @returns Date object in local timezone
 */
export const safeParseDate = (dateString: string): Date => {
  // If the string contains only date (YYYY-MM-DD), parse it as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  }
  
  // If it's a full ISO string, use parseISO
  if (dateString.includes('T')) {
    return parseISO(dateString);
  }
  
  // Fallback to regular date parsing
  return new Date(dateString);
};

/**
 * Formats a date to YYYY-MM-DD string format
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};
