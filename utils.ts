
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

export const generateAttendanceCycle = (
  startMonth: number, 
  year: number, 
  employeeId: string, 
  employeeName: string,
  vacations: Vacation[]
): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  // Start from 21st of startMonth
  let currentDate = new Date(year, startMonth - 1, 21);
  
  // End is 20th of next month
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
