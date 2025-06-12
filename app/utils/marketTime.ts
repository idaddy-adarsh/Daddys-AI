// Returns true if the current time is during NSE market hours (Mon-Fri, 9:15 AM to 3:30 PM IST)
export function isMarketOpen(date: Date = new Date()): boolean {
  // Convert to IST (UTC+5:30)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utc + istOffset);

  const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const time = hours * 60 + minutes;
  // Market open: 9:15 (555), close: 15:30 (930)
  return time >= 555 && time <= 930;
} 