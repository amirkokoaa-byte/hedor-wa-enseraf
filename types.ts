
export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  day: string;
  date: string;
  checkIn: string;
  checkOut: string;
}

export type ViewType = 'HOME' | 'ENTRY' | 'HISTORY';
export type ThemeType = 'LIGHT' | 'DARK' | 'GLASS' | 'EMERALD';
