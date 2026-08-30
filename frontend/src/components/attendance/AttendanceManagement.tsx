import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  RefreshCw,
  UserX,
  Save,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import type { AttendanceProfile } from '../../services/api';

export const AttendanceManagement: React.FC = () => {
  const [attendanceList, setAttendanceList] = useState<AttendanceProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<AttendanceProfile>>({});

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getAttendance();
      setAttendanceList(res.data || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleOpenForm = () => {
    setFormData({
      ClassFileCode: 'CLS-101',
      'DateOfClass/StartTime': new Date().toISOString().slice(0, 16),
      AbsenteeFileCode1: '',
      AbsenteeReason1: 'Sick Leave'
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAttendance(formData);
      setShowForm(false);
      fetchAttendance();
    } catch (err: any) {
      alert(`Failed to save attendance: ${err.message}`);
    }
  };

  const filteredList = selectedClass
    ? attendanceList.filter(a => (a.ClassFileCode || '').toLowerCase().includes(selectedClass.toLowerCase()))
    : attendanceList;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarCheck className="h-7 w-7 text-emerald-400" />
            Class Attendance Tracking
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Log class session attendance, start/end timestamps, and absentee records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by Class Code..."
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <button onClick={fetchAttendance} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleOpenForm} className="btn-primary">
            <Plus className="h-4 w-4" />
            Log Attendance
          </button>
        </div>
      </div>

      {/* Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/60 p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-400" />
                Record Class Session Attendance
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Title / Code</label>
                  <input
                    type="text"
                    required
                    value={formData.ClassFileCode || ''}
                    onChange={e => setFormData({ ...formData, ClassFileCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Schedule File Code</label>
                  <input
                    type="text"
                    value={formData.ScheduleFileCode || ''}
                    onChange={e => setFormData({ ...formData, ScheduleFileCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Date & Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData['DateOfClass/StartTime'] || ''}
                    onChange={e => setFormData({ ...formData, 'DateOfClass/StartTime': e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class End Time</label>
                  <input
                    type="datetime-local"
                    value={formData['DateOfClass/EndTime'] || ''}
                    onChange={e => setFormData({ ...formData, 'DateOfClass/EndTime': e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Absentees Section */}
              <div className="border-t border-slate-700/60 pt-4">
                <h4 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UserX className="h-4 w-4" /> Absentee Records
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Absentee #1 FileCode</label>
                    <input
                      type="text"
                      placeholder="e.g. STU-1001"
                      value={formData.AbsenteeFileCode1 || ''}
                      onChange={e => setFormData({ ...formData, AbsenteeFileCode1: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Absentee #1 Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Medical"
                      value={formData.AbsenteeReason1 || ''}
                      onChange={e => setFormData({ ...formData, AbsenteeReason1: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Grid Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Attendance Log History ({filteredList.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Class Code</th>
                <th className="px-4 py-3 font-semibold">Start Time / Date</th>
                <th className="px-4 py-3 font-semibold">End Time</th>
                <th className="px-4 py-3 font-semibold">Absentee FileCode</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.ID || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">#{item.ID}</td>
                    <td className="px-4 py-3.5 font-mono font-medium text-emerald-400">{item.ClassFileCode || item.Class || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-300 text-xs">{item['DateOfClass/StartTime'] || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-300 text-xs">{item['DateOfClass/EndTime'] || '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-rose-400">{item.AbsenteeFileCode1 || 'None'}</td>
                    <td className="px-4 py-3.5 text-slate-300 text-xs">{item.AbsenteeReason1 || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
