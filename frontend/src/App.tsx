import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import type { ActiveTab } from './components/Navigation';
import { TopHeaderToolbar } from './components/TopHeaderToolbar';
import { StudentManagement } from './components/students/StudentManagement';
import { ClassManagement } from './components/classes/ClassManagement';
import { EmployeeManagement } from './components/employees/EmployeeManagement';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');

  return (
    <div className="min-h-screen flex flex-row bg-[#161616] text-zinc-100 font-sans">
      {/* DevExpress TIT Accordion Sidebar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workbench Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Controls Bar (Lock, Dropdown, Search Input) */}
        <TopHeaderToolbar />

        {/* Workbench Content Body */}
        <main className="flex-1 p-4">
          {activeTab === 'students' && <StudentManagement />}
          {activeTab === 'classes' && <ClassManagement />}
          {activeTab === 'employees' && <EmployeeManagement />}
          {activeTab === 'inventory' && (
            <div className="bg-[#181818] border border-[#2e2e2e] p-8 text-center text-zinc-400">
              Inventory Profiles Module
            </div>
          )}
          {activeTab === 'users' && (
            <div className="bg-[#181818] border border-[#2e2e2e] p-8 text-center text-zinc-400">
              User Profiles & Permissions Module
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;


