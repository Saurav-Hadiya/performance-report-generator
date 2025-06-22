export interface Employee {
  _id: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
  hireDate?: Date;
  assignedReviewees?: string[] | Employee[];
  createdAt?: Date;
  updatedAt?: Date;
  emailChanged?: boolean;
  emailConfirmed?: boolean;
}

export interface Review {
  _id: string;
  content: string;
  timestamp: Date;
  targetEmployee: Employee | string;
  reviewedBy?: Employee | string;
  rating?: number;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Organization {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  departments: string[];
}

export interface PerformanceReport {
  criterias: { [key: string]: number; } | null;
  _id?: string;
  employeeId: string;
  month: string;
  ranking: number;
  improvements: string[];
  qualities: string[];
  summary: string;
  createdAt?: Date;
  updatedAt?: Date;
  isRegenerated?: boolean;
  message?: string;
}