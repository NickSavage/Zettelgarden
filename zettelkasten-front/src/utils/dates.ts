export function getToday(): Date {
  let result = new Date()
  return result;
}

export function getTomorrow(): Date {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
}

export function getYesterday(): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday;
}

export function compareDates(date1: Date | null, date2: Date | null): boolean {
  if (date1 === null || date2 === null) {
    return false;
  }
  console.log(date1, date2)
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
