
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  History, 
  Plus, 
  Calendar, 
  Download, 
  Copy, 
  Save, 
  Search,
  Home,
  Palette,
  Menu,
  X,
  UserCheck,
  CalendarDays,
  Plane,
  Trash2,
  Edit2,
  Check,
  FileSpreadsheet,
  CloudUpload,
  FileDown,
  Clock,
  WalletCards,
  UserPlus
} from 'lucide-react';
import { Employee, AttendanceRecord, ViewType, ThemeType, Vacation, VacationType } from './types';
import { INITIAL_EMPLOYEES, DAYS_ARABIC } from './constants';
import { generateAttendanceCycle, copyToClipboard, getCycleLabel, parseDate, formatDate } from './utils';
import * as XLSX from 'xlsx';

export default function App() {
  const [view, setView] = useState<ViewType>('HOME');
  const [theme, setTheme] = useState<ThemeType>('LIGHT');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Global Cycle States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Current Entry View States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentTable, setCurrentTable] = useState<AttendanceRecord[]>([]);

  // Vacation View States
  const [vacationFilterId, setVacationFilterId] = useState('');
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState<string | null>(null);
  const [startDateInput, setStartDateInput] = useState(formatDate(new Date()));
  const [endDateInput, setEndDateInput] = useState(formatDate(new Date()));
  const [vacationType, setVacationType] = useState<VacationType>('سنوي');
  const [deductFromSalary, setDeductFromSalary] = useState(false);

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('منسق');

  // History View States
  const [historySelectedEmployeeId, setHistorySelectedEmployeeId] = useState('');

  // Load Data
  useEffect(() => {
    const savedEmployees = localStorage.getItem('sr_employees');
    const savedHistory = localStorage.getItem('sr_history');
    const savedVacations = localStorage.getItem('sr_vacations');
    const savedTheme = localStorage.getItem('sr_theme');

    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedVacations) setVacations(JSON.parse(savedVacations));
    if (savedTheme) setTheme(savedTheme as ThemeType);
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem('sr_employees', JSON.stringify(employees));
    localStorage.setItem('sr_history', JSON.stringify(history));
    localStorage.setItem('sr_vacations', JSON.stringify(vacations));
    localStorage.setItem('sr_theme', theme);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
    
    if (selectedEmployeeId && currentTable.length > 0) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
        const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, emp.name, vacations);
        setCurrentTable(table);
      }
    }
  };

  const handleAddEmployee = () => {
    if (!newEmpName) return alert('يرجى إدخال اسم الموظف');
    const newEmp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEmpName,
      role: newEmpRole
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    setNewEmpName('');
    setIsEmployeeModalOpen(false);
    localStorage.setItem('sr_employees', JSON.stringify(updated));
    alert('تم إضافة الموظف بنجاح');
  };

  const handleCopyTableData = async () => {
    if (currentTable.length === 0) return;
    const empName = employees.find(e => e.id === selectedEmployeeId)?.name || "غير معروف";
    let textToCopy = `اسم الموظف: ${empName}\nاليوم\tالتاريخ\tالحضور\tالانصراف\tالملاحظات\n`;
    currentTable.forEach(row => {
      textToCopy += `${row.day}\t${row.date}\t${row.checkIn}\t${row.checkOut}\t${row.notes || ""}\n`;
    });
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleTransfer = () => {
    if (currentTable.length === 0) return;
    setHistory([...history, ...currentTable]);
    setCurrentTable([]);
    handleSaveAll();
    alert('تم ترحيل بيانات الموظف للأرشيف بنجاح');
  };

  const exportAllEmployeesExcel = () => {
    const month = selectedMonth;
    const year = selectedYear;

    const dates: string[] = [];
    const days: string[] = [];
    let d = new Date(year, month - 1, 21);
    const end = new Date(year, month, 20);
    while (d <= end) {
      dates.push(formatDate(d));
      days.push(DAYS_ARABIC[d.getDay()]);
      d.setDate(d.getDate() + 1);
    }

    const headerRow1 = ['اليوم', 'التاريخ'];
    const headerRow2 = ['', ''];
    employees.forEach(emp => {
      headerRow1.push(emp.name, ''); 
      headerRow2.push('حضور', 'انصراف');
    });

    const dataRows = dates.map((dateStr, idx) => {
      const row = [days[idx], dateStr];
      employees.forEach(emp => {
        const tempTable = generateAttendanceCycle(month, year, emp.id, emp.name, vacations);
        const dayRecord = tempTable.find(r => r.date === dateStr);
        row.push(dayRecord?.checkIn || "-", dayRecord?.checkOut || "-");
      });
      return row;
    });

    const wsData = [headerRow1, headerRow2, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const merges = [];
    for (let i = 0; i < employees.length; i++) {
      const sc = 2 + (i * 2);
      merges.push({ s: { r: 0, c: sc }, e: { r: 0, c: sc + 1 } });
    }
    ws['!merges'] = merges;

    const wscols = [{ wch: 10 }, { wch: 12 }];
    employees.forEach(() => {
      wscols.push({ wch: 10 }, { wch: 10 });
    });
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقرير شامل");
    XLSX.writeFile(wb, `SoftRose_Master_Report_${month}_${year}.xlsx`);
  };

  const handleExportEntrySingle = (data: AttendanceRecord[], employeeName: string) => {
    const wsData = [[`سجل حضور الموظف: ${employeeName}`], [], ["اليوم", "التاريخ", "الحضور", "الانصراف", "الملاحظات"]];
    data.forEach(r => wsData.push([r.day, r.date, r.checkIn, r.checkOut, r.notes || ""]));
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `SoftRose_${employeeName}.xlsx`);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'DARK': return 'theme-dark min-h-screen text-white';
      case 'GLASS': return 'theme-glass min-h-screen text-white';
      case 'EMERALD': return 'theme-emerald min-h-screen text-white';
      default: return 'bg-gray-50 text-gray-900 min-h-screen';
    }
  };

  const getCardClasses = () => {
    switch (theme) {
      case 'DARK': return 'dark-card p-4 md:p-6 rounded-2xl shadow-2xl';
      case 'GLASS': return 'glass-card p-4 md:p-6 rounded-2xl shadow-2xl';
      case 'EMERALD': return 'emerald-card p-4 md:p-6 rounded-2xl shadow-2xl';
      default: return 'bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100';
    }
  };

  const filteredVacations = useMemo(() => {
    const cycleStart = new Date(selectedYear, selectedMonth - 1, 21);
    const cycleEnd = new Date(selectedYear, selectedMonth, 20);

    return vacations.filter(v => {
      const vDate = parseDate(v.date);
      const inCycle = vDate >= cycleStart && vDate <= cycleEnd;
      const matchEmp = vacationFilterId ? v.employeeId === vacationFilterId : true;
      return inCycle && matchEmp;
    });
  }, [vacations, selectedMonth, selectedYear, vacationFilterId]);

  const historyAttendanceGrouped = useMemo((): Record<string, AttendanceRecord[]> => {
    if (!historySelectedEmployeeId) return {};
    const empHistory = history.filter(h => h.employeeId === historySelectedEmployeeId);
    const groups: Record<string, AttendanceRecord[]> = {};
    empHistory.forEach(h => {
      const label = getCycleLabel(h.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(h);
    });
    return groups;
  }, [history, historySelectedEmployeeId]);

  return (
    <div className={`${getThemeClasses()} flex flex-col h-screen overflow-hidden`}>
      {saveStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={20}/> تم الحفظ والمزامنة!
        </div>
      )}
      
      {copyFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
          <Copy size={20}/> تم نسخ البيانات!
        </div>
      )}

      {/* Header */}
      <header className="bg-rose-600 text-white p-3 md:p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-black/10 rounded-full">
            {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter">SOFT ROSE</h1>
            <span className="text-[8px] md:text-[10px] uppercase opacity-70">Admin System v4.2</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-black/10 rounded-full">
          {(['LIGHT', 'DARK', 'GLASS', 'EMERALD'] as ThemeType[]).map((t) => (
            <button key={t} onClick={() => setTheme(t)} className={`p-1.5 rounded-full transition-all ${theme === t ? 'bg-white shadow-lg' : 'opacity-50'}`}>
              <Palette size={14} className={theme === t ? 'text-rose-600' : 'text-gray-400'} />
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`fixed lg:relative h-full z-40 transition-all duration-300 ${sidebarOpen ? 'w-64 sm:w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} bg-white/5 backdrop-blur-md border-l border-black/5 flex-shrink-0`}>
          <nav className="p-4 space-y-2 h-full">
            <button onClick={() => setView('HOME')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${view === 'HOME' ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
              <Home size={20} /> <span className="font-bold">الصفحة الرئيسية</span>
            </button>
            <button onClick={() => setView('ENTRY')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${view === 'ENTRY' ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
              <Users size={20} /> <span className="font-bold">حضور وانصراف</span>
            </button>
            <button onClick={() => setView('HISTORY')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${view === 'HISTORY' ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
              <History size={20} /> <span className="font-bold">الأرشيف والسجلات</span>
            </button>
            <button onClick={() => setView('VACATIONS')} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${view === 'VACATIONS' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
              <Plane size={20} /> <span className="font-bold">إجازات الموظفين</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {view === 'HOME' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in">
               <h2 className="text-3xl font-black">نظرة عامة</h2>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className={getCardClasses()}>
                    <p className="opacity-70 text-sm">إجمالي الموظفين</p>
                    <h4 className="text-4xl font-black">{employees.length}</h4>
                  </div>
                  <div className={getCardClasses()}>
                    <p className="opacity-70 text-sm">الإجازات المسجلة</p>
                    <h4 className="text-4xl font-black">{vacations.length}</h4>
                  </div>
               </div>

               <div className={getCardClasses()}>
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-rose-600"><FileSpreadsheet size={28}/> التصدير الشامل</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-4">
                      <label className="font-bold text-sm block opacity-70">اختر الدورة (21 إلى 20)</label>
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-4 bg-black/5 rounded-2xl outline-none font-bold text-black border-2 border-transparent focus:border-rose-500 transition-all">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>دورة شهر {m}</option>)}
                      </select>
                    </div>
                    <button onClick={exportAllEmployeesExcel} className="bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                      <Download size={24}/> تصدير جدول كل الموظفين (Excel)
                    </button>
                  </div>
               </div>

               <div className={getCardClasses()}>
                  <h2 className="text-3xl font-black mb-4">أهلاً بك في SOFT ROSE</h2>
                  <p className="opacity-80 mb-8 leading-relaxed">النظام الإداري الموحد لإدارة الموارد البشرية.</p>
                  <button onClick={handleSaveAll} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                    <Save size={20}/> حفظ ومزامنة جميع البيانات
                  </button>
               </div>
             </div>
          )}

          {view === 'ENTRY' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-right">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-black">تسجيل الحضور والانصراف</h2>
                {currentTable.length > 0 && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleCopyTableData} className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
                      <Copy size={20}/> نسخ الجدول
                    </button>
                    <button onClick={() => {
                        const empName = employees.find(e => e.id === selectedEmployeeId)?.name || "غير معروف";
                        handleExportEntrySingle(currentTable, empName);
                    }} className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
                      <FileSpreadsheet size={20}/> تصدير Excel
                    </button>
                  </div>
                )}
              </div>
              
              <div className={getCardClasses()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="font-bold flex items-center gap-2 text-rose-500"><UserCheck size={20}/> اختيار الموظف</label>
                    <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                      <option value="">اختر موظف...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="font-bold flex items-center gap-2 text-rose-500"><CalendarDays size={20}/> دورة الشهر</label>
                    <div className="flex gap-2">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 p-4 bg-black/5 rounded-2xl outline-none text-black">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>دورة {m}</option>)}
                      </select>
                      <button onClick={() => {
                        const emp = employees.find(e => e.id === selectedEmployeeId);
                        if (!emp) return alert('يرجى اختيار موظف أولاً');
                        const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, emp.name, vacations);
                        setCurrentTable(table);
                      }} className="bg-rose-600 text-white px-8 rounded-2xl font-bold shadow-md active:scale-95">انشيء الجدول</button>
                    </div>
                  </div>
                </div>
              </div>

              {currentTable.length > 0 && (
                <div className={`${getCardClasses()} !p-0 overflow-hidden`}>
                  <div className="p-4 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-black text-lg">مراجعة بيانات الجدول</h3>
                    <button onClick={handleTransfer} className="bg-rose-600 text-white px-8 py-2 rounded-xl font-bold shadow-md active:scale-95">ترحيل للأرشيف</button>
                  </div>
                  <div className="overflow-x-auto selectable-table">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-black/5 text-xs font-black">
                        <tr>
                          <th className="p-4 border">اليوم</th>
                          <th className="p-4 border">التاريخ</th>
                          <th className="p-4 border">الحضور</th>
                          <th className="p-4 border">الانصراف</th>
                          <th className="p-4 border">الملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable.map((row, idx) => {
                          const isHoliday = row.checkIn === 'اجازه';
                          return (
                            <tr key={idx} className={`border-b border-black/5 text-sm ${isHoliday ? 'bg-gray-100/50 text-gray-500 italic' : ''}`}>
                              <td className="p-4 font-bold border">{row.day}</td>
                              <td className="p-4 opacity-70 border" dir="ltr">{row.date}</td>
                              <td className="p-2 border">
                                  <input type="text" value={row.checkIn} onChange={e => {
                                      const up = [...currentTable]; up[idx].checkIn = e.target.value; setCurrentTable(up);
                                  }} className="w-full text-center p-2 rounded-lg bg-black/5 border-transparent outline-none focus:bg-white focus:border-rose-300 transition-all" />
                              </td>
                              <td className="p-2 border">
                                  <input type="text" value={row.checkOut} onChange={e => {
                                      const up = [...currentTable]; up[idx].checkOut = e.target.value; setCurrentTable(up);
                                  }} className="w-full text-center p-2 rounded-lg bg-black/5 border-transparent outline-none focus:bg-white focus:border-rose-300 transition-all" />
                              </td>
                              <td className="p-2 border">
                                  <input type="text" value={row.notes || ""} placeholder="..." onChange={e => {
                                      const up = [...currentTable]; up[idx].notes = e.target.value; setCurrentTable(up);
                                  }} className="w-full text-center p-2 bg-transparent text-xs font-bold outline-none text-rose-700" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'HISTORY' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-left">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">الأرشيف والسجلات</h2>
                <button onClick={handleSaveAll} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md">
                    <Save size={18}/> حفظ التعديلات
                </button>
              </div>
              <div className={getCardClasses()}>
                <select value={historySelectedEmployeeId} onChange={e => setHistorySelectedEmployeeId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black mb-8">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <div className="space-y-12">
                  {Object.entries(historyAttendanceGrouped).map(([label, records]) => (
                    <div key={label} className="space-y-4 border-r-8 border-rose-500 pr-4">
                      <div className="flex justify-between items-center">
                          <h4 className="text-xl font-black text-rose-600">{label}</h4>
                          <button onClick={() => {
                              const emp = employees.find(e => e.id === historySelectedEmployeeId);
                              handleExportEntrySingle(records as AttendanceRecord[], emp?.name || "غير معروف");
                          }} className="text-xs bg-black/5 px-4 py-2 rounded-lg">تصدير الدورة</button>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-black/5">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="bg-rose-50 font-bold">
                            <tr><th className="p-3 border">اليوم</th><th className="p-3 border">التاريخ</th><th className="p-3 border">ح</th><th className="p-3 border">ص</th></tr>
                          </thead>
                          <tbody>
                            {(records as AttendanceRecord[]).map((r, i) => (
                              <tr key={i} className="border-b border-black/5">
                                <td className="p-3 font-bold">{r.day}</td>
                                <td className="p-3 opacity-60">{r.date}</td>
                                <td className="p-3">{r.checkIn}</td>
                                <td className="p-3">{r.checkOut}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'VACATIONS' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-black flex items-center gap-3"><Plane size={32} className="text-indigo-600"/> إدارة الإجازات</h2>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button onClick={() => setIsEmployeeModalOpen(true)} className="bg-rose-100 text-rose-700 px-6 py-4 rounded-2xl font-bold shadow-md hover:bg-rose-200 transition-all flex items-center justify-center gap-2">
                    <UserPlus size={20}/> إضافة موظف جديد
                  </button>
                  <button onClick={handleSaveAll} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all">
                    <Save size={20}/> حفظ ومزامنة البيانات
                  </button>
                  <button onClick={() => {
                      setEditingVacationId(null);
                      setIsVacationModalOpen(true);
                  }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all">
                    <Plus size={24}/> تسجيل إجازة جديدة
                  </button>
                </div>
              </div>

              <div className={getCardClasses()}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60">تصفية حسب الدورة (21 إلى 20)</label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>دورة شهر {m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60">تصفية حسب الموظف</label>
                    <select value={vacationFilterId} onChange={e => setVacationFilterId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                      <option value="">جميع الموظفين المسجلين</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-800 text-sm font-bold text-center">
                    إجمالي الإجازات في هذه الدورة: {filteredVacations.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVacations.map(v => (
                    <div key={v.id} className="p-4 bg-black/5 rounded-2xl flex justify-between items-center border border-black/5 group hover:border-indigo-200 transition-colors text-black">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                          {employees.find(e => e.id === v.employeeId)?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{employees.find(e => e.id === v.employeeId)?.name}</p>
                          <div className="flex gap-2 items-center text-[10px] opacity-60">
                            <span className="font-mono bg-white px-1.5 rounded border border-black/5">{v.date}</span>
                            <span className="bg-white px-2 py-0.5 rounded shadow-sm text-indigo-600 font-bold">{v.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => {
                            setEditingVacationId(v.id);
                            setStartDateInput(v.date);
                            setVacationType(v.type);
                            setDeductFromSalary(v.deductFromSalary);
                            setSelectedEmployeeId(v.employeeId);
                            setIsVacationModalOpen(true);
                        }} className="p-2 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100"><Edit2 size={14}/></button>
                        <button onClick={() => {
                            if (confirm('حذف هذه الإجازة؟')) setVacations(vacations.filter(vac => vac.id !== v.id));
                        }} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {filteredVacations.length === 0 && (
                    <div className="col-span-full py-12 text-center opacity-30 italic">لا توجد إجازات مسجلة لهذه الدورة</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEmployeeModalOpen(false)}></div>
           <div className={`${getCardClasses()} w-full max-w-md relative animate-in slide-in-from-top bg-white text-gray-900`}>
              <h3 className="text-xl font-black mb-6 text-rose-600 flex items-center gap-2"><UserPlus/> إضافة موظف جديد</h3>
              <div className="space-y-4">
                <input type="text" placeholder="اسم الموظف بالكامل" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold" />
                <select value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold">
                  <option value="منسق">منسق</option>
                  <option value="اشر">اشر</option>
                  <option value="مدير">مدير</option>
                </select>
                <button onClick={handleAddEmployee} className="w-full bg-rose-600 text-white p-4 rounded-2xl font-black shadow-lg">حفظ الموظف</button>
              </div>
           </div>
        </div>
      )}

      {/* Vacation Modal */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsVacationModalOpen(false)}></div>
          <div className={`${getCardClasses()} w-full max-w-xl relative animate-in zoom-in duration-300 border-indigo-500/30 border-2 bg-white text-gray-900 shadow-2xl overflow-hidden`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-indigo-600">{editingVacationId ? 'تعديل الإجازة' : 'تسجيل إجازة'}</h3>
              <button onClick={() => setIsVacationModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-60">من تاريخ</label>
                  <input type="date" onChange={e => setStartDateInput(formatDate(new Date(e.target.value)))} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-center focus:ring-2 ring-indigo-500 transition-all" />
                </div>
                {!editingVacationId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60">حتى تاريخ</label>
                    <input type="date" onChange={e => setEndDateInput(formatDate(new Date(e.target.value)))} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-center focus:ring-2 ring-indigo-500 transition-all" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">نوع الإجازة</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['سنوي', 'مرضي', 'عيد', 'غياب بإذن'] as VacationType[]).map(t => (
                    <button key={t} onClick={() => setVacationType(t)} className={`py-3 rounded-xl text-sm font-bold transition-all ${vacationType === t ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="flex items-center gap-3 text-rose-800"><WalletCards size={20}/><span className="font-bold">إجازة تخصم من الراتب</span></div>
                <button onClick={() => setDeductFromSalary(!deductFromSalary)} className={`w-14 h-8 rounded-full transition-all relative ${deductFromSalary ? 'bg-rose-500' : 'bg-gray-300'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${deductFromSalary ? 'right-7' : 'right-1'}`}></div></button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-60">اختر الموظف</label>
                <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-black focus:ring-2 ring-indigo-500 transition-all">
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <button onClick={() => {
                if (!selectedEmployeeId) return alert('اختر الموظف');
                const start = parseDate(startDateInput);
                const end = editingVacationId ? start : parseDate(endDateInput);
                const newVacs: Vacation[] = [];
                let tempDate = new Date(start);
                while (tempDate <= end) {
                  newVacs.push({
                    id: Math.random().toString(36).substr(2, 9),
                    employeeId: selectedEmployeeId,
                    date: formatDate(tempDate),
                    type: vacationType,
                    deductFromSalary
                  });
                  tempDate.setDate(tempDate.getDate() + 1);
                }
                if (editingVacationId) {
                    setVacations(vacations.map(v => v.id === editingVacationId ? newVacs[0] : v));
                } else {
                    setVacations([...vacations, ...newVacs]);
                }
                setIsVacationModalOpen(false);
                handleSaveAll();
              }} disabled={!selectedEmployeeId} className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all ${selectedEmployeeId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {editingVacationId ? 'تعديل وحفظ' : 'تأكيد ومزامنة البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black/5 border-t p-3 text-center text-[10px] opacity-40 shrink-0">
        SOFT ROSE MANAGEMENT SYSTEM &bull; v4.2 &copy; 2025
      </footer>
    </div>
  );
}
