import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Save,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import type { ClassProfile, ScheduleProfile } from '../../services/api';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassProfile[]>([]);
  const [schedules, setSchedules] = useState<ScheduleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassProfile | null>(null);
  const [formData, setFormData] = useState<Partial<ClassProfile>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, schedRes] = await Promise.all([
        api.getClasses(),
        api.getSchedules()
      ]);
      setClasses(classRes.data || []);
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error('Failed to load classes/schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (cls?: ClassProfile) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ ...cls });
    } else {
      setEditingClass(null);
      setFormData({
        ClassCode: `CLS-${Math.floor(100 + Math.random() * 900)}`,
        Class: 'Computer Science',
        CreditHours: 3,
        HoursPerWeek: 6,
        NoOfStudents: 30
      });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass && editingClass.ClassCode) {
        await api.updateClass(editingClass.ClassCode, formData);
      } else {
        await api.createClass(formData);
      }
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (code?: string) => {
    if (!code) return;
    if (confirm(`Delete class ${code}?`)) {
      try {
        await api.deleteClass(code);
        fetchData();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-teal-400" />
            Class & Schedule Profiles
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage academic course offerings, instructors, schedules, and capacity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            <Plus className="h-4 w-4" />
            New Class
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-400" />
                {editingClass ? `Edit Class: ${editingClass.ClassCode}` : 'Create New Class'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.ClassCode || ''}
                    onChange={e => setFormData({ ...formData, ClassCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Class Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.Class || ''}
                    onChange={e => setFormData({ ...formData, Class: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={formData.InstructorName || ''}
                    onChange={e => setFormData({ ...formData, InstructorName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Schedule File Code</label>
                  <input
                    type="text"
                    value={formData.ScheduleFileCode || ''}
                    onChange={e => setFormData({ ...formData, ScheduleFileCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Credit Hours</label>
                  <input
                    type="number"
                    value={formData.CreditHours || ''}
                    onChange={e => setFormData({ ...formData, CreditHours: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Capacity (No. Students)</label>
                  <input
                    type="number"
                    value={formData.NoOfStudents || ''}
                    onChange={e => setFormData({ ...formData, NoOfStudents: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.StartDate || ''}
                    onChange={e => setFormData({ ...formData, StartDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.EndDate || ''}
                    onChange={e => setFormData({ ...formData, EndDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" />
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Profiles Grid Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">
            Active Course Offerings ({classes.length}) &bull; Linked Schedules ({schedules.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Class Code</th>
                <th className="px-4 py-3 font-semibold">Course Title</th>
                <th className="px-4 py-3 font-semibold">Instructor</th>
                <th className="px-4 py-3 font-semibold">Credit Hours</th>
                <th className="px-4 py-3 font-semibold">Students</th>
                <th className="px-4 py-3 font-semibold">Schedule Code</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-400" />
                    Loading class records...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No classes available.
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => (
                  <tr key={cls.ClassCode || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-teal-400">{cls.ClassCode}</td>
                    <td className="px-4 py-3.5 font-medium text-white">{cls.Class}</td>
                    <td className="px-4 py-3.5 text-slate-300">{cls.InstructorName || 'Unassigned'}</td>
                    <td className="px-4 py-3.5 text-slate-300">{cls.CreditHours || '3'} hrs</td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">{cls.NoOfStudents || 0}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{cls.ScheduleFileCode || '—'}</td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenForm(cls)}
                        className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.ClassCode)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
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
