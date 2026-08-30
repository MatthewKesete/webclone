import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Save,
  RefreshCw,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import type { Transcript } from '../../services/api';

const COURSE_TYPES = [
  { id: 'web', name: 'Web Development (StudentTranscriptWEB)' },
  { id: 'acc', name: 'Accounting (StudentTranscriptACC)' },
  { id: 'mtt', name: 'MTT (StudentTranscriptMTT)' },
  { id: 'pvs', name: 'PVS Photography/Video (StudentTranscriptPVS)' },
  { id: 'dme', name: 'Digital Marketing (StudentTranscriptDME)' },
  { id: 'bmt', name: 'Business Management (StudentTranscriptBMT)' },
  { id: 'om', name: 'Office Management (StudentTranscriptOM)' },
  { id: 'mff', name: 'Freight Forwarding (StudentTranscriptMFF)' },
  { id: 'pmt', name: 'Project Management (StudentTranscriptPMT)' },
  { id: 'default', name: 'General Transcript (StudentTranscript)' },
];

export const TranscriptManagement: React.FC = () => {
  const [courseType, setCourseType] = useState<string>('web');
  const [fileCode, setFileCode] = useState<string>('ACC101');
  const [transcriptData, setTranscriptData] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<boolean>(false);

  const fetchTranscript = async () => {
    if (!fileCode) return;
    setLoading(true);
    try {
      const res = await api.getTranscript(courseType, fileCode);
      if (res.data && res.data.length > 0) {
        setTranscriptData(res.data[0]);
        setFormData(res.data[0]);
      } else {
        setTranscriptData(null);
        setFormData({ FileCode: fileCode, Attendance: 10, Conduct: 10, ClassParticipation: 10 });
      }
    } catch (err) {
      console.error('Failed to fetch transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscript();
  }, [courseType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (transcriptData) {
        await api.updateTranscript(courseType, fileCode, formData);
      } else {
        await api.createTranscript(courseType, formData);
      }
      alert('Transcript saved successfully!');
      fetchTranscript();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="h-7 w-7 text-amber-400" />
            Student Academic Transcripts
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Grade entry, course score breakdown, and cumulative evaluations per course type.
          </p>
        </div>
      </div>

      {/* Course & Student Search Bar */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Course Transcript Type</label>
            <select
              value={courseType}
              onChange={e => setCourseType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            >
              {COURSE_TYPES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Student File Code</label>
            <div className="relative">
              <input
                type="text"
                value={fileCode}
                onChange={e => setFileCode(e.target.value)}
                placeholder="Enter FileCode e.g. ACC101"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={fetchTranscript} className="btn-primary w-full justify-center">
              <Search className="h-4 w-4" /> Load Transcript
            </button>
          </div>
        </div>
      </div>

      {/* Score Grid & Layout Form */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/50 shadow-xl">
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-amber-400" />
            Loading transcript evaluation data...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                Score Evaluation Form for FileCode: <span className="font-mono text-amber-400">{fileCode}</span>
              </h3>
              <div className="text-sm font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                Cumulative Grade: <span className="text-emerald-400 font-mono text-base ml-1">{formData.Commulative || 'N/A'}</span>
              </div>
            </div>

            {/* General Evaluation Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Attendance Score</label>
                <input
                  type="number"
                  value={formData.Attendance || ''}
                  onChange={e => setFormData({ ...formData, Attendance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Conduct Score</label>
                <input
                  type="number"
                  value={formData.Conduct || ''}
                  onChange={e => setFormData({ ...formData, Conduct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Class Participation</label>
                <input
                  type="number"
                  value={formData.ClassParticipation || ''}
                  onChange={e => setFormData({ ...formData, ClassParticipation: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Course-Specific Score Fields */}
            {courseType === 'web' && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Web Development Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Management of HTML</label>
                    <input
                      type="number"
                      value={formData.ManagementOfHTML || ''}
                      onChange={e => setFormData({ ...formData, ManagementOfHTML: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Management of CSS</label>
                    <input
                      type="number"
                      value={formData.ManagementOfCSS || ''}
                      onChange={e => setFormData({ ...formData, ManagementOfCSS: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Management of JS</label>
                    <input
                      type="number"
                      value={formData.ManagementOfJavaScript || ''}
                      onChange={e => setFormData({ ...formData, ManagementOfJavaScript: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">UI Presentation & Flow</label>
                    <input
                      type="number"
                      value={formData.UIPresentationAndFlow || ''}
                      onChange={e => setFormData({ ...formData, UIPresentationAndFlow: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {courseType === 'acc' && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Accounting Modules</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Accounting Equation</label>
                    <input
                      type="number"
                      value={formData.BasicAccountingEquation || ''}
                      onChange={e => setFormData({ ...formData, BasicAccountingEquation: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Journalizing & Trial Bal.</label>
                    <input
                      type="number"
                      value={formData.Journalizing || ''}
                      onChange={e => setFormData({ ...formData, Journalizing: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Financial Statements</label>
                    <input
                      type="number"
                      value={formData.FinancialStatement || ''}
                      onChange={e => setFormData({ ...formData, FinancialStatement: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Methods of Inventory</label>
                    <input
                      type="number"
                      value={formData.MethodsOfInventory || ''}
                      onChange={e => setFormData({ ...formData, MethodsOfInventory: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Action */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" />
                {saving ? 'Saving Scores...' : 'Save Transcript Scores'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
