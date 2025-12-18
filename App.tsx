
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
  LayoutDashboard,
  Clock,
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
  FileSpreadsheet
} from 'lucide-react';
import { Employee, AttendanceRecord, ViewType, ThemeType, Vacation } from './types';
import { INITIAL_EMPLOYEES } from './constants';
import { generateAttendanceCycle, copyToClipboard } from './utils';
import * as XLSX from 'xlsx';

export default function App() {
  const [view, setView] = useState<ViewType>('HOME');
  const [theme, setTheme] = useState<ThemeType>('LIGHT');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // View States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentTable, setCurrentTable] = useState<AttendanceRecord[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('منسق');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // History Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{in: string, out: string}>({in: '', out: ''});

  // Vacation States
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationDateInput, setVacationDateInput] = useState('');

  // Search/History Filter States
  const [historySearchName, setHistorySearchName] = useState('');
  const [historySearchDate, setHistorySearchDate] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'DARK': return 'theme-dark min-h-screen';
      case 'GLASS': return 'theme-glass min-h-screen text-white';
      case 'EMERALD': return 'theme-emerald min-h-screen text-white';
      default: return 'bg-gray-50 text-gray-900 min-h-screen';
    }
  };

  const getCardClasses = () => {
    switch (theme) {
      case 'DARK': return 'dark-card p-6 rounded-2xl shadow-2xl';
      case 'GLASS': return 'glass-card p-6 rounded-2xl shadow-2xl';
      case 'EMERALD': return 'emerald-card p-6 rounded-2xl shadow-2xl';
      default: return 'bg-white p-6 rounded-2xl shadow-lg border border-gray-100';
    }
  };

  const getHeaderClasses = () => {
    switch (theme) {
      case 'DARK': return 'bg-zinc-900 border-b border-zinc-800';
      case 'GLASS': return 'bg-white/10 backdrop-blur-xl border-b border-white/20 text-white';
      case 'EMERALD': return 'bg-emerald-900/50 backdrop-blur-md border-b border-emerald-700 text-white';
      default: return 'bg-rose-600 text-white';
    }
  };

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) return;
    const newEmp: Employee = {
      id: Date.now().toString(),
      name: newEmployeeName,
      role: newEmployeeRole
    };
    setEmployees([...employees, newEmp]);
    setNewEmployeeName('');
    setIsAddingEmployee(false);
  };

  const handleGenerateTable = () => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) {
      alert('يرجى اختيار موظف أولاً');
      return;
    }
    const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, `${emp.name} (${emp.role})`, vacations);
    setCurrentTable(table);
  };

  const handleTransfer = () => {
    if (currentTable.length === 0) return;
    // Add cycle info to records before saving to history
    const recordsWithCycle = currentTable.map(r => ({
      ...r,
      cycleMonth: selectedMonth,
      cycleYear: selectedYear
    }));
    setHistory([...history, ...recordsWithCycle]);
    setCurrentTable([]);
    alert('تم الترحيل بنجاح إلى السجلات السابقة');
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      setHistory(history.filter(h => h.id !== id));
    }
  };

  const startEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditData({ in: record.checkIn, out: record.checkOut });
  };

  const saveEdit = (id: string) => {
    setHistory(history.map(h => h.id === id ? { ...h, checkIn: editData.in, checkOut: editData.out } : h));
    setEditingId(null);
  };

  const handleAddVacation = () => {
    if (!selectedEmployeeId || !vacationDateInput) {
      alert('يرجى اختيار موظف وتاريخ الإجازة');
      return;
    }
    const newVacation: Vacation = {
      id: Date.now().toString(),
      employeeId: selectedEmployeeId,
      date: vacationDateInput
    };
    setVacations([...vacations, newVacation]);
    setIsVacationModalOpen(false);
    setVacationDateInput('');
    alert('تمت إضافة الإجازة بنجاح');
  };

  // Grouped History Logic
  const groupedHistory = useMemo(() => {
    const filtered = history.filter(h => {
      const matchesName = h.employeeName.toLowerCase().includes(historySearchName.toLowerCase());
      const matchesDate = historySearchDate ? h.date === historySearchDate : true;
      return matchesName && matchesDate;
    });

    // Group by Employee and then by Cycle Month/Year
    const groups: { [key: string]: AttendanceRecord[] } = {};
    filtered.forEach(record => {
      // Use cycleMonth and cycleYear from AttendanceRecord interface
      const cycleKey = `${record.employeeName}_${record.cycleMonth}_${record.cycleYear}`;
      if (!groups[cycleKey]) groups[cycleKey] = [];
      groups[cycleKey].push(record);
    });
    return groups;
  }, [history, historySearchName, historySearchDate]);

  const handleExportGroup = (records: AttendanceRecord[], title: string) => {
    const data = records.map(r => ({
      'اليوم': r.day,
      'التاريخ': r.date,
      'الحضور': r.checkIn,
      'الانصراف': r.checkOut
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  const handleCopyGroup = (records: AttendanceRecord[]) => {
    const header = "اليوم\tالتاريخ\tالحضور\tالانصراف\n";
    const body = records.map(r => `${r.day}\t${r.date}\t${r.checkIn}\t${r.checkOut}`).join('\n');
    copyToClipboard(header + body).then(() => alert('تم النسخ للحافظة!'));
  };

  const handleShareGroup = async (records: AttendanceRecord[], title: string) => {
    const summary = `${title}\n` + records.map(r => `${r.date}: ${r.checkIn} - ${r.checkOut}`).join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ title: title, text: summary });
      } catch (e) {
        console.error("Error sharing", e);
      }
    } else {
      handleCopyGroup(records);
      alert('تم نسخ الملخص للمشاركة (المتصفح لا يدعم Share API)');
    }
  };

  const handleDeleteGroup = (records: AttendanceRecord[]) => {
    if (confirm('هل أنت متأكد من حذف سجلات هذا الشهر بالكامل؟')) {
      const idsToDelete = new Set(records.map(r => r.id));
      setHistory(history.filter(h => !idsToDelete.has(h.id)));
    }
  };

  return (
    <div className={getThemeClasses()}>
      {/* Header */}
      <header className={`${getHeaderClasses()} p-4 flex justify-between items-center sticky top-0 z-50 transition-colors`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            {sidebarOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter">SOFT ROSE</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">Attendance Systems</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end" dir="ltr">
            <span className="text-xl font-mono font-bold">{currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
            <span className="text-[10px] opacity-70">{currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="flex gap-1 p-1 bg-black/10 rounded-full">
            {(['LIGHT', 'DARK', 'GLASS', 'EMERALD'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-2 rounded-full transition-all ${theme === t ? 'bg-white shadow-lg scale-110' : 'hover:scale-105'}`}
              >
                <Palette size={16} className={theme === t ? 'text-rose-600' : 'text-gray-400'} />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 76px)' }}>
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-500 bg-black/5 backdrop-blur-md border-l border-black/5 flex-shrink-0 z-40 overflow-hidden`}>
          <nav className="p-4 space-y-3">
            <button onClick={() => setView('HOME')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'HOME' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}>
              <Home size={22} /> <span className="font-bold">الصفحة الرئيسية</span>
            </button>
            <div className="h-px bg-black/10 mx-4 my-2"></div>
            <button onClick={() => setView('ENTRY')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'ENTRY' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}>
              <Users size={22} /> <span className="font-bold">حضور وانصراف</span>
            </button>
            <button onClick={() => setView('HISTORY')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'HISTORY' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}>
              <History size={22} /> <span className="font-bold">السجلات السابقة</span>
            </button>
            <button onClick={() => setView('VACATIONS')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'VACATIONS' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}>
              <Plane size={22} /> <span className="font-bold">إجازات المنسقين والأشر</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          {view === 'HOME' && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in zoom-in duration-500">
               <div className="grid md:grid-cols-3 gap-6">
                <div className={`${getCardClasses()} border-r-4 border-r-rose-500`}>
                  <p className="opacity-70 text-sm">الموظفين</p>
                  <h4 className="text-4xl font-black">{employees.length}</h4>
                </div>
                <div className={`${getCardClasses()} border-r-4 border-r-blue-500`}>
                  <p className="opacity-70 text-sm">إجمالي السجلات</p>
                  <h4 className="text-4xl font-black">{history.length}</h4>
                </div>
                <div className={`${getCardClasses()} border-r-4 border-r-indigo-500`}>
                  <p className="opacity-70 text-sm">الإجازات المسجلة</p>
                  <h4 className="text-4xl font-black">{vacations.length}</h4>
                </div>
              </div>
              <div className={getCardClasses()}>
                <h2 className="text-3xl font-black mb-6">نظام Soft Rose لإدارة الموظفين</h2>
                <p className="text-lg opacity-80 mb-8 leading-relaxed">أهلاً بك. يمكنك الآن إدارة الحضور والغياب، تسجيل الإجازات السنوية، ومراجعة الأرشيف بدقة متناهية. استخدم القائمة الجانبية للبدء.</p>
                <div className="flex gap-4">
                  <button onClick={() => setView('VACATIONS')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">إدارة الإجازات</button>
                  <button onClick={() => setView('ENTRY')} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg">تسجيل الحضور</button>
                </div>
              </div>
            </div>
          )}

          {view === 'ENTRY' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-left duration-500">
              <div className={getCardClasses()}>
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-lg font-bold flex items-center gap-3"><UserCheck size={24} className="text-rose-500"/> اسم الموظف</label>
                    <div className="flex gap-3">
                      <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="flex-1 p-4 bg-black/5 rounded-2xl text-black">
                        <option value="">اختر موظف...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                      </select>
                      <button onClick={() => setIsAddingEmployee(!isAddingEmployee)} className="p-4 bg-rose-600 text-white rounded-2xl"><Plus size={28} /></button>
                    </div>
                    {isAddingEmployee && (
                      <div className="p-6 bg-black/5 rounded-2xl space-y-4 animate-in slide-in-from-top">
                        <input type="text" placeholder="اسم الموظف" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} className="w-full p-3 rounded-xl text-black" />
                        <select value={newEmployeeRole} onChange={(e) => setNewEmployeeRole(e.target.value)} className="w-full p-3 rounded-xl text-black">
                          <option value="منسق">منسق</option>
                          <option value="اشر">اشر</option>
                        </select>
                        <button onClick={handleAddEmployee} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">حفظ الموظف</button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <label className="text-lg font-bold flex items-center gap-3"><CalendarDays size={24} className="text-rose-500"/> الفترة</label>
                    <div className="flex gap-3">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 p-4 bg-black/5 rounded-2xl text-black">
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>شهر {m}</option>)}
                      </select>
                      <button onClick={handleGenerateTable} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold">انشيء الجدول</button>
                    </div>
                  </div>
                </div>
              </div>

              {currentTable.length > 0 && (
                <div className={`${getCardClasses()} !p-0 overflow-hidden`}>
                  <div className="p-6 border-b border-black/10 flex justify-between items-center">
                    <h3 className="text-xl font-black">جدول مراجعة الحضور</h3>
                    <button onClick={() => {
                      const emp = employees.find(e => e.id === selectedEmployeeId);
                      handleExportGroup(currentTable, `حضور_${emp?.name}_شهر_${selectedMonth}`);
                    }} className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center gap-2">
                      <Download size={18}/> إكسيل
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center">
                      <thead className="bg-black/5">
                        <tr><th className="p-4">اليوم</th><th className="p-4">التاريخ</th><th className="p-4">الحضور</th><th className="p-4">الانصراف</th></tr>
                      </thead>
                      <tbody>
                        {currentTable.map((row, idx) => (
                          <tr key={idx} className="border-b border-black/5">
                            <td className="p-4 font-bold">{row.day}</td>
                            <td className="p-4 opacity-70" dir="ltr">{row.date}</td>
                            <td className="p-2">
                              <input type="text" value={row.checkIn} onChange={(e) => {
                                const up = [...currentTable]; up[idx].checkIn = e.target.value; setCurrentTable(up);
                              }} className="w-full text-center p-2 bg-black/5 rounded-lg focus:bg-white text-black" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.checkOut} onChange={(e) => {
                                const up = [...currentTable]; up[idx].checkOut = e.target.value; setCurrentTable(up);
                              }} className="w-full text-center p-2 bg-black/5 rounded-lg focus:bg-white text-black" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 flex justify-end gap-4">
                    <button onClick={handleTransfer} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl">تأكيد وترحيل</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'HISTORY' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-20">
              <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black">الأرشيف والسجلات السابقة</h2>
                {history.length > 0 && (
                   <button 
                    onClick={() => {
                      const fullSummary = history.map(h => `${h.employeeName} (${h.date}): ${h.checkIn} - ${h.checkOut}`).join('\n');
                      if (navigator.share) {
                        navigator.share({ title: 'أرشيف الحضور الكامل', text: fullSummary });
                      } else {
                        copyToClipboard(fullSummary);
                        alert('تم نسخ السجل الكامل للحافظة');
                      }
                    }} 
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                   >
                     <Share2 size={20}/> مشاركة الأرشيف
                   </button>
                )}
              </div>
              
              <div className={getCardClasses()}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2 opacity-70"><Search size={16}/> بحث حسب اسم الموظف</label>
                    <input type="text" placeholder="اكتب اسم الموظف..." value={historySearchName} onChange={(e) => setHistorySearchName(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl text-inherit" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2 opacity-70"><Calendar size={16}/> بحث بتاريخ معين</label>
                    <input type="text" placeholder="بحث بالتاريخ..." value={historySearchDate} onChange={(e) => setHistorySearchDate(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl text-inherit" />
                  </div>
                </div>
              </div>

              {/* Grouped Lists per Month/Employee */}
              <div className="space-y-12">
                {/* Fix: Cast Object.entries to correct type to solve 'unknown' parameter errors */}
                {Object.keys(groupedHistory).length > 0 ? (Object.entries(groupedHistory) as [string, AttendanceRecord[]][]).map(([key, records]) => {
                  const [name, month, year] = key.split('_');
                  const title = `سجل ${name} - شهر ${month}/${year}`;
                  return (
                    <div key={key} className={`${getCardClasses()} !p-0 overflow-hidden border-rose-500/20 border-2`}>
                      <div className="p-6 bg-black/5 border-b border-black/10 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-black text-rose-500">{name}</h3>
                          <span className="text-sm opacity-60">فترة التقرير: شهر {month} لعام {year}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleShareGroup(records, title)} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors" title="مشاركة">
                            <Share2 size={20}/>
                          </button>
                          <button onClick={() => handleCopyGroup(records)} className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition-colors" title="نسخ">
                            <Copy size={20}/>
                          </button>
                          <button onClick={() => handleExportGroup(records, title)} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors" title="تصدير إكسيل">
                            <FileSpreadsheet size={20}/>
                          </button>
                          <button onClick={() => handleDeleteGroup(records)} className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors" title="حذف الشهر">
                            <Trash2 size={20}/>
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-center">
                          <thead className="bg-black/5">
                            <tr>
                              <th className="p-4">اليوم</th>
                              <th className="p-4">التاريخ</th>
                              <th className="p-4">الحضور</th>
                              <th className="p-4">الانصراف</th>
                              <th className="p-4">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((h) => (
                              <tr key={h.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                                <td className="p-4 font-bold">{h.day}</td>
                                <td className="p-4 opacity-70 font-mono text-sm" dir="ltr">{h.date}</td>
                                <td className="p-4">
                                  {editingId === h.id ? <input value={editData.in} onChange={e => setEditData({...editData, in: e.target.value})} className="w-24 p-2 text-black text-center rounded-lg border border-rose-300" /> : <span className="font-semibold">{h.checkIn}</span>}
                                </td>
                                <td className="p-4">
                                  {editingId === h.id ? <input value={editData.out} onChange={e => setEditData({...editData, out: e.target.value})} className="w-24 p-2 text-black text-center rounded-lg border border-rose-300" /> : <span className="font-semibold">{h.checkOut}</span>}
                                </td>
                                <td className="p-4">
                                  <div className="flex justify-center gap-2">
                                    {editingId === h.id ? (
                                      <button onClick={() => saveEdit(h.id)} className="p-2 bg-emerald-500 text-white rounded-lg shadow-md"><Check size={16}/></button>
                                    ) : (
                                      <button onClick={() => startEdit(h)} className="p-2 bg-amber-500 text-white rounded-lg shadow-md hover:scale-110 transition-transform"><Edit2 size={16}/></button>
                                    )}
                                    <button onClick={() => handleDeleteRecord(h.id)} className="p-2 bg-rose-500 text-white rounded-lg shadow-md hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-20 text-center opacity-40 italic text-xl">لا توجد سجلات مطابقة للبحث حالياً</div>
                )}
              </div>
            </div>
          )}

          {view === 'VACATIONS' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
              <h2 className="text-4xl font-black flex items-center gap-4"><Plane className="text-indigo-600" size={40}/> إدارة الإجازات</h2>
              <div className={getCardClasses()}>
                <div className="space-y-6">
                  <label className="text-xl font-bold block">اختيار الموظف لتسجيل إجازة</label>
                  <div className="flex gap-4">
                    <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="flex-1 p-4 bg-black/5 rounded-2xl text-black">
                      <option value="">اختر الموظف من هنا...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                    </select>
                    <button onClick={() => setIsVacationModalOpen(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-transform">تسجيل إجازة جديدة</button>
                  </div>
                </div>
              </div>

              {/* Vacation List */}
              <div className={getCardClasses()}>
                <h3 className="text-xl font-bold mb-4">قائمة الإجازات المجدولة</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {vacations.map(v => (
                    <div key={v.id} className="p-4 bg-black/5 rounded-xl flex justify-between items-center border border-black/5">
                      <div>
                        <p className="font-bold text-indigo-600">{employees.find(e => e.id === v.employeeId)?.name}</p>
                        <p className="text-sm opacity-60">{v.date}</p>
                      </div>
                      <button onClick={() => setVacations(vacations.filter(vac => vac.id !== v.id))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition-colors"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  {vacations.length === 0 && <p className="col-span-3 text-center opacity-40 italic py-10">لا توجد إجازات مسجلة حالياً</p>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Vacation Modal */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsVacationModalOpen(false)}></div>
          <div className={`${getCardClasses()} w-full max-w-md relative animate-in zoom-in duration-300 border-indigo-500/30 border-2 text-gray-900`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-indigo-600">تسجيل تاريخ الإجازة</h3>
              <button onClick={() => setIsVacationModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p>تنبيه: سيتم تسجيل هذا اليوم كـ "إجازة سنوية" تلقائياً عند توليد جدول الحضور لهذا الموظف.</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 opacity-70">التاريخ (dd/mm/yyyy)</label>
                <input 
                  type="text" 
                  placeholder="مثال: 25/11/2025" 
                  value={vacationDateInput} 
                  onChange={(e) => setVacationDateInput(e.target.value)} 
                  className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 text-black font-mono"
                />
              </div>
              <button onClick={handleAddVacation} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors">إضافة الإجازة الآن</button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black/5 border-t p-4 text-center text-xs opacity-50">Soft Rose Systems - إدارة الحضور والإجازات الذكية</footer>
    </div>
  );
}
