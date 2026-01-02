// src/types.ts
export type Role = 'Admin' | 'Staff';
export type Plan = 'Free' | 'Pro' | 'Business';
export type Status = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  plan: Plan;
  lastLogin: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  plan: Plan;
  seats: number;
  lastActive: string;
}

export interface PlanDef {
  id: string;
  name: string;
  limits: { projects: number; seats: number };
  price: number;
}