import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plus, Minus, Search, X, Award, Printer, Save, Link as LinkIcon
} from 'lucide-react';
import { api } from '../../services/api';
import type { Student } from '../../services/api';

type BottomTab = 'class' | 'finance' | 'health' | 'education' | 'note' | 'transcript';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const ATTEND_COLOR: Record<string, string> = {
  present:    'bg-emerald-600 text-white',
  absent:     'bg-rose-600 text-white',
  permission: 'bg-orange-500 text-white',
  late:       'bg-blue-500 text-white',
};

// Convert Google Drive share link or standard photo URL into direct image URL
export function getDirectImageUrl(url: string | undefined | null): string {
  if (!url || !url.trim()) return '/photos/22DME04A4-03.jpg';
  const trimmed = url.trim();

  let fileId = '';
  const match1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) {
    fileId = match1[1];
  } else {
    const match2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      fileId = match2[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

// Deterministic demo attendance based on fileCode
function buildAttendance(fileCode: string) {
  const seed = fileCode
    ? fileCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    : 42;
  const statuses = ['present','present','present','present','absent','permission','late'];
  const data: Record<string, Record<number,string>> = {};
  const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
  MONTHS.forEach((m, mi) => {
    data[m] = {};
    for (let d = 1; d <= daysInMonth[mi]; d++) {
      data[m][d] = statuses[(seed + mi * 7 + d * 3) % statuses.length];
    }
  });
  return data;
}




export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('class');
  const [showStudentListModal, setShowStudentListModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [formSaving, setFormSaving] = useState<boolean>(false);

  const fetchAllData = async () => {
    try {
      const stRes = await api.getStudents();
      const stList = stRes.data || [];
      setStudents(stList);
      if (stList.length > 0) { setFormData(stList[0]); setSelectedIndex(0); }
    } catch (err) { console.error('Failed to load students:', err); }
  };

  useEffect(() => { fetchAllData(); }, []);

  const handleSelectStudent = (index: number) => {
    if (index >= 0 && index < students.length) {
      setSelectedIndex(index);
      setFormData({ ...students[index] });
    }
  };

  const handleNavigate = (action: 'first'|'prev'|'next'|'last') => {
    if (!students.length) return;
    const map = { first: 0, prev: Math.max(0, selectedIndex - 1),
      next: Math.min(students.length - 1, selectedIndex + 1), last: students.length - 1 };
    handleSelectStudent(map[action]);
  };

  const handleCreateNew = () => setFormData({
    FileCode: `STU-${Date.now().toString().slice(-4)}`,
    SName: '', FathersName: '', GrandFathersName: '',
    Gender: 'Female', Age: 20, Nationality: 'Eritrean',
    DateOfRegistration: new Date().toISOString().split('T')[0],
    Completed: 'No', PaymentCondition: 'Cash',
    ClassFee: 450, Total: 450, FirstPayment: 0, SPhoto: ''
  });

  const handleSave = async () => {
    if (!formData.FileCode || !formData.SName) { alert('File Code and First Name are required.'); return; }
    setFormSaving(true);
    try {
      if (students.some(s => s.FileCode === formData.FileCode)) {
        await api.updateStudent(formData.FileCode, formData);
      } else {
        await api.createStudent(formData);
      }
      await fetchAllData();
      alert('Student record saved successfully to Supabase/Database!');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally { setFormSaving(false); }
  };

  const handleCertify = async () => {
    if (!formData.FileCode || !formData.SName) {
      alert('Please select or fill in student details (File Code and First Name required).');
      return;
    }
    setFormSaving(true);
    try {
      if (students.some(s => s.FileCode === formData.FileCode)) {
        await api.updateStudent(formData.FileCode, formData);
      } else {
        await api.createStudent(formData);
      }
      await fetchAllData();
    } catch (err: any) {
      console.warn('Auto-save before certifying:', err.message);
    } finally {
      setFormSaving(false);
    }
    setShowCertificateModal(true);
  };

  const handleDelete = async () => {
    if (!formData.FileCode || !confirm(`Delete ${formData.FileCode}?`)) return;
    try { await api.deleteStudent(formData.FileCode); await fetchAllData(); }
    catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };

  const upd = useCallback((key: keyof Student, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      (s.SName||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (s.FileCode||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (s.StudentASCNo||'').toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [students, tableSearch]);

  const attendance = useMemo(() => buildAttendance(formData.FileCode || ''), [formData.FileCode]);
  const totalPresent = useMemo(() => MONTHS.reduce((sum, m) =>
    sum + Object.values(attendance[m]||{}).filter(v => v==='present').length, 0), [attendance]);
  const totalDays = useMemo(() => MONTHS.reduce((sum, m) =>
    sum + Object.keys(attendance[m]||{}).length, 0), [attendance]);
  const attendPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  // Visible calendar months (last 3 with data)
  const calMonths = MONTHS.slice(6, 9);
  const calYear = 2021;

  const bottomTabs: { id: BottomTab; label: string }[] = [
    { id: 'class', label: 'Class' },
    { id: 'finance', label: 'Finance' },
    { id: 'health', label: 'Health And Guardian' },
    { id: 'education', label: 'Education' },
    { id: 'note', label: 'Note' },
    { id: 'transcript', label: 'Transcript' },
  ];

  const renderF = (
    label: string,
    field?: keyof Student,
    options?: { value?: any; type?: string; readOnly?: boolean; w?: string; children?: React.ReactNode; onChange?: (v: string) => void }
  ) => {
    const displayVal = options?.value ?? (field ? (formData[field] as any) ?? '' : '');
    return (
      <div className="flex items-center gap-1" key={field || label}>
        <label className={`text-zinc-400 flex-shrink-0 text-[11px] ${options?.w || 'w-28'}`}>{label}:</label>
        {options?.children || (
          <input
            type={options?.type || 'text'}
            value={displayVal}
            onChange={e => {
              if (options?.onChange) options.onChange(e.target.value);
              else if (field) upd(field, e.target.value);
            }}
            readOnly={options?.readOnly}
            className={`tit-input flex-1 ${options?.readOnly ? 'text-zinc-400' : ''}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="text-xs select-none pb-8" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div className="bg-[#181818] border border-[#2e2e2e] p-3 shadow-2xl">

        {/* ── TOP ROW: LEFT PANEL | FORM | CALENDAR ── */}
        <div className="flex gap-3">

          {/* LEFT: Photo + G-Drive Link + metrics + navigator */}
          <div className="flex-shrink-0 w-44 space-y-2">
            {/* Photobox */}
            <div className="w-full h-40 bg-[#222] border border-[#3a3a3a] overflow-hidden relative group rounded-sm">
              <img
                src={getDirectImageUrl(formData.SPhoto)}
                alt="Student Photo"
                className="w-full h-full object-cover object-top"
                onError={e => {
                  const fileIdMatch = (formData.SPhoto || '').match(/(?:file\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
                  if (fileIdMatch && fileIdMatch[1]) {
                    (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
                  } else {
                    (e.target as HTMLImageElement).src = '/photos/22DME04A4-03.jpg';
                  }
                }}
              />
            </div>

            {/* Google Drive / Photo Link Textbox */}
            <div className="space-y-0.5 bg-[#141414] p-1.5 border border-[#2e2e2e] rounded-sm">
              <label className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> G-Drive / Photo Link:
              </label>
              <input
                type="text"
                placeholder="Paste Google Drive link..."
                value={formData.SPhoto || ''}
                onChange={e => upd('SPhoto', e.target.value)}
                className="tit-input text-[10px] w-full bg-[#0d0d0d] border-amber-600/50 focus:border-amber-400 text-amber-200 py-0.5 px-1 font-mono"
                title="Paste a Google Drive view link or direct image URL to update photobox"
              />
            </div>

            {[
              { label: 'Attendance', val: attendPct, max: 100 },
              { label: 'Company Profile', val: 86, max: 100 },
              { label: 'Class Performance', val: 10, max: 100 },
              { label: 'Conduct', val: 10, max: 100 },
              { label: 'Commulative', val: 140, max: 200 },
            ].map(m => (
              <div key={m.label} className="space-y-0.5">
                <span className="text-[10px] text-zinc-300">{m.label}</span>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 bg-[#262626] border border-[#404040] overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(m.val/m.max)*100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-200 w-6 text-right">{m.val}</span>
                </div>
              </div>
            ))}

            <div className="flex gap-1 pt-1">
              <button className="tit-btn-orange flex-1 text-[10px] py-0.5">Badge</button>
              <button className="tit-btn-orange flex-1 text-[10px] py-0.5" onClick={() => setShowStudentListModal(true)}>St.Li</button>
            </div>

            {/* VCR navigator */}
            <div className="bg-[#141414] border border-[#333] flex items-center justify-between px-1 py-1">
              <button onClick={() => handleNavigate('first')} disabled={!selectedIndex} className="p-0.5 text-zinc-300 disabled:opacity-30"><ChevronsLeft className="h-3 w-3" /></button>
              <button onClick={() => handleNavigate('prev')} disabled={!selectedIndex} className="p-0.5 text-zinc-300 disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
              <span className="font-mono text-[10px] text-zinc-100 font-bold">
                {students.length ? `${selectedIndex+1}/${students.length}` : '0/0'}
              </span>
              <button onClick={() => handleNavigate('next')} disabled={selectedIndex >= students.length-1} className="p-0.5 text-zinc-300 disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
              <button onClick={() => handleNavigate('last')} disabled={selectedIndex >= students.length-1} className="p-0.5 text-zinc-300 disabled:opacity-30"><ChevronsRight className="h-3 w-3" /></button>
            </div>

            <div className="flex gap-1">
              <button onClick={handleCreateNew} title="Create New Student" className="bg-[#242424] border border-[#404040] text-zinc-200 px-2 py-1 hover:bg-[#333]"><Plus className="h-3 w-3" /></button>
              <button onClick={handleDelete} title="Delete Selected Student" className="bg-[#242424] border border-[#404040] text-rose-400 px-2 py-1 hover:bg-[#333]"><Minus className="h-3 w-3" /></button>
              <button onClick={handleSave} disabled={formSaving} title="Save to Database" className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex-1 text-[10px] py-0.5 flex items-center justify-center gap-0.5">
                <Save className="h-3 w-3" /> {formSaving ? '...' : 'Save'}
              </button>
              <button onClick={handleCertify} disabled={formSaving} title="Generate Certificate" className="tit-btn-orange flex-1 text-[10px] py-0.5 flex items-center justify-center gap-0.5 font-bold">
                <Award className="h-3 w-3" /> Certify
              </button>
            </div>
          </div>


          {/* CENTER: two-column form */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {renderF("File Code", "FileCode")}<div/>
              {renderF("First Name", "SName")}
              {renderF("Fathers Name", "FathersName")}
              {renderF("GrandFather", "GrandFathersName")}
              {renderF("Graduation Date", "DateOfGraduation")}
              {renderF("Registration Date", "DateOfRegistration")}
              {renderF("ID No.", "IDNo")}
              {renderF("ASC No.", "StudentASCNo")}
              {renderF("Phone No.", "PhoneNumber")}

              {renderF("Gender", "Gender", { children: (
                <select value={formData.Gender||'Female'} onChange={e => upd('Gender', e.target.value)} className="tit-input flex-1">
                  <option>Female</option><option>Male</option>
                </select>
              )})}
              {renderF("Birth Place", "BIrthPlace")}
              {renderF("Age", "Age", { type: "number" })}
              <div className="flex items-center gap-2">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Completed:</label>
                {['Yes','No'].map(v => (
                  <label key={v} className="flex items-center gap-1 text-zinc-200 cursor-pointer text-[11px]">
                    <input type="checkbox" className="accent-blue-500"
                      checked={formData.Completed === v}
                      onChange={() => upd('Completed', v)} />
                    {v}
                  </label>
                ))}
              </div>

              {renderF("Nationality", "Nationality", { children: (
                <select value={formData.Nationality||'Eritrean'} onChange={e => upd('Nationality', e.target.value)} className="tit-input flex-1">
                  <option>Eritrean</option><option>Ethiopian</option><option>Other</option>
                </select>
              )})}
              {renderF("Payment Status", "PaymentCondition", { children: (
                <select value={formData.PaymentCondition||'Cash'} onChange={e => upd('PaymentCondition', e.target.value)} className="tit-input flex-1">
                  <option>Cash</option><option>Completed</option><option>Partial</option><option>Pending</option>
                </select>
              )})}
            </div>

            <div className="border-t border-[#2a2a2a] my-1" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {renderF("Class Code", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option>21ACC09A5</option></select> })}
              {renderF("Schedule Code", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option></option></select> })}
              {renderF("Class", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option>Accounting</option></select> })}
              {renderF("Credit Hours", undefined, { value: "36", readOnly: true })}
              {renderF("Hours/Week", undefined, { value: "3", readOnly: true })}
              {renderF("Class/Week", undefined, { value: "2", readOnly: true })}
              {renderF("No Of Students", undefined, { value: "10", readOnly: true })}
              {renderF("Instructor Name", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option></option></select> })}

              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Male:</label>
                <div className="flex items-center gap-1 flex-1">
                  <input readOnly value="" className="tit-input w-10 text-zinc-400" />
                  <div className="flex-1 h-2 bg-[#262626] border border-[#404040]"><div className="h-full bg-emerald-500 w-1/2" /></div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Female:</label>
                <div className="flex items-center gap-1 flex-1">
                  <input readOnly value="" className="tit-input w-10 text-zinc-400" />
                  <div className="flex-1 h-2 bg-[#262626] border border-[#404040]"><div className="h-full bg-emerald-500 w-1/2" /></div>
                </div>
              </div>

              {renderF("Start Date", undefined, { value: "9/21/2023", readOnly: true })}
              {renderF("End Date", undefined, { value: "12/21/2023", readOnly: true })}
              {renderF("Instructor FileCode", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option></option></select> })}
              {renderF("Guest Instructor", undefined, { readOnly: true, children: <select className="tit-input flex-1"><option></option></select> })}

              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Days:</label>
                <select className="tit-input flex-1"><option></option></select>
                <input readOnly value="" className="tit-input w-12 text-zinc-400 ml-1" />
              </div>
              {renderF("Room", undefined, { value: "", readOnly: true })}

              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Time:</label>
                <select className="tit-input flex-1"><option></option></select>
                <input readOnly value="" className="tit-input w-12 text-zinc-400 ml-1" />
              </div>
              {renderF("Class Status", undefined, { value: "", readOnly: true })}
            </div>
          </div>

          {/* RIGHT: Attendance calendar */}
          <div className="flex-shrink-0 w-28 overflow-y-auto max-h-[540px] space-y-2">
            <div className="text-center text-zinc-200 font-bold text-[11px] border-b border-[#333] pb-1">{calYear}</div>
            {calMonths.map(month => (
              <div key={month}>
                <div className="text-center text-[10px] font-bold text-zinc-200 bg-[#222] py-0.5 mb-0.5">{month}</div>
                <div className="grid grid-cols-3 gap-px">
                  {Object.entries(attendance[month] || {}).map(([day, status]) => (
                    <div key={day} title={`${month} ${day}: ${status}`}
                      className={`text-center text-[9px] font-bold py-0.5 cursor-default ${ATTEND_COLOR[status] || 'bg-[#333] text-zinc-400'}`}>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="border-t border-[#333] pt-1 text-center">
              <div className="text-[9px] text-zinc-400">Total</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{totalPresent}</div>
            </div>
            <div className="space-y-1 border-t border-[#333] pt-1">
              {[['bg-emerald-600','Present'],['bg-rose-600','Absent'],['bg-orange-500','Permission'],['bg-blue-500','Late']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1 text-[9px] text-zinc-300">
                  <span className={`w-2.5 h-2.5 ${color} flex-shrink-0`} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM TABS BAR ── */}
        <div className="mt-3 pt-2 border-t border-[#2a2a2a] flex flex-wrap items-start gap-5">
          {bottomTabs.map(tab => {
            const isActive = activeBottomTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveBottomTab(tab.id)}
                className="flex flex-col items-center gap-0.5 cursor-pointer group">
                <span className={`text-[11px] font-medium ${isActive ? 'text-white font-semibold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {tab.label}
                </span>
                <div className="w-20 h-1.5 bg-[#242424] border border-[#404040] overflow-hidden">
                  <div className={`h-full transition-all ${isActive ? 'bg-blue-500 w-full' : 'bg-emerald-500 w-2/5'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ── BOTTOM CONTENT PANEL ── */}
        <div className="mt-2 bg-[#141414] border border-[#2a2a2a] p-3 min-h-[110px]">

          {activeBottomTab === 'class' && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              {renderF("Class Code", undefined, { value: "21ACC09A5", readOnly: true })}
              {renderF("Course", undefined, { value: "Accounting", readOnly: true })}
              {renderF("Class Status", undefined, { value: "Active", readOnly: true })}
              {renderF("Start Date", undefined, { value: "9/21/2023", readOnly: true })}
              {renderF("End Date", undefined, { value: "12/21/2023", readOnly: true })}
              {renderF("Credit Hours", undefined, { value: "36", readOnly: true })}
            </div>
          )}

          {activeBottomTab === 'finance' && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              {renderF("Class Fee", "ClassFee", { type: "number" })}
              {renderF("Total", "Total", { type: "number" })}
              {renderF("Payment Condition", "PaymentCondition", { children: (
                <select value={formData.PaymentCondition||'Cash'} onChange={e => upd('PaymentCondition', e.target.value)} className="tit-input flex-1">
                  <option>Cash</option><option>Completed</option><option>Partial</option><option>Pending</option>
                </select>
              )})}
              {renderF("1st Payment", "FirstPayment", { type: "number" })}
              {renderF("1st Date", "FirstPaymentDate")}
              {renderF("1st Check No", "FirstPaymentCheckNo")}
              {renderF("2nd Payment", "SecondPayment", { type: "number" })}
              {renderF("2nd Date", "SecondPaymentDate")}
              {renderF("3rd Payment", "ThirdPayment", { type: "number" })}
              {renderF("3rd Date", "ThirdPaymentDate")}
              {renderF("3rd Check No", "ThirdPaymentCheckNo")}
              {renderF("Completion", "PaymentCompletion")}
            </div>
          )}

          {activeBottomTab === 'health' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {renderF("Guardian Full Name", "GuardiansFullName", { w: "w-36" })}
              {renderF("Relation", "Relation", { w: "w-36" })}
              {renderF("Guardian Phone", "GuardianPhoneNumber", { w: "w-36" })}
              {renderF("Occupation", "Occupation", { w: "w-36" })}
              {renderF("Address", "Address", { w: "w-36" })}
              <div className="flex items-start gap-1 col-span-2">
                <label className="text-zinc-400 w-36 flex-shrink-0 text-[11px] mt-1">Health Background:</label>
                <textarea rows={2} value={formData.StudentsHeathBackground||''} onChange={e => upd('StudentsHeathBackground', e.target.value)} className="tit-input flex-1 resize-none" />
              </div>
            </div>
          )}

          {activeBottomTab === 'education' && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              {renderF("Education Level", "EducationLevel")}
              {renderF("Previous School", "PreviousORCurrentschool", { w: "w-32" })}
              <div />
              {renderF("Assignment", "Assignment", { type: "number" })}
              {renderF("Class Activity", "ClassActivitynAttendance", { type: "number" })}
              {renderF("Final Exam", "FinalExam", { type: "number" })}
              {renderF("Overall", "Overall", { type: "number" })}
              <div className="flex items-center gap-2">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Completed:</label>
                {['Yes','No'].map(v => (
                  <label key={v} className="flex items-center gap-1 text-zinc-200 cursor-pointer text-[11px]">
                    <input type="checkbox" className="accent-blue-500" checked={formData.Completed===v} onChange={() => upd('Completed', v)} />{v}
                  </label>
                ))}
              </div>
              {renderF("Graduation Date", "DateOfGraduation")}
            </div>
          )}

          {activeBottomTab === 'note' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {renderF("Manual File Code", "ManualFileCode", { w: "w-36" })}
              {renderF("Manual Condition", "ManualCondition", { w: "w-36" })}
              {renderF("Reception Date", "ManualReceptionDate", { w: "w-36" })}
              {renderF("Return Date", "ManualReturnDate", { w: "w-36" })}
              {renderF("Batch Reception", "BatchrReceptionDate", { w: "w-36" })}
              {renderF("Batch Return", "BatchReturnDate", { w: "w-36" })}
              <div className="flex items-start gap-1 col-span-2">
                <label className="text-zinc-400 w-36 flex-shrink-0 text-[11px] mt-1">Manual Remark:</label>
                <textarea rows={2} value={formData.ManualRemark||''} onChange={e => upd('ManualRemark', e.target.value)} className="tit-input flex-1 resize-none" />
              </div>
              <div className="flex items-start gap-1 col-span-2">
                <label className="text-zinc-400 w-36 flex-shrink-0 text-[11px] mt-1">General Remark:</label>
                <textarea rows={2} value={formData.Remark||''} onChange={e => upd('Remark', e.target.value)} className="tit-input flex-1 resize-none" />
              </div>
            </div>
          )}

          {activeBottomTab === 'transcript' && (
            <div className="space-y-2">
              <p className="text-zinc-400 text-[10px] mb-2">Academic Transcript & Grade Records</p>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
                <div className="flex flex-col gap-0.5">
                  <label className="text-zinc-500 text-[10px]">Assignment</label>
                  <input type="number" value={(formData.Assignment as any)??''} onChange={e=>upd('Assignment',e.target.value)} className="tit-input text-center font-mono text-blue-300 font-bold" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-zinc-500 text-[10px]">Class Activity</label>
                  <input type="number" value={(formData.ClassActivitynAttendance as any)??''} onChange={e=>upd('ClassActivitynAttendance',e.target.value)} className="tit-input text-center font-mono text-blue-300 font-bold" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-zinc-500 text-[10px]">Final Exam</label>
                  <input type="number" value={(formData.FinalExam as any)??''} onChange={e=>upd('FinalExam',e.target.value)} className="tit-input text-center font-mono text-blue-300 font-bold" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-zinc-500 text-[10px]">Overall</label>
                  <input type="number" value={(formData.Overall as any)??''} onChange={e=>upd('Overall',e.target.value)} className="tit-input text-center font-mono text-emerald-400 font-bold text-base" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* STUDENT LIST MODAL */}
      {showStudentListModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#3a3a3a] w-full max-w-5xl shadow-2xl">
            <div className="bg-[#222] border-b border-[#333] p-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white">Student Master List ({students.length} Records)</h3>
              <button onClick={() => setShowStudentListModal(false)} className="text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-3 space-y-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-zinc-400" />
                <input type="text" placeholder="Search..." value={tableSearch} onChange={e=>setTableSearch(e.target.value)} className="w-full bg-[#242424] border border-[#404040] pl-8 pr-3 py-1 text-xs text-white focus:outline-none" />
              </div>
              <div className="overflow-auto max-h-[50vh]">
                <table className="w-full text-left text-[11px] text-zinc-300">
                  <thead className="bg-[#242424] text-zinc-400 text-[10px] border-b border-[#3f3f46]">
                    <tr>
                      {['File Code','Full Name','ASC No','Gender','Phone','Nationality','Payment',''].map(h => (
                        <th key={h} className="p-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {filteredStudents.map((st, idx) => (
                      <tr key={st.FileCode||idx}
                        onClick={() => { const ri = students.findIndex(s=>s.FileCode===st.FileCode); if(ri!==-1) handleSelectStudent(ri); setShowStudentListModal(false); }}
                        className="hover:bg-[#252525] cursor-pointer">
                        <td className="p-2 font-mono text-blue-400 font-bold">{st.FileCode}</td>
                        <td className="p-2 text-white">{st.SName} {st.FathersName}</td>
                        <td className="p-2 font-mono text-zinc-400">{st.StudentASCNo||'-'}</td>
                        <td className="p-2">{st.Gender}</td>
                        <td className="p-2">{st.PhoneNumber||'-'}</td>
                        <td className="p-2">{st.Nationality||'-'}</td>
                        <td className="p-2">
                          <span className="bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 border border-emerald-800 text-[10px]">{st.PaymentCondition||'Cash'}</span>
                        </td>
                        <td className="p-2"><button className="tit-btn-orange py-0.5 px-2 text-[10px]">Select</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:static">
          {/* Controls Bar */}
          <div className="w-[1100px] max-w-full flex items-center justify-between bg-[#1f1f1f] border border-[#3a3a3a] px-4 py-2.5 rounded-t-lg shadow-xl print:hidden">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span className="text-white font-bold text-sm">Certificate Preview & Issue</span>
              <span className="text-xs text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 border border-amber-700/50 rounded">
                {formData.FileCode || 'STUDENT'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded flex items-center gap-1 border border-zinc-600 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          </div>

          {/* Certificate Container matching brhan cna certificate.html */}
          <div
            className="w-[1100px] h-[800px] bg-gradient-to-br from-white to-[#f4f4f5] relative shadow-2xl overflow-hidden print:w-[1100px] print:h-[800px] print:shadow-none text-zinc-900 border border-amber-500/30 select-text"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* SVG Stethoscope Edges */}
            <svg viewBox="0 0 1045 800" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
              <defs>
                <linearGradient id="gold-orange-grad" x1="0%" y1="0%" x2="150%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="40%" stopColor="#FBF5B7" />
                  <stop offset="60%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>

                <linearGradient id="metal-grad" x1="0%" y1="0%" x2="150%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc"/>
                  <stop offset="50%" stopColor="#94a3b8"/>
                  <stop offset="100%" stopColor="#e2e8f0"/>
                </linearGradient>

                <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.12" />
                </filter>
              </defs>

              <path d="M 1020 160 L 1020 740 A 30 30 0 0 1 990 770 L 40 770 A 30 30 0 0 1 10 740 L 10 40 A 30 30 0 0 1 40 10 L 890 10 A 30 30 0 0 1 920 40 L 920 100" fill="none" stroke="url(#gold-orange-grad)" strokeWidth="11" filter="url(#shadow)" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="1010,160 1030,160 1020,140" fill="url(#metal-grad)" filter="url(#shadow)"/>
              <path d="M 1020 145 C 990 110, 990 80, 990 40" fill="none" stroke="url(#metal-grad)" strokeWidth="6" filter="url(#shadow)" strokeLinecap="round"/>
              <path d="M 1020 145 C 1050 110, 1050 80, 1050 40" fill="none" stroke="url(#metal-grad)" strokeWidth="6" filter="url(#shadow)" strokeLinecap="round"/>
              <ellipse cx="990" cy="35" rx="5" ry="9" fill="#27272a" transform="rotate(-15 990 35)"/>
              <ellipse cx="1050" cy="35" rx="5" ry="9" fill="#27272a" transform="rotate(15 1050 35)"/>
              <circle cx="920" cy="120" r="30" fill="#ffffff" stroke="url(#gold-orange-grad)" strokeWidth="7" filter="url(#shadow)"/>
              <circle cx="920" cy="120" r="16" fill="url(#metal-grad)"/>
              <circle cx="920" cy="120" r="5" fill="#27272a"/>
            </svg>

            {/* Left Sidebar Logo */}
            <div style={{ position: 'absolute', left: '45px', top: '8%', height: '68%', width: '315px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 10 }}>
              <img src="/brhan logo.png" alt="Brhan Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 15px 25px rgba(249, 115, 22, 0.2))', opacity: 0.95 }} />
            </div>

            {/* Contact Info */}
            <div style={{ position: 'absolute', left: '45px', top: '72%', width: '315px', textAlign: 'center', color: '#52525b', fontSize: '10.5px', lineHeight: 1.55, margin: 0, zIndex: 15 }}>
              <strong style={{ color: '#B8862B', fontSize: '11px', letterSpacing: '2.5px', display: 'block', marginBottom: '4px' }}>LOCATION</strong>
              Kansanga opposite<br />Eco Mart next to Jolly Court<br />Kampala, Uganda
              
              <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #C89B2C, transparent)', margin: '15px 0' }}></div>
              
              <strong style={{ color: '#B8862B', fontSize: '11px', letterSpacing: '2.5px', display: 'block', marginBottom: '4px' }}>CONTACT</strong>
              +256 708 520 186 <br /> https://www.brhan.academy <br /> brhanacademykampala@gmail.com
            </div>

            {/* Content Layer */}
            <div style={{ position: 'absolute', right: '50px', top: '50px', bottom: '50px', width: '650px', padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 10 }}>

              {/* Photo Box Placeholder / Real Photo */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', width: '100px', height: '125px', border: '2px dashed #C89B2C', backgroundColor: '#fcfcfd', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.03)', zIndex: 15, overflow: 'hidden' }}>
                {formData.SPhoto ? (
                  <img
                    src={getDirectImageUrl(formData.SPhoto)}
                    alt="Student Photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/photos/22DME04A4-03.jpg';
                    }}
                  />
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C89B2C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#71717a', letterSpacing: '2px', marginTop: '8px', textTransform: 'uppercase' }}>Photo</span>
                  </>
                )}
              </div>

              <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#18181b', letterSpacing: '6px', marginTop: '10px', marginBottom: '-5px' }}>
                CERTIFICATE
              </h1>
              <h2 style={{ fontSize: '22px', fontWeight: 300, color: '#52525b', letterSpacing: '10px', marginBottom: '40px' }}>
                OF COMPLETION
              </h2>

              <div style={{ fontSize: '14px', fontWeight: 500, color: '#3f3f46', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '25px' }}>
                This certificate is proudly presented to
              </div>

              {/* Student Name */}
              <div style={{ width: '100%', borderBottom: '1px solid #C89B2C', paddingBottom: '10px', marginBottom: '30px' }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '44px',
                  lineHeight: 1.2,
                  background: 'linear-gradient(to right, #8A5A12 0%, #B8862B 35%, #D4AF37 70%, #F0C75E 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  padding: '0 10px'
                }}>
                  {[formData.SName, formData.FathersName, formData.GrandFathersName].filter(Boolean).join(' ') || 'Student Name'}
                </h3>
              </div>

              <p style={{ fontSize: '14px', fontWeight: 400, color: '#52525b', lineHeight: 1.9, maxWidth: '550px', marginBottom: '25px' }}>
                has successfully completed a rigorous six-month training programme, demonstrating exceptional practical skills, medical knowledge, and unwavering dedication to the field of healthcare.
              </p>

              <div style={{ fontSize: '11px', fontWeight: 500, color: '#3f3f46', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '5px' }}>
                Awarded Title
              </div>
              <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#18181b', letterSpacing: '2px', marginBottom: 'auto' }}>
                {formData.CourseTakenInTIT || formData.Department || 'CERTIFIED NURSING ASSISTANT'}
              </h4>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '40px', marginBottom: '20px' }}>
                
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: '#18181b', height: '35px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5px' }}>
                    {formData.DateOfGraduation || formData.DateOfRegistration || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ borderBottom: '1px solid #18181b', marginBottom: '8px' }}></div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    DATE OF COMPLETION
                  </div>
                </div>

                {/* Central Authentic Gold Seal */}
                <div style={{ width: '110px', height: '110px', background: 'linear-gradient(135deg, #FFDF73, #D4AF37, #996B1C, #D4AF37, #FFDF73)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(212, 175, 55, 0.4)', position: 'relative', transform: 'translateY(15px)' }}>
                  <div style={{ width: '94px', height: '94px', border: '1px solid #fff', borderRadius: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#18181b' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#D4AF37', letterSpacing: '1px', marginBottom: '2px' }}>2026</div>
                    <div style={{ fontSize: '10px', fontWeight: 500, color: '#fff', letterSpacing: '3px' }}>AWARD</div>
                    <div style={{ color: '#D4AF37', fontSize: '12px', letterSpacing: '2px', marginTop: '4px' }}>★★★</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: '#18181b', height: '35px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5px' }}></div>
                  <div style={{ borderBottom: '1px solid #18181b', marginBottom: '8px' }}></div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    DEAN OF NURSING SCHOOL
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

