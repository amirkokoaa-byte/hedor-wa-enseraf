
import React, { useState, useEffect } from 'react';
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
  CalendarDays
} from 'lucide-react';
import { Employee, AttendanceRecord, ViewType, ThemeType } from './types';
import { INITIAL_EMPLOYEES } from './constants';
import { generateAttendanceCycle, copyToClipboard } from './utils';
import * as XLSX from 'xlsx';

export default function App() {
  const [view, setView] = useState<ViewType>('HOME');
  const [theme, setTheme] = useState<ThemeType>('LIGHT');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Form States
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentTable, setCurrentTable] = useState<AttendanceRecord[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('منسق');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Search History States
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

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
      case 'GLASS': return 'bg-white/10 backdrop-blur-xl border-b border-white/20';
      case 'EMERALD': return 'bg-emerald-900/50 backdrop-blur-md border-b border-emerald-700';
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
    const table = generateAttendanceCycle(selectedMonth, selectedYear, emp.id, `${emp.name} (${emp.role})`);
    setCurrentTable(table);
  };

  const handleTransfer = () => {
    if (currentTable.length === 0) return;
    setHistory([...history, ...currentTable]);
    setCurrentTable([]);
    alert('تم الترحيل بنجاح إلى السجلات السابقة');
  };

  const handleExportExcel = () => {
    if (currentTable.length === 0) return;
    const emp = employees.find(e => e.id === selectedEmployeeId);
    const data = currentTable.map(r => ({
      'اليوم': r.day,
      'التاريخ': r.date,
      'الحضور': r.checkIn,
      'الانصراف': r.checkOut
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `حضور_${emp?.name || 'موظف'}_${selectedMonth}.xlsx`);
  };

  const filteredHistory = history.filter(h => {
    const matchesName = h.employeeName.toLowerCase().includes(searchName.toLowerCase());
    const matchesDate = searchDate ? h.date === searchDate : true;
    return matchesName && matchesDate;
  });

  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
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
            <span className="text-xl font-mono font-bold">{formatDateTime(currentTime)}</span>
            <span className="text-[10px] opacity-70">{currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="flex gap-1 p-1 bg-black/10 rounded-full">
            {(['LIGHT', 'DARK', 'GLASS', 'EMERALD'] as ThemeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-2 rounded-full transition-all ${theme === t ? 'bg-white shadow-lg scale-110' : 'hover:scale-105'}`}
                title={`تبديل إلى نمط ${t}`}
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
            <button
              onClick={() => setView('HOME')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'HOME' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}
            >
              <Home size={22} />
              <span className="font-bold">الصفحة الرئيسية</span>
            </button>
            
            <div className="h-px bg-black/10 mx-4 my-2"></div>

            <button
              onClick={() => setView('ENTRY')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'ENTRY' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}
            >
              <Users size={22} />
              <span className="font-bold">حضور وانصراف</span>
            </button>
            
            <button
              onClick={() => setView('HISTORY')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${view === 'HISTORY' ? 'bg-rose-600 text-white shadow-xl translate-x-1' : 'hover:bg-black/5 opacity-80'}`}
            >
              <History size={22} />
              <span className="font-bold">السجلات السابقة</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          {view === 'HOME' ? (
            <div className="max-w-5xl mx-auto animate-in fade-in zoom-in duration-500">
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className={`${getCardClasses()} border-r-4 border-r-rose-500`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="opacity-70 text-sm">إجمالي الموظفين</p>
                      <h4 className="text-4xl font-black">{employees.length}</h4>
                    </div>
                    <Users size={40} className="text-rose-500 opacity-20" />
                  </div>
                </div>
                <div className={`${getCardClasses()} border-r-4 border-r-blue-500`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="opacity-70 text-sm">سجلات مؤرشفة</p>
                      <h4 className="text-4xl font-black">{history.length}</h4>
                    </div>
                    <History size={40} className="text-blue-500 opacity-20" />
                  </div>
                </div>
                <div className={`${getCardClasses()} border-r-4 border-r-amber-500`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="opacity-70 text-sm">حالة النظام</p>
                      <h4 className="text-2xl font-black text-emerald-500">نشط الآن</h4>
                    </div>
                    <LayoutDashboard size={40} className="text-amber-500 opacity-20" />
                  </div>
                </div>
              </div>
              
              <div className={getCardClasses()}>
                <h2 className="text-3xl font-black mb-6">مرحباً بك في Soft Rose</h2>
                <p className="text-lg opacity-80 leading-relaxed mb-8">
                  هذا النظام مصمم لإدارة عمليات الحضور والانصراف بدقة عالية. يمكنك البدء بإضافة الموظفين، توليد جداول شهرية (من يوم 21 إلى يوم 20)، وتصدير البيانات إلى ملفات إكسيل احترافية.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setView('ENTRY')} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg hover:bg-rose-700 transition-all">ابدأ التسجيل الآن</button>
                  <button onClick={() => setView('HISTORY')} className="px-8 py-4 border border-rose-600/30 rounded-2xl font-bold hover:bg-rose-600/10 transition-all">عرض السجلات</button>
                </div>
              </div>
            </div>
          ) : view === 'ENTRY' ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-left duration-500">
              {/* Controls Section */}
              <div className={getCardClasses()}>
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-lg font-bold flex items-center gap-3">
                      <UserCheck size={24} className="text-rose-500"/> اختيار الموظف
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="flex-1 p-4 bg-black/5 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none border border-transparent transition-all"
                      >
                        <option value="" className="text-black">اختر من القائمة...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id} className="text-black">{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setIsAddingEmployee(!isAddingEmployee)}
                        className="p-4 bg-rose-600 text-white rounded-2xl hover:scale-105 transition-all shadow-xl"
                      >
                        <Plus size={28} />
                      </button>
                    </div>

                    {isAddingEmployee && (
                      <div className="p-6 bg-black/5 rounded-2xl border border-white/10 animate-in slide-in-from-top duration-300 space-y-4">
                        <input 
                          type="text" 
                          placeholder="اسم الموظف الجديد" 
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          className="w-full p-3 bg-white/10 rounded-xl border border-black/10 text-inherit"
                        />
                        <select 
                          value={newEmployeeRole}
                          onChange={(e) => setNewEmployeeRole(e.target.value)}
                          className="w-full p-3 bg-white/10 rounded-xl border border-black/10 text-inherit text-black"
                        >
                          <option value="منسق">منسق</option>
                          <option value="اشر">اشر</option>
                        </select>
                        <button onClick={handleAddEmployee} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">إضافة الموظف للقائمة</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-lg font-bold flex items-center gap-3">
                      <CalendarDays size={24} className="text-rose-500"/> تحديد الفترة الزمنية
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="flex-1 p-4 bg-black/5 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-black"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>شهر {m}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleGenerateTable}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl"
                      >
                        انشيء الجدول
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              {currentTable.length > 0 && (
                <div className={`${getCardClasses()} !p-0 overflow-hidden animate-in fade-in duration-700`}>
                  <div className="p-6 border-b border-black/10 flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-black">جدول الحضور: {employees.find(e => e.id === selectedEmployeeId)?.name}</h3>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md">
                      <Download size={20} /> تصدير إكسيل
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-black/5 border-b border-black/10">
                          <th className="p-5 font-bold">اليوم</th>
                          <th className="p-5 font-bold">التاريخ</th>
                          <th className="p-5 font-bold">الحضور</th>
                          <th className="p-5 font-bold">الانصراف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable.map((row, idx) => (
                          <tr key={idx} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                            <td className="p-4 font-bold opacity-90">{row.day}</td>
                            <td className="p-4 font-mono text-sm opacity-80" dir="ltr">{row.date}</td>
                            <td className="p-2">
                              <input 
                                type="text"
                                value={row.checkIn}
                                onChange={(e) => {
                                  const updated = [...currentTable];
                                  updated[idx].checkIn = e.target.value;
                                  setCurrentTable(updated);
                                }}
                                className="w-full text-center p-3 rounded-xl bg-black/5 focus:bg-white focus:text-black outline-none transition-all"
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                type="text"
                                value={row.checkOut}
                                onChange={(e) => {
                                  const updated = [...currentTable];
                                  updated[idx].checkOut = e.target.value;
                                  setCurrentTable(updated);
                                }}
                                className="w-full text-center p-3 rounded-xl bg-black/5 focus:bg-white focus:text-black outline-none transition-all"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 bg-black/5 flex flex-wrap gap-4 justify-center md:justify-end">
                    <button onClick={() => {
                      const header = "اليوم\tالتاريخ\tالحضور\tالانصراف\n";
                      const body = currentTable.map(r => `${r.day}\t${r.date}\t${r.checkIn}\t${r.checkOut}`).join('\n');
                      copyToClipboard(header + body).then(() => alert('تم النسخ!'));
                    }} className="flex items-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg">
                      <Copy size={22} /> نسخ الجدول
                    </button>
                    <button onClick={handleTransfer} className="flex items-center gap-2 px-10 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-xl scale-105">
                      <Save size={22} /> ترحيل البيانات
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-black flex items-center gap-4">
                <History className="text-rose-600" size={40} /> السجلات السابقة
              </h2>

              <div className={getCardClasses()}>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-bold flex items-center gap-2 opacity-80"><Search size={18} /> بحث بالاسم</label>
                    <input type="text" placeholder="اكتب اسم الموظف..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500 text-inherit"/>
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold flex items-center gap-2 opacity-80"><Calendar size={18} /> بحث بالتاريخ</label>
                    <input type="text" placeholder="مثال: 21/11/2025" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="w-full p-4 bg-black/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-rose-500 text-inherit"/>
                  </div>
                </div>
              </div>

              <div className={`${getCardClasses()} !p-0 overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-black/10 border-b border-black/10">
                        <th className="p-5">الموظف</th>
                        <th className="p-5">اليوم</th>
                        <th className="p-5">التاريخ</th>
                        <th className="p-5">الحضور</th>
                        <th className="p-5">الانصراف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((h, idx) => (
                        <tr key={idx} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                          <td className="p-5 font-black text-rose-500">{h.employeeName}</td>
                          <td className="p-5 font-bold opacity-80">{h.day}</td>
                          <td className="p-5 font-mono text-sm opacity-70" dir="ltr">{h.date}</td>
                          <td className="p-5 font-bold text-emerald-500">{h.checkIn}</td>
                          <td className="p-5 font-bold text-orange-500">{h.checkOut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredHistory.length === 0 && (
                    <div className="p-20 text-center opacity-40 italic text-xl">لا توجد سجلات لعرضها حالياً</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-black/5 border-t border-black/5 p-4 text-center text-sm opacity-60">
        <p>Soft Rose v2.0 &bull; نظام متطور لإدارة الموارد البشرية &copy; 2025</p>
      </footer>
    </div>
  );
}
