const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export interface Student {
  ID?: number;
  StudentASCNo?: string;
  FileCode?: string;
  DateOfRegistration?: string;
  DateOfGraduation?: string;
  SName?: string;
  FathersName?: string;
  GrandFathersName?: string;
  Gender?: string;
  Age?: number | string;
  BIrthPlace?: string;
  PhoneNumber?: string;
  Zoba?: string;
  City?: string;
  SubZone?: string;
  Street?: string;
  AgeOfStudent?: number | string;
  Nationality?: string;
  IDNo?: string;
  EducationLevel?: string;
  PreviousORCurrentschool?: string;
  Department?: string;
  CourseTakenInTIT?: string;
  Completed?: string;
  FinalExam?: number | string;
  Assignment?: number | string;
  ClassActivitynAttendance?: number | string;
  Overall?: number | string;
  GuardiansFullName?: string;
  Relation?: string;
  GuardianPhoneNumber?: string;
  Address?: string;
  Occupation?: string;
  StudentsHeathBackground?: string;
  SPhoto?: string;
  FirstPayment?: number | string;
  FirstPaymentDate?: string;
  FirstPaymentCheckNo?: string;
  SecondPayment?: number | string;
  SecondPaymentDate?: string;
  SecondPaymentCheckNo?: string;
  ThirdPayment?: number | string;
  ThirdPaymentDate?: string;
  ThirdPaymentCheckNo?: string;
  PaymentCondition?: string;
  Remark?: string;
  ClassFee?: number | string;
  Total?: number | string;
  PaymentCompletion?: string;
  ManualFileCode?: string;
  ManualReceptionDate?: string;
  ManualReturnDate?: string;
  ManualCondition?: string;
  ManualRemark?: string;
  BatchrReceptionDate?: string;
  BatchReturnDate?: string;
  BatchRemark?: string;
  [key: string]: any;
}

export interface ClassProfile {
  ClassCode?: string;
  Class?: string;
  CreditHours?: number | string;
  HoursPerWeek?: number | string;
  ClassPerWeek?: number | string;
  StartDate?: string;
  EndDate?: string;
  NoOfStudents?: number | string;
  NoOfMales?: number | string;
  NoOfFemales?: number | string;
  InstructorName?: string;
  InstructorFileCode?: string;
  GuestInstructor?: string;
  ScheduleFileCode?: string;
  AttendanceFileCode?: string;
  [key: string]: any;
}

export interface ScheduleProfile {
  ScheduleFileCode?: string;
  Class?: string;
  ClassFileCode?: string;
  DayOne?: string;
  DayTwo?: string;
  DayThree?: string;
  TimeOne?: string;
  TimeTwo?: string;
  TimeThree?: string;
  Room?: string;
  InstructorName?: string;
  InstructorFileCode?: string;
  [key: string]: any;
}

export interface AttendanceProfile {
  ID?: number;
  Class?: string;
  ClassFileCode?: string;
  ScheduleFileCode?: string;
  'DateOfClass/StartTime'?: string;
  'DateOfClass/EndTime'?: string;
  AbsenteeFileCode1?: string;
  AbsenteeReason1?: string;
  AbsenteeFileCode2?: string;
  AbsenteeReason2?: string;
  AbsenteeFileCode3?: string;
  AbsenteeReason3?: string;
  AbsenteeFileCode4?: string;
  AbsenteeReason4?: string;
  AbsenteeFileCode5?: string;
  AbsenteeReason5?: string;
  [key: string]: any;
}

export interface Employee {
  ID?: number;
  FullName?: string;
  ASC?: string;
  FileCode?: string;
  Address?: string;
  Nationality?: string;
  IDNo?: string;
  PhoneNo?: string;
  Email?: string;
  BirthDate?: string;
  MaritalStatus?: string;
  SpouseName?: string;
  AcadamicLevel?: string;
  Institution?: string;
  Specialization?: string;
  AdditionalNote?: string;
  EmployeeHireStatus?: string;
  JobTimeRole?: string;
  HireDate?: string;
  JobTitle?: string;
  ClassCode?: string;
  Salary?: number | string;
  PayrollFrequency?: string;
  EmploymentType?: string;
  ContractExpireDate?: string;
  Department?: string;
  ContractCode?: string;
  Language?: string;
  SpecialSkills?: string;
  HealthStatus?: string;
  Interest?: string;
  EmergencyContact?: string;
  EmergencyAddress?: string;
  [key: string]: any;
}

