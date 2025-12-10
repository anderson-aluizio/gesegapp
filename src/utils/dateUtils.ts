/**
 * Verifica se uma data é anterior ao dia de hoje
 * @param date - Data a ser verificada (pode ser Date ou string ISO)
 * @returns true se a data for anterior a hoje, false caso contrário
 */
export function isBeforeToday(date: Date | string): boolean {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  const dateOnly = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return dateOnly < todayOnly;
}

/**
 * Converts a Date to local ISO string format (without timezone conversion to UTC)
 * @param date - Date to convert
 * @returns Local date string in format 'YYYY-MM-DDTHH:mm:ss.sss'
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Gets today's date in local format (YYYY-MM-DD)
 * @returns Local date string in format 'YYYY-MM-DD'
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Converts a Date to local datetime string in server format (Y-m-d H:i:s)
 * @param date - Date to convert
 * @returns Local datetime string in format 'YYYY-MM-DD HH:mm:ss'
 */
export function toLocalDateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
