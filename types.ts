
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
  // Metadata for historical grouping
  cycleMonth?: number;
  cycleYear?: number;
}

export interface Vacation {
  id: string;
  employeeId: string;
  date: string; // dd/mm/yyyy
}

export type ViewType = 'HOME' | 'ENTRY' | 'HISTORY' | 'VACATIONS';
export type ThemeType = 'LIGHT' | 'DARK' | 'GLASS' | 'EMERALD';
