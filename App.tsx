
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
  AlertCircle,
  Share2,
  FileSpreadsheet,
  Filter,
  CloudUpload,
  ArrowLeftRight,
  ShieldCheck,
  WalletCards,
  FileDown
} from 'lucide-react';
import { Employee, AttendanceRecord, ViewType, ThemeType, Vacation, VacationType } from './types';
import { INITIAL_EMPLOYEES } from './constants';
import { generateAttendanceCycle, copyToClipboard, getCycleLabel, parseDate, formatDate } from './utils';
import * as XLSX from 'xlsx';

export default function App() {
  const [view, setView] = useState<ViewType>('HOME');
  const [theme, setTheme] = useState<ThemeType>('LIGHT');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);

  // Form States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [vacationFilterId, setVacationFilterId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentTable, setCurrentTable] = useState<AttendanceRecord[]>([]);

  // Vacation Modal States
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [editingVacationId, setEditingVacationId] = useState<string | null>(null);
  const [startDateInput, setStartDateInput] = useState(formatDate(new Date()));
  const [endDateInput, setEndDateInput] = useState(formatDate(new Date()));
  const [vacationType, setVacationType] = useState<VacationType>('سنوي');
  const [deductFromSalary, setDeductFromSalary] = useState(false);

  // History Filter States
  const [historySelectedEmployeeId, setHistorySelectedEmployeeId] = useState('');
  const [historySelectedDate, setHistorySelectedDate] = useState('');

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem('sr_employees', JSON.stringify(employees));
    localStorage.setItem('sr_history', JSON.stringify(history));
    localStorage.setItem('sr_vacations', JSON.stringify(vacations));
    localStorage.setItem('sr_theme', theme);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
    
    // Refresh current table if it exists to show new vacations
    if (selectedEmployeeId && currentTable.length > 0) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) {
        const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, emp.name, vacations);
        setCurrentTable(table);
      }
    }
  };

  const openVacationModal = (vac?: Vacation) => {
    if (vac) {
      setEditingVacationId(vac.id);
      setStartDateInput(vac.date);
      setEndDateInput(vac.date);
      setVacationType(vac.type);
      setDeductFromSalary(vac.deductFromSalary);
      setSelectedEmployeeId(vac.employeeId);
    } else {
      setEditingVacationId(null);
      setStartDateInput(formatDate(new Date()));
      setEndDateInput(formatDate(new Date()));
      setVacationType('سنوي');
      setDeductFromSalary(false);
    }
    setIsVacationModalOpen(true);
  };

  const handleAddVacation = () => {
    if (!selectedEmployeeId || !startDateInput || !endDateInput) {
      alert('يرجى التأكد من اختيار الموظف والتواريخ');
      return;
    }

    if (editingVacationId) {
      setVacations(vacations.map(v => v.id === editingVacationId ? {
        ...v,
        date: startDateInput,
        type: vacationType,
        deductFromSalary,
        employeeId: selectedEmployeeId
      } : v));
      setIsVacationModalOpen(false);
      return;
    }

    const start = parseDate(startDateInput);
    const end = parseDate(endDateInput);

    if (start > end) {
      alert('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية');
      return;
    }

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

    setVacations([...vacations, ...newVacs]);
    setIsVacationModalOpen(false);
  };

  const handleDeleteVacation = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الإجازة؟')) {
      setVacations(vacations.filter(v => v.id !== id));
    }
  };

  const handleTransfer = () => {
    if (currentTable.length === 0) return;
    setHistory([...history, ...currentTable]);
    setCurrentTable([]);
    alert('تم الترحيل للأرشيف بنجاح');
  };

  // Specialized Excel Export Helper
  const exportAttendanceExcel = (data: AttendanceRecord[], employeeName: string, title: string) => {
    const header = [[`اسم الموظف: ${employeeName}`], [`${title}`], []];
    const columns = [["اليوم", "التاريخ", "الحضور", "الانصراف", "الملاحظات"]];
    const rows = data.map(r => [r.day, r.date, r.checkIn, r.checkOut, r.notes || ""]);
    
    const combined = [...header, ...columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(combined);
    
    const wscols = [{wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `SoftRose_${employeeName}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleExportEntryTable = () => {
    if (currentTable.length === 0) return alert("لا توجد بيانات لتصديرها");
    const empName = employees.find(e => e.id === selectedEmployeeId)?.name || "غير معروف";
    exportAttendanceExcel(currentTable, empName, `سجل حضور وانصراف - شهر ${selectedMonth}`);
  };

  const handleExportHistoryDate = () => {
    if (filteredAttendance.length === 0) return alert("لا توجد سجلات لهذا التاريخ");
    const wsData = [
      [`سجل حضور وانصراف بتاريخ: ${historySelectedDate}`],
      [],
      ["الموظف", "الحضور", "الانصراف", "الملاحظات"]
    ];
    filteredAttendance.forEach(a => {
      wsData.push([a.employeeName, a.checkIn, a.checkOut, a.notes || ""]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceHistory");
    XLSX.writeFile(wb, `Attendance_History_${historySelectedDate}.xlsx`);
  };

  const handleExportVacations = () => {
    const list = vacations.filter(v => vacationFilterId ? v.employeeId === vacationFilterId : true);
    if (list.length === 0) return alert("لا توجد إجازات لتصديرها");
    
    const wsData = [
      ["سجل الإجازات"],
      [],
      ["الموظف", "التاريخ", "النوع", "ملاحظات"]
    ];
    list.forEach(v => {
      const emp = employees.find(e => e.id === v.employeeId);
      wsData.push([emp?.name || "غير معروف", v.date, v.type, v.deductFromSalary ? "تخصم من الراتب" : ""]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VacationsList");
    XLSX.writeFile(wb, `SoftRose_Vacations_${new Date().toLocaleDateString()}.xlsx`);
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

  const historyVacationsGrouped = useMemo((): Record<string, Vacation[]> => {
    if (!historySelectedEmployeeId) return {};
    const empVacs = vacations.filter(v => v.employeeId === historySelectedEmployeeId);
    const groups: Record<string, Vacation[]> = {};
    empVacs.forEach(v => {
      const label = getCycleLabel(v.date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(v);
    });
    return groups;
  }, [vacations, historySelectedEmployeeId]);

  const filteredAttendance = useMemo(() => {
    if (!historySelectedDate) return [];
    const [year, month, day] = historySelectedDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    return history.filter(h => h.date === formattedDate);
  }, [history, historySelectedDate]);

  return (
    <div className={`${getThemeClasses()} flex flex-col h-screen overflow-hidden`}>
      {saveStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Check size={20}/> تم حفظ جميع البيانات ومزامنة الجدول!
        </div>
      )}

      {/* Header */}
      <header className={`bg-rose-600 text-white p-3 md:p-4 flex justify-between items-center sticky top-0 z-50 shadow-md`}>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-black/10 rounded-full">
            {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter">SOFT ROSE</h1>
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] opacity-70">Management Systems</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-black/10 rounded-full">
            {(['LIGHT', 'DARK', 'GLASS', 'EMERALD'] as ThemeType[]).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`p-1.5 rounded-full transition-all ${theme === t ? 'bg-white shadow-lg' : 'opacity-50'}`}>
                <Palette size={14} className={theme === t ? 'text-rose-600' : 'text-gray-400'} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`
          fixed lg:relative h-full z-40 transition-all duration-300
          ${sidebarOpen ? 'w-64 sm:w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'}
          bg-white/5 backdrop-blur-md border-l border-black/5 flex-shrink-0 overflow-hidden
        `}>
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
               <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black">نظرة عامة</h2>
                  <button onClick={() => {
                      const wsData = [["قائمة موظفي SOFT ROSE"], [], ["المعرف", "الاسم", "الوظيفة"]];
                      employees.forEach(e => wsData.push([e.id, e.name, e.role]));
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Employees");
                      XLSX.writeFile(wb, "SoftRose_Employees.xlsx");
                  }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
                    <FileDown size={18}/> تصدير الموظفين
                  </button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className={getCardClasses()}>
                    <p className="opacity-70 text-sm">الموظفين</p>
                    <h4 className="text-4xl font-black">{employees.length}</h4>
                  </div>
                  <div className={getCardClasses()}>
                    <p className="opacity-70 text-sm">إجمالي السجلات</p>
                    <h4 className="text-4xl font-black">{history.length}</h4>
                  </div>
                  <div className={getCardClasses()}>
                    <p className="opacity-70 text-sm">الإجازات</p>
                    <h4 className="text-4xl font-black">{vacations.length}</h4>
                  </div>
               </div>
               <div className={getCardClasses()}>
                  <h2 className="text-3xl font-black mb-4">أهلاً بك في نظام SOFT ROSE</h2>
                  <p className="opacity-80 mb-8 leading-relaxed">نظام متكامل لإدارة الحضور والانصراف مع دعم العطلات الأسبوعية المخصصة (الجمعة افتراضي، الثلاثاء لأسماء، الاثنين لملك، الأحد لأمنية).</p>
                  <button onClick={handleSaveAll} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                    <Save size={20}/> حفظ ومزامنة البيانات
                  </button>
               </div>
             </div>
          )}

          {view === 'ENTRY' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-right">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">تسجيل الحضور والانصراف</h2>
                {currentTable.length > 0 && (
                  <button onClick={handleExportEntryTable} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">
                    <FileSpreadsheet size={20}/> تصدير ملف إكسيل
                  </button>
                )}
              </div>
              
              <div className={getCardClasses()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="font-bold flex items-center gap-2 text-rose-500"><UserCheck size={20}/> الموظف</label>
                    <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                      <option value="">اختر موظف...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="font-bold flex items-center gap-2 text-rose-500"><CalendarDays size={20}/> شهر الدورة</label>
                    <div className="flex gap-2">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 p-4 bg-black/5 rounded-2xl outline-none text-black">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>دورة شهر {m}</option>)}
                      </select>
                      <button onClick={() => {
                        const emp = employees.find(e => e.id === selectedEmployeeId);
                        if (!emp) return alert('اختر موظف');
                        const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, emp.name, vacations);
                        setCurrentTable(table);
                      }} className="bg-rose-600 text-white px-8 rounded-2xl font-bold active:scale-95 shadow-md">انشيء الجدول</button>
                    </div>
                  </div>
                </div>
              </div>

              {currentTable.length > 0 && (
                <div className={`${getCardClasses()} !p-0 overflow-hidden`}>
                  <div className="p-4 border-b border-black/5 flex justify-between items-center">
                    <div className="flex flex-col">
                      <h3 className="font-black text-lg">مراجعة بيانات الحضور</h3>
                      <p className="text-xs opacity-60">الموظف: {employees.find(e => e.id === selectedEmployeeId)?.name}</p>
                    </div>
                    <button onClick={handleTransfer} className="bg-rose-600 text-white px-8 py-2 rounded-xl font-bold active:scale-95 shadow-sm">ترحيل للأرشيف</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-black/5 text-xs">
                        <tr>
                          <th className="p-4">اليوم</th>
                          <th className="p-4">التاريخ</th>
                          <th className="p-4">الحضور</th>
                          <th className="p-4">الانصراف</th>
                          <th className="p-4">الملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable.map((row, idx) => (
                          <tr key={idx} className={`border-b border-black/5 text-sm ${row.checkIn === 'راحة إسبوعية' ? 'bg-gray-50/50' : ''}`}>
                            <td className="p-4 font-bold">{row.day}</td>
                            <td className="p-4 opacity-70" dir="ltr">{row.date}</td>
                            <td className="p-2">
                                <input type="text" value={row.checkIn} onChange={e => {
                                    const up = [...currentTable]; up[idx].checkIn = e.target.value; setCurrentTable(up);
                                }} className={`w-full text-center p-2 rounded-lg outline-none focus:bg-white border transition-colors ${row.checkIn === 'راحة إسبوعية' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-bold' : 'bg-black/5 border-transparent'}`} />
                            </td>
                            <td className="p-2">
                                <input type="text" value={row.checkOut} onChange={e => {
                                    const up = [...currentTable]; up[idx].checkOut = e.target.value; setCurrentTable(up);
                                }} className="w-full text-center p-2 bg-black/5 rounded-lg border-transparent border outline-none focus:bg-white" />
                            </td>
                            <td className="p-2">
                              <span className={`text-[10px] font-bold ${row.notes ? 'text-rose-600' : 'opacity-40'}`}>
                                {row.notes || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
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
                <h2 className="text-3xl font-black">الأرشيف والسجلات المتقدمة</h2>
                <div className="flex gap-2">
                  <button onClick={handleExportHistoryDate} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
                    <Download size={18}/> تصدير التاريخ
                  </button>
                  <button onClick={handleSaveAll} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 shadow-md">
                    <CloudUpload size={18}/> حفظ التغييرات
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={getCardClasses()}>
                  <label className="block font-bold mb-4 flex items-center gap-2 text-indigo-600"><Users size={20}/> بحث عن إجازات موظف</label>
                  <select value={historySelectedEmployeeId} onChange={e => setHistorySelectedEmployeeId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                    <option value="">اختر الموظف...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <div className="mt-6 space-y-4">
                    {Object.entries(historyVacationsGrouped).map(([label, vacs]) => (
                      <div key={label} className="p-4 bg-black/5 rounded-2xl border-r-4 border-indigo-500">
                        <h4 className="font-bold text-sm mb-3">{label}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(vacs as Vacation[]).map(v => (
                            <div key={v.id} className="text-[11px] bg-white p-3 rounded-xl shadow-sm border border-black/5 flex flex-col gap-2 relative text-black">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className="font-bold text-rose-600 text-xs">{v.date}</span>
                                  <span className="opacity-70">{v.type}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => openVacationModal(v)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><Edit2 size={12}/></button>
                                  <button onClick={() => handleDeleteVacation(v.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={12}/></button>
                                </div>
                              </div>
                              {v.deductFromSalary && <span className="inline-block self-start text-[8px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">يخصم من الراتب</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={getCardClasses()}>
                   <label className="block font-bold mb-4 flex items-center gap-2 text-rose-600"><Calendar size={20}/> سجل الحضور بالتاريخ</label>
                   <input type="date" onChange={e => setHistorySelectedDate(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black" />
                   <div className="mt-6 space-y-4">
                      {filteredAttendance.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-center">
                            <thead className="bg-black/5">
                              <tr><th className="p-2">الموظف</th><th className="p-2">ح</th><th className="p-2">ص</th><th className="p-2">ملاحظات</th></tr>
                            </thead>
                            <tbody>
                              {filteredAttendance.map(a => (
                                <tr key={a.id} className="border-b border-black/5">
                                  <td className="p-2 font-bold">{a.employeeName}</td>
                                  <td className="p-2">{a.checkIn}</td>
                                  <td className="p-2">{a.checkOut}</td>
                                  <td className="p-2 text-[8px] text-rose-600 font-bold">{a.notes || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        historySelectedDate && <div className="p-10 text-center opacity-40 italic">لا توجد سجلات لهذا اليوم</div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {view === 'VACATIONS' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-black flex items-center gap-3"><Plane size={32} className="text-indigo-600"/> إدارة الإجازات</h2>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button onClick={handleExportVacations} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl font-bold border border-indigo-200 shadow-md hover:bg-indigo-100 flex items-center justify-center gap-2">
                    <FileDown size={20}/> تصدير الإجازات
                  </button>
                  <button onClick={handleSaveAll} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all">
                    <Save size={20}/> حفظ التعديلات والمزامنة
                  </button>
                  <button onClick={() => openVacationModal()} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl active:scale-95 flex items-center justify-center gap-2 transition-all">
                    <Plus size={24}/> تسجيل إجازة جديدة
                  </button>
                </div>
              </div>

              <div className={getCardClasses()}>
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1">
                    <label className="block text-xs font-bold mb-2 opacity-60 uppercase">عرض إجازات موظف محدد</label>
                    <select value={vacationFilterId} onChange={e => setVacationFilterId(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl outline-none text-black">
                      <option value="">عرض الكل...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vacations.filter(v => vacationFilterId ? v.employeeId === vacationFilterId : true).map(v => (
                    <div key={v.id} className="p-4 bg-black/5 rounded-2xl flex justify-between items-center border border-black/5 group hover:border-indigo-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                          {employees.find(e => e.id === v.employeeId)?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{employees.find(e => e.id === v.employeeId)?.name}</p>
                          <div className="flex gap-2 items-center text-[10px] opacity-60">
                            <span className="font-mono bg-white px-1.5 rounded border border-black/5">{v.date}</span>
                            <span className="bg-white px-2 py-0.5 rounded shadow-sm text-indigo-600 font-bold">{v.type}</span>
                            {v.deductFromSalary && <span className="text-rose-500 font-bold px-1.5 bg-rose-50 rounded">خصم</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openVacationModal(v)} title="تعديل" className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl hover:bg-indigo-100 active:scale-90 transition-all">
                          <Edit2 size={16}/>
                        </button>
                        <button onClick={() => handleDeleteVacation(v.id)} title="حذف" className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 active:scale-90 transition-all">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {vacations.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-30 italic">لا توجد سجلات إجازة لعرضها</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Vacation Modal */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsVacationModalOpen(false)}></div>
          <div className={`${getCardClasses()} w-full max-w-xl relative animate-in zoom-in duration-300 border-indigo-500/30 border-2 bg-white text-gray-900 shadow-2xl overflow-hidden`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-indigo-600">{editingVacationId ? 'تعديل بيانات الإجازة' : 'تسجيل طلب إجازة'}</h3>
              <button onClick={() => setIsVacationModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-60">{editingVacationId ? 'التاريخ' : 'من تاريخ'}</label>
                  <input type="date" value={editingVacationId ? startDateInput.split('/').reverse().join('-') : undefined} onChange={e => setStartDateInput(formatDate(new Date(e.target.value)))} className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-bold text-center focus:ring-2 ring-indigo-500 transition-all" />
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
                    <button key={t} onClick={() => setVacationType(t)} className={`py-3 rounded-xl text-sm font-bold transition-all ${vacationType === t ? 'bg-indigo-600 text-white scale-105 shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{t}</button>
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
              <button onClick={handleAddVacation} disabled={!selectedEmployeeId} className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all ${selectedEmployeeId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {editingVacationId ? 'تعديل الإجازة ومزامنة الجدول' : 'تأكيد وتسجيل الفترة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black/5 border-t p-3 text-center text-[10px] opacity-40 shrink-0">
        SOFT ROSE MANAGEMENT SYSTEM &bull; v2.6 &copy; 2025
      </footer>
    </div>
  );
}
