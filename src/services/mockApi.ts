// src/services/mockApi.ts
import { users as seedUsers } from '../../users';
import type { User, Customer, PlanDef } from '../types';

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

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function seedCustomers(count = 200) {
  const plans = ['Free', 'Pro', 'Business'];
  const names = ['Acme Corp', 'Brightside', 'BlueOcean', 'Nova Labs', 'CleverOps', 'Team Alpha', 'Stackworks', 'Orbit Systems'];
  const customers = Array.from({ length: count }).map((_, i) => {
    const name = names[i % names.length] + (i > names.length ? ` ${i}` : '');
    const plan = plans[Math.floor(Math.random() * plans.length)] as Customer['plan'];
    const lastActiveDaysAgo = Math.floor(Math.random() * 120);

    // Seats scale by plan: Free small, Pro medium, Business large
    const seats =
      plan === 'Free' ? rand(1, 20)
      : plan === 'Pro' ? rand(50, 2000)
      : rand(500, 5000);

    return {
      id: i + 1,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      plan: plan as Customer['plan'],
      seats,
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
    const user: User = { id, ...payload, plan: payload.plan ?? 'Free' };
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
    return (arr as Customer[]).find((c: Customer) => c.id === id) ?? null;
  },

  // keep update hooks if needed (simple patching)
  async updateCustomer(id: number, patch: Partial<Customer>) {
    await DELAY();
    const arr = await api.getCustomers();
    const idx = (arr as Customer[]).findIndex((c: Customer) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    arr[idx] = { ...arr[idx], ...patch };
    localStorage.setItem(CUST_KEY, JSON.stringify(arr));
    return arr[idx];
  },

  // basic usage metrics generator (mock)
  async getUsage({ days = 30 }: { days?: number } = {}) {
  await DELAY();

  // Scale usage based on total seats across customers so DAU <= total seats
  const customers = (await api.getCustomers()) as Customer[];
  const totalSeats = Math.max(1, customers.reduce((s: number, c: Customer) => s + (c.seats || 0), 0));

  const points = Array.from({ length: days }).map((_, i) => {
    // small trend + random variation (fraction of totalSeats)
    const trend = (i / Math.max(1, days - 1)) * 0.4; // up to +40% trend across range
    const baseFrac = 0.10 + Math.random() * 0.5; // 10% - 60% of seats
    const frac = Math.min(0.95, baseFrac + trend);
    const users = Math.max(1, Math.round(totalSeats * frac));

    const featureA = Math.round(totalSeats * (0.01 + Math.random() * 0.04)); // 1%-5% of seats
    const featureB = Math.round(totalSeats * (0.008 + Math.random() * 0.03));
    const featureC = Math.round(totalSeats * (0.003 + Math.random() * 0.02));

    return {
      date: new Date(Date.now() - ((days - i - 1) * 24 * 60 * 60 * 1000)).toISOString(),
      users,
      featureA,
      featureB,
      featureC,
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

  const plans: PlanDef[] = [
    { id: 'free', name: 'Free', limits: { projects: 3, seats: 5 }, price: 0 },
    { id: 'pro', name: 'Pro', limits: { projects: 50, seats: 25 }, price: 49 },
    { id: 'business', name: 'Business', limits: { projects: 500, seats: 250 }, price: 299 },
  ];
  localStorage.setItem('controlly:plans', JSON.stringify(plans));
  return plans;
},

  async updatePlan(id: string, patch: Partial<PlanDef>) {
    await DELAY();
    const plans = await api.getPlans();
    const idx = (plans as PlanDef[]).findIndex((p: PlanDef) => p.id === id);
    if (idx === -1) throw new Error('Plan not found');
    plans[idx] = { ...plans[idx], ...patch };
    localStorage.setItem('controlly:plans', JSON.stringify(plans));
    return plans[idx];
  },
};