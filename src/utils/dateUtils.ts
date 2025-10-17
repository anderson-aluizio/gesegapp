/**
 * Verifica se uma data é anterior ao dia de hoje
 * @param date - Data a ser verificada (pode ser Date ou string ISO)
 * @returns true se a data for anterior a hoje, false caso contrário
 */
export function isBeforeToday(date: Date | string): boolean {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  // Zera as horas para comparar apenas as datas
  const dateOnly = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return dateOnly < todayOnly;
}
