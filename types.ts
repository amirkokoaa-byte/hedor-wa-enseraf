
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
  notes?: string;
  cycleMonth?: number;
  cycleYear?: number;
}

export type VacationType = 'سنوي' | 'مرضي' | 'عيد' | 'غياب بإذن';

export interface Vacation {
  id: string;
  employeeId: string;
  date: string; // dd/mm/yyyy
  type: VacationType;
  deductFromSalary: boolean;
}

export type ViewType = 'HOME' | 'ENTRY' | 'HISTORY' | 'VACATIONS';
export type ThemeType = 'LIGHT' | 'DARK' | 'GLASS' | 'EMERALD';
