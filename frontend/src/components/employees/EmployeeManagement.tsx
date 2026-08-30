import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Save,
  X,
  User,
  GraduationCap,
  Heart
} from 'lucide-react';
import { api } from '../../services/api';
import type { Employee } from '../../services/api';

type EmpFormTab = 'personal' | 'employment' | 'education' | 'emergency';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<EmpFormTab>('personal');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees(search);
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const handleOpenForm = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({ ...emp });
    } else {
      setEditingEmployee(null);
      setFormData({
        FileCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        FullName: '',
        JobTitle: 'Instructor',
        Department: 'Academic',
        EmploymentType: 'Full-Time',
        HireDate: new Date().toISOString().split('T')[0]
      });
    }
    setActiveTab('personal');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.FileCode || !formData.FullName) {
      alert('FileCode and Full Name are required.');
      return;
    }
    try {
      if (editingEmployee && editingEmployee.FileCode) {
        await api.updateEmployee(editingEmployee.FileCode, formData);
      } else {
        await api.createEmployee(formData);
      }
      setShowForm(false);
      fetchEmployees();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Delete employee profile?')) {
      try {
        await api.deleteEmployee(id);
        fetchEmployees();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const updateField = (key: keyof Employee, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-purple-400" />
            Employee Profiles Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Complete database management for Staff, Instructors, Contracts, Payroll, and Academic Credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchEmployees} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Employee Profile
          </button>
        </div>
      </div>

      {/* Form Modal with 4 Sub-category Tabs */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between bg-slate-900 px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-400" />
                {editingEmployee ? `Edit Employee: ${editingEmployee.FullName}` : 'New Employee Registration'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-950 border-b border-slate-800 px-6 py-2 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium cursor-pointer ${
                  activeTab === 'personal' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Personal Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employment')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium cursor-pointer ${
                  activeTab === 'employment' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                Employment & Contract
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('education')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium cursor-pointer ${
                  activeTab === 'education' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Education & Skills
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium cursor-pointer ${
                  activeTab === 'emergency' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Heart className="h-3.5 w-3.5" />
                Health & Emergency
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* TAB 1: PERSONAL DETAILS */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">File Code (PK) *</label>
                    <input
                      type="text"
                      required
                      value={formData.FileCode || ''}
                      onChange={e => updateField('FileCode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ASC Code</label>
                    <input
                      type="text"
                      value={formData.ASC || ''}
                      onChange={e => updateField('ASC', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.FullName || ''}
                      onChange={e => updateField('FullName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.PhoneNo || ''}
                      onChange={e => updateField('PhoneNo', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.Email || ''}
                      onChange={e => updateField('Email', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">ID Number (IDNo)</label>
                    <input
                      type="text"
                      value={formData.IDNo || ''}
                      onChange={e => updateField('IDNo', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.Nationality || ''}
                      onChange={e => updateField('Nationality', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Birth Date</label>
                    <input
                      type="text"
                      value={formData.BirthDate || ''}
                      onChange={e => updateField('BirthDate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Marital Status</label>
                    <input
                      type="text"
                      value={formData.MaritalStatus || ''}
                      onChange={e => updateField('MaritalStatus', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Spouse Name</label>
                    <input
                      type="text"
                      value={formData.SpouseName || ''}
                      onChange={e => updateField('SpouseName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={formData.Address || ''}
                      onChange={e => updateField('Address', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYMENT & CONTRACT */}
              {activeTab === 'employment' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={formData.JobTitle || ''}
                      onChange={e => updateField('JobTitle', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.Department || ''}
                      onChange={e => updateField('Department', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Class Code Assigned</label>
                    <input
                      type="text"
                      value={formData.ClassCode || ''}
                      onChange={e => updateField('ClassCode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Hire Date</label>
                    <input
                      type="text"
                      value={formData.HireDate || ''}
                      onChange={e => updateField('HireDate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Employee Hire Status</label>
                    <input
                      type="text"
                      value={formData.EmployeeHireStatus || ''}
                      onChange={e => updateField('EmployeeHireStatus', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Job Time / Role</label>
                    <input
                      type="text"
                      value={formData.JobTimeRole || ''}
                      onChange={e => updateField('JobTimeRole', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Salary ($)</label>
                    <input
                      type="number"
                      value={formData.Salary || ''}
                      onChange={e => updateField('Salary', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Payroll Frequency</label>
                    <input
                      type="text"
                      value={formData.PayrollFrequency || 'Monthly'}
                      onChange={e => updateField('PayrollFrequency', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Employment Type</label>
                    <input
                      type="text"
                      value={formData.EmploymentType || 'Full-Time'}
                      onChange={e => updateField('EmploymentType', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Contract Code</label>
                    <input
                      type="text"
                      value={formData.ContractCode || ''}
                      onChange={e => updateField('ContractCode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Contract Expiration Date</label>
                    <input
                      type="text"
                      value={formData.ContractExpireDate || ''}
                      onChange={e => updateField('ContractExpireDate', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: EDUCATION & SKILLS */}
              {activeTab === 'education' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Academic Level</label>
                    <input
                      type="text"
                      value={formData.AcadamicLevel || ''}
                      onChange={e => updateField('AcadamicLevel', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Institution</label>
                    <input
                      type="text"
                      value={formData.Institution || ''}
                      onChange={e => updateField('Institution', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={formData.Specialization || ''}
                      onChange={e => updateField('Specialization', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Languages</label>
                    <input
                      type="text"
                      value={formData.Language || ''}
                      onChange={e => updateField('Language', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Special Skills</label>
                    <input
                      type="text"
                      value={formData.SpecialSkills || ''}
                      onChange={e => updateField('SpecialSkills', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Interests</label>
                    <input
                      type="text"
                      value={formData.Interest || ''}
                      onChange={e => updateField('Interest', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-3">
                    <label className="block text-slate-400 mb-1">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.AdditionalNote || ''}
                      onChange={e => updateField('AdditionalNote', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: EMERGENCY & HEALTH */}
              {activeTab === 'emergency' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Emergency Contact Person & Phone</label>
                    <input
                      type="text"
                      value={formData.EmergencyContact || ''}
                      onChange={e => updateField('EmergencyContact', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Emergency Address</label>
                    <input
                      type="text"
                      value={formData.EmergencyAddress || ''}
                      onChange={e => updateField('EmergencyAddress', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-slate-400 mb-1">Health Status & Medical Remarks</label>
                    <textarea
                      rows={3}
                      value={formData.HealthStatus || ''}
                      onChange={e => updateField('HealthStatus', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" />
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-300">Staff & Employee Master Database ({employees.length})</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 uppercase tracking-wider text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5 font-semibold">File Code</th>
                <th className="p-3.5 font-semibold">Full Name</th>
                <th className="p-3.5 font-semibold">Job Title</th>
                <th className="p-3.5 font-semibold">Department</th>
                <th className="p-3.5 font-semibold">Phone / Email</th>
                <th className="p-3.5 font-semibold">Salary</th>
                <th className="p-3.5 font-semibold">Hire Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading employee records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No employee records found.
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => (
                  <tr key={emp.FileCode || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-purple-400">{emp.FileCode}</td>
                    <td className="p-3.5 font-medium text-white">{emp.FullName}</td>
                    <td className="p-3.5 text-slate-300">{emp.JobTitle || 'Staff'}</td>
                    <td className="p-3.5 text-slate-300">{emp.Department || 'General'}</td>
                    <td className="p-3.5 text-slate-300">
                      {emp.PhoneNo || emp.Email || '—'}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400">${emp.Salary || 0}</td>
                    <td className="p-3.5 text-slate-300">{emp.HireDate || '—'}</td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenForm(emp)}
                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.ID)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete Employee"
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

