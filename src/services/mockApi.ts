// src/services/mockApi.ts
import { users as seedUsers, User as SeedUser } from '../../users';
import type { User } from '../types';

const STORAGE_KEY = 'controlly:users';
const DELAY = (ms = 400) =>
  new Promise(resolve => setTimeout(resolve, ms));

const load = (): User[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  // adapt root seed into our User type
  const normalized = seedUsers.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    status: s.status,
    plan: s.plan,
    lastLogin: s.lastLogin,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

const save = (users: User[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

const CUST_KEY = 'controlly:customers';

function seedCustomers(count = 200) {
  const plans = ['Free', 'Pro', 'Business'];
  const names = ['Acme Corp', 'Brightside', 'BlueOcean', 'Nova Labs', 'CleverOps', 'Team Alpha', 'Stackworks', 'Orbit Systems'];
  const customers = Array.from({ length: count }).map((_, i) => {
    const name = names[i % names.length] + (i > names.length ? ` ${i}` : '');
    const plan = plans[Math.floor(Math.random() * plans.length)] as any;
    const lastActiveDaysAgo = Math.floor(Math.random() * 120);
    return {
      id: i + 1,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      plan,
      seats: Math.max(1, Math.round(Math.random() * (plan === 'Free' ? 5 : plan === 'Pro' ? 25 : 100))),
      lastActive: new Date(Date.now() - (lastActiveDaysAgo * 24 * 60 * 60 * 1000)).toISOString(),
    };
  });
  return customers;
}

export const api = {
  async listUsers() {
    await DELAY();
    return load();
  },

  async getUser(id: number) {
    await DELAY();
    return load().find(u => u.id === id) ?? null;
  },

   async createUser(payload: Omit<User, 'id'>) {
    await DELAY();
    const data = load();
    const id = Math.max(0, ...data.map(u => u.id)) + 1;
    // Ensure staff created without a plan in UI still get a default plan for data integrity
    const user: User = { id, ...payload, plan: (payload as any).plan ?? 'Free' };
    data.unshift(user);
    save(data);
    return user;
  },
  async updateUser(id: number, patch: Partial<User>) {
    await DELAY();
    const data = load();
    const idx = data.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    data[idx] = { ...data[idx], ...patch };
    save(data);
    return data[idx];
  },

  async deactivateUser(id: number) {
    return api.updateUser(id, { status: 'inactive' });
  },
  async activateUser(id: number) {
    return api.updateUser(id, { status: 'active' });
  },
  async getCustomers() {
    await DELAY();
    const raw = localStorage.getItem(CUST_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallthrough to seed
        console.log("no customers found, seeding...")
      }
    }
    const seeded = seedCustomers(200);
    localStorage.setItem(CUST_KEY, JSON.stringify(seeded));
    return seeded;
  },

  async getCustomer(id: number) {
    await DELAY();
    const arr = await api.getCustomers();
    return arr.find((c: any) => c.id === id) ?? null;
  },

  // keep update hooks if needed (simple patching)
  async updateCustomer(id: number, patch: Partial<any>) {
    await DELAY();
    const arr = await api.getCustomers();
    const idx = arr.findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    arr[idx] = { ...arr[idx], ...patch };
    localStorage.setItem(CUST_KEY, JSON.stringify(arr));
    return arr[idx];
  },

  // basic usage metrics generator (mock)
  async getUsage({ days = 30 }: { days?: number } = {}) {
    await DELAY();
    // base and trend set high so charts show ~100k+ daily numbers
    const base = 100_000;
    const points = Array.from({ length: days }).map((_, i) => {
      const trend = Math.round(i * 2000); // upward trend across the range
      return {
        date: new Date(Date.now() - ((days - i - 1) * 24 * 60 * 60 * 1000)).toISOString(),
        users: base + trend + Math.round(Math.random() * 20_000),
        featureA: 2000 + Math.round(Math.random() * 8_000),
        featureB: 1500 + Math.round(Math.random() * 6_000),
        featureC: 800 + Math.round(Math.random() * 3_500),
      };
    });
    return { points };
  },
  // simple plans stored in localStorage
 async getPlans() {
  await DELAY();
  const raw = localStorage.getItem('controlly:plans');

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      // If parsed is null or not an array, fall through to seeded defaults
    } catch {
      // If parsing fails, fall through to seeded defaults
    }
  }

  const plans = [
    { id: 'free', name: 'Free', limits: { projects: 3, seats: 5 }, price: 0 },
    { id: 'pro', name: 'Pro', limits: { projects: 50, seats: 25 }, price: 49 },
    { id: 'business', name: 'Business', limits: { projects: 500, seats: 250 }, price: 299 },
  ];
  localStorage.setItem('controlly:plans', JSON.stringify(plans));
  return plans;
},

  async updatePlan(id: string, patch: any) {
    await DELAY();
    const plans = await api.getPlans();
    const idx = plans.findIndex((p: any) => p.id === id);
    if (idx === -1) throw new Error('Plan not found');
    plans[idx] = { ...plans[idx], ...patch };
    localStorage.setItem('controlly:plans', JSON.stringify(plans));
    return plans[idx];
  },
};