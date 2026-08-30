import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plus, Minus, Search, X
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
    ClassFee: 450, Total: 450, FirstPayment: 0,
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
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally { setFormSaving(false); }
  };

  const handleDelete = async () => {
    if (!formData.FileCode || !confirm(`Delete ${formData.FileCode}?`)) return;
    try { await api.deleteStudent(formData.FileCode); await fetchAllData(); }
    catch (err: any) { alert(`Delete failed: ${err.message}`); }
  };

  const upd = (key: keyof Student, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const filteredStudents = students.filter(s =>
    (s.SName||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
    (s.FileCode||'').toLowerCase().includes(tableSearch.toLowerCase()) ||
    (s.StudentASCNo||'').toLowerCase().includes(tableSearch.toLowerCase())
  );

  const attendance = buildAttendance(formData.FileCode || '');
  const totalPresent = MONTHS.reduce((sum, m) =>
    sum + Object.values(attendance[m]||{}).filter(v => v==='present').length, 0);
  const totalDays = MONTHS.reduce((sum, m) =>
    sum + Object.keys(attendance[m]||{}).length, 0);
  const attendPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  // Visible calendar months (last 3 with data)
  const calMonths = MONTHS.slice(6, 9);
  const calYear = 2021;

  // For demo/show tomorrow: always display a real local photo from public/photos
  // so the UI shows a real face even if the DB isn't connected.
  const photoSrc = '/photos/22DME04A4-03.jpg';

  const bottomTabs: { id: BottomTab; label: string }[] = [
    { id: 'class', label: 'Class' },
    { id: 'finance', label: 'Finance' },
    { id: 'health', label: 'Health And Guardian' },
    { id: 'education', label: 'Education' },
    { id: 'note', label: 'Note' },
    { id: 'transcript', label: 'Transcript' },
  ];

  const F = (props: {
    label: string; field?: keyof Student; value?: any;
    onChange?: (v: string) => void; type?: string; readOnly?: boolean;
    children?: React.ReactNode; w?: string;
  }) => (
    <div className="flex items-center gap-1">
      <label className={`text-zinc-400 flex-shrink-0 text-[11px] ${props.w || 'w-28'}`}>{props.label}:</label>
      {props.children || (
        <input
          type={props.type || 'text'}
          value={props.value ?? (props.field ? (formData[props.field] as any) ?? '' : '')}
          onChange={e => props.onChange ? props.onChange(e.target.value) : props.field && upd(props.field, e.target.value)}
          readOnly={props.readOnly}
          className={`tit-input flex-1 ${props.readOnly ? 'text-zinc-400' : ''}`}
        />
      )}
    </div>
  );

  return (
    <div className="text-xs select-none pb-8" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div className="bg-[#181818] border border-[#2e2e2e] p-3 shadow-2xl">

        {/* ── TOP ROW: LEFT PANEL | FORM | CALENDAR ── */}
        <div className="flex gap-3">

          {/* LEFT: Photo + metrics + navigator */}
          <div className="flex-shrink-0 w-40 space-y-2">
            <div className="w-full h-44 bg-[#222] border border-[#3a3a3a] overflow-hidden">
              <img src={photoSrc} alt="Student"
                className="w-full h-full object-cover object-top"
                onError={e => { (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'; }}
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
              <button onClick={handleCreateNew} className="bg-[#242424] border border-[#404040] text-zinc-200 px-2 py-1 hover:bg-[#333]"><Plus className="h-3 w-3" /></button>
              <button onClick={handleDelete} className="bg-[#242424] border border-[#404040] text-rose-400 px-2 py-1 hover:bg-[#333]"><Minus className="h-3 w-3" /></button>
              <button onClick={handleSave} className="tit-btn-orange flex-1 text-[10px] py-0.5">{formSaving ? '...' : 'Certify'}</button>
              <button className="tit-btn-orange flex-1 text-[10px] py-0.5">Transcript</button>
            </div>
          </div>

          {/* CENTER: two-column form */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <F label="File Code" field="FileCode" /><div/>
              <F label="First Name" field="SName" />
              <F label="Fathers Name" field="FathersName" />
              <F label="GrandFather" field="GrandFathersName" />
              <F label="Graduation Date" field="DateOfGraduation" />
              <F label="Registration Date" field="DateOfRegistration" />
              <F label="ID No." field="IDNo" />
              <F label="ASC No." field="StudentASCNo" />
              <F label="Phone No." field="PhoneNumber" />

              <F label="Gender" field="Gender">
                <select value={formData.Gender||'Female'} onChange={e => upd('Gender', e.target.value)} className="tit-input flex-1">
                  <option>Female</option><option>Male</option>
                </select>
              </F>
              <F label="Birth Place" field="BIrthPlace" />
              <F label="Age" field="Age" type="number" />
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

              <F label="Nationality" field="Nationality">
                <select value={formData.Nationality||'Eritrean'} onChange={e => upd('Nationality', e.target.value)} className="tit-input flex-1">
                  <option>Eritrean</option><option>Ethiopian</option><option>Other</option>
                </select>
              </F>
              <F label="Payment Status" field="PaymentCondition">
                <select value={formData.PaymentCondition||'Cash'} onChange={e => upd('PaymentCondition', e.target.value)} className="tit-input flex-1">
                  <option>Cash</option><option>Completed</option><option>Partial</option><option>Pending</option>
                </select>
              </F>
            </div>

            <div className="border-t border-[#2a2a2a] my-1" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <F label="Class Code" readOnly><select className="tit-input flex-1"><option>21ACC09A5</option></select></F>
              <F label="Schedule Code" readOnly><select className="tit-input flex-1"><option></option></select></F>
              <F label="Class" readOnly><select className="tit-input flex-1"><option>Accounting</option></select></F>
              <F label="Credit Hours" value="36" readOnly />
              <F label="Hours/Week" value="3" readOnly />
              <F label="Class/Week" value="2" readOnly />
              <F label="No Of Students" value="10" readOnly />
              <F label="Instructor Name" readOnly><select className="tit-input flex-1"><option></option></select></F>

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

              <F label="Start Date" value="9/21/2023" readOnly />
              <F label="End Date" value="12/21/2023" readOnly />
              <F label="Instructor FileCode" readOnly><select className="tit-input flex-1"><option></option></select></F>
              <F label="Guest Instructor" readOnly><select className="tit-input flex-1"><option></option></select></F>

              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Days:</label>
                <select className="tit-input flex-1"><option></option></select>
                <input readOnly value="" className="tit-input w-12 text-zinc-400 ml-1" />
              </div>
              <F label="Room" value="" readOnly />

              <div className="flex items-center gap-1">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Time:</label>
                <select className="tit-input flex-1"><option></option></select>
                <input readOnly value="" className="tit-input w-12 text-zinc-400 ml-1" />
              </div>
              <F label="Class Status" value="" readOnly />
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
              <F label="Class Code" value="21ACC09A5" readOnly />
              <F label="Course" value="Accounting" readOnly />
              <F label="Class Status" value="Active" readOnly />
              <F label="Start Date" value="9/21/2023" readOnly />
              <F label="End Date" value="12/21/2023" readOnly />
              <F label="Credit Hours" value="36" readOnly />
            </div>
          )}

          {activeBottomTab === 'finance' && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <F label="Class Fee" field="ClassFee" type="number" />
              <F label="Total" field="Total" type="number" />
              <F label="Payment Condition" field="PaymentCondition">
                <select value={formData.PaymentCondition||'Cash'} onChange={e => upd('PaymentCondition', e.target.value)} className="tit-input flex-1">
                  <option>Cash</option><option>Completed</option><option>Partial</option><option>Pending</option>
                </select>
              </F>
              <F label="1st Payment" field="FirstPayment" type="number" />
              <F label="1st Date" field="FirstPaymentDate" />
              <F label="1st Check No" field="FirstPaymentCheckNo" />
              <F label="2nd Payment" field="SecondPayment" type="number" />
              <F label="2nd Date" field="SecondPaymentDate" />
              <F label="3rd Payment" field="ThirdPayment" type="number" />
              <F label="3rd Date" field="ThirdPaymentDate" />
              <F label="3rd Check No" field="ThirdPaymentCheckNo" />
              <F label="Completion" field="PaymentCompletion" />
            </div>
          )}

          {activeBottomTab === 'health' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <F label="Guardian Full Name" field="GuardiansFullName" w="w-36" />
              <F label="Relation" field="Relation" w="w-36" />
              <F label="Guardian Phone" field="GuardianPhoneNumber" w="w-36" />
              <F label="Occupation" field="Occupation" w="w-36" />
              <F label="Address" field="Address" w="w-36" />
              <div className="flex items-start gap-1 col-span-2">
                <label className="text-zinc-400 w-36 flex-shrink-0 text-[11px] mt-1">Health Background:</label>
                <textarea rows={2} value={formData.StudentsHeathBackground||''} onChange={e => upd('StudentsHeathBackground', e.target.value)} className="tit-input flex-1 resize-none" />
              </div>
            </div>
          )}

          {activeBottomTab === 'education' && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              <F label="Education Level" field="EducationLevel" />
              <F label="Previous School" field="PreviousORCurrentschool" w="w-32" />
              <div />
              <F label="Assignment" field="Assignment" type="number" />
              <F label="Class Activity" field="ClassActivitynAttendance" type="number" />
              <F label="Final Exam" field="FinalExam" type="number" />
              <F label="Overall" field="Overall" type="number" />
              <div className="flex items-center gap-2">
                <label className="text-zinc-400 w-28 flex-shrink-0 text-[11px]">Completed:</label>
                {['Yes','No'].map(v => (
                  <label key={v} className="flex items-center gap-1 text-zinc-200 cursor-pointer text-[11px]">
                    <input type="checkbox" className="accent-blue-500" checked={formData.Completed===v} onChange={() => upd('Completed', v)} />{v}
                  </label>
                ))}
              </div>
              <F label="Graduation Date" field="DateOfGraduation" />
            </div>
          )}

          {activeBottomTab === 'note' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <F label="Manual File Code" field="ManualFileCode" w="w-36" />
              <F label="Manual Condition" field="ManualCondition" w="w-36" />
              <F label="Reception Date" field="ManualReceptionDate" w="w-36" />
              <F label="Return Date" field="ManualReturnDate" w="w-36" />
              <F label="Batch Reception" field="BatchrReceptionDate" w="w-36" />
              <F label="Batch Return" field="BatchReturnDate" w="w-36" />
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
    </div>
  );
};
