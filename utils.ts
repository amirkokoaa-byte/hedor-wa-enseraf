
import { DAYS_ARABIC } from './constants';
import { AttendanceRecord, Vacation } from './types';

export const generateRandomTime = (startHour: number, startMin: number, endHour: number, endMin: number): string => {
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  const randomTotalMinutes = Math.floor(Math.random() * (end - start + 1)) + start;
  
  const h = Math.floor(randomTotalMinutes / 60);
  const m = randomTotalMinutes % 60;
  
  const hourStr = h > 12 ? (h - 12).toString() : h.toString();
  const ampm = h >= 12 ? 'م' : 'ص';
  
  return `${hourStr}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export const getCycleLabel = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // If day is 21 or more, it belongs to the cycle starting this month
  // If day is 20 or less, it belongs to the cycle that started last month
  if (day >= 21) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `دورة: 21 / ${month} / ${year} إلى 20 / ${nextMonth} / ${nextYear}`;
  } else {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `دورة: 21 / ${prevMonth} / ${prevYear} إلى 20 / ${month} / ${year}`;
  }
};

export const generateAttendanceCycle = (
  startMonth: number, 
  year: number, 
  employeeId: string, 
  employeeName: string,
  vacations: Vacation[]
): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  let currentDate = new Date(year, startMonth - 1, 21);
  const endDate = new Date(year, startMonth, 20);

  const employeeVacations = vacations.filter(v => v.employeeId === employeeId);

  while (currentDate <= endDate) {
    const dayName = DAYS_ARABIC[currentDate.getDay()];
    const dateStr = currentDate.toLocaleDateString('en-GB'); // dd/mm/yyyy

    const hasVacation = employeeVacations.some(v => v.date === dateStr);

    records.push({
      id: Math.random().toString(36).substr(2, 9),
      employeeId,
      employeeName,
      day: dayName,
      date: dateStr,
      checkIn: hasVacation ? 'اجازه' : generateRandomTime(9, 0, 9, 45),
      checkOut: hasVacation ? 'سنويه' : generateRandomTime(16, 45, 18, 14),
      cycleMonth: startMonth,
      cycleYear: year
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return records;
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};