export interface Transcript {
  ID?: number;
  FileCode?: string;
  Commulative?: number | string;
  [key: string]: any;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; dbEngine: string }>('/health'),

  // Students
  getStudents: (search?: string, column?: string, classCode?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (column) params.append('column', column);
    if (classCode) params.append('classCode', classCode);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; count: number; data: Student[] }>(`/students${query}`);
  },
  getStudentById: (id: string | number) => request<{ success: boolean; data: Student }>(`/students/${id}`),
  createStudent: (data: Partial<Student>) => request<{ success: boolean; message: string; id: number }>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStudent: (id: string | number, data: Partial<Student>) => request<{ success: boolean; message: string }>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteStudent: (id: string | number) => request<{ success: boolean; message: string }>(`/students/${id}`, {
    method: 'DELETE',
  }),

  // Classes
  getClasses: () => request<{ success: boolean; count: number; data: ClassProfile[] }>('/classes'),
  getClassByCode: (code: string) => request<{ success: boolean; data: ClassProfile }>(`/classes/${code}`),
  createClass: (data: Partial<ClassProfile>) => request<{ success: boolean; id: number }>('/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateClass: (code: string, data: Partial<ClassProfile>) => request<{ success: boolean }>(`/classes/${code}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteClass: (code: string) => request<{ success: boolean }>(`/classes/${code}`, {
    method: 'DELETE',
  }),

  // Schedules
  getSchedules: () => request<{ success: boolean; count: number; data: ScheduleProfile[] }>('/schedules'),
  getScheduleByClass: (classCode: string) => request<{ success: boolean; count: number; data: ScheduleProfile[] }>(`/schedules/class/${classCode}`),
  createSchedule: (data: Partial<ScheduleProfile>) => request<{ success: boolean; id: number }>('/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSchedule: (id: number, data: Partial<ScheduleProfile>) => request<{ success: boolean }>(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSchedule: (id: number) => request<{ success: boolean }>(`/schedules/${id}`, {
    method: 'DELETE',
  }),

  // Attendance
  getAttendance: () => request<{ success: boolean; count: number; data: AttendanceProfile[] }>('/attendance'),
  getAttendanceByClass: (classCode: string) => request<{ success: boolean; count: number; data: AttendanceProfile[] }>(`/attendance/class/${classCode}`),
  createAttendance: (data: Partial<AttendanceProfile>) => request<{ success: boolean; id: number }>('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAttendance: (id: number, data: Partial<AttendanceProfile>) => request<{ success: boolean }>(`/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Employees
  getEmployees: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; count: number; data: Employee[] }>(`/employees${query}`);
  },
  getEmployeeByCode: (code: string) => request<{ success: boolean; data: Employee }>(`/employees/${code}`),
  createEmployee: (data: Partial<Employee>) => request<{ success: boolean; id: number }>('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEmployee: (code: string, data: Partial<Employee>) => request<{ success: boolean }>(`/employees/${code}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteEmployee: (id: number | string) => request<{ success: boolean }>(`/employees/${id}`, {
    method: 'DELETE',
  }),

  // Transcripts
  getTranscript: (type: string, fileCode: string) => request<{ success: boolean; count: number; data: Transcript[] }>(`/transcripts/${type}/${fileCode}`),
  createTranscript: (type: string, data: Partial<Transcript>) => request<{ success: boolean; id: number }>(`/transcripts/${type}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTranscript: (type: string, fileCode: string, data: Partial<Transcript>) => request<{ success: boolean }>(`/transcripts/${type}/${fileCode}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
