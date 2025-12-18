import { useMemo } from 'react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';
import type { User } from '../types';
import { Doughnut, Line } from 'react-chartjs-2';

type UsagePoint = { date: string; users: number; featureA: number; featureB: number; featureC: number };
type UsageResponse = { points: UsagePoint[] };

const nf = new Intl.NumberFormat();

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white">{value}</div>
  </div>
);

const Dashboard = () => {
const { data: customersData = [], loading } = useAsync(() => api.getCustomers(), []);
  const customers = customersData ?? [];

  const { data: usageData } = useAsync<UsageResponse>(() => api.getUsage({ days: 30 }), []);
  const points = usageData?.points ?? [];

  // Use usage points for DAU/WAU numbers
  const activeDAU = points.length ? points[points.length - 1].users : customers.filter(u => (Date.now() - new Date(u.lastLogin).getTime()) < 24*60*60*1000).length;
  const activeWAU = points.length ? Math.round(points.slice(-7).reduce((s, p) => s + p.users, 0) / Math.min(7, points.length)) : customers.filter(u => (Date.now() - new Date(u.lastLogin).getTime()) < 7*24*60*60*1000).length;

  const totals = useMemo(() => {
  const total = (customers ?? []).reduce((s: number, c: any) => s + (c.seats ?? 0), 0);
    const paid = customers.filter(u => u.plan !== 'Free').length;
    const conversion = total ? Math.round((paid / total) * 100) : 0;
    const teams = Math.max(1, Math.ceil(total / 5));
    return { total, conversion, teams, paid };
  }, [customers]);

  const planCounts = useMemo(() => {
    const map = { Free: 0, Pro: 0, Business: 0 } as any;
    customers.forEach(u => map[u.plan]++);
    return map;
  }, [customers]);

  const donutData = {
    labels: ['Free', 'Pro', 'Business'],
    datasets: [{ data: [planCounts.Free, planCounts.Pro, planCounts.Business], backgroundColor: ['#E5E7EB', '#60A5FA', '#7C3AED'] }],
  };

  const growthData = {
    labels: points.map(p => new Date(p.date).toLocaleDateString()),
    datasets: [{ label: 'Active users', data: points.map(p => p.users), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.25, fill: true }],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total users" value={loading ? '…' : totals.total} />
        <StatCard title="Active (DAU)" value={loading ? '…' : nf.format(activeDAU)} />
        <StatCard title="Active (WAU)" value={loading ? '…' : nf.format(activeWAU)} />
        <StatCard title="Teams (approx.)" value={loading ? '…' : totals.teams} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-sm text-gray-500">User growth (last 30 days)</div>
          <div className="mt-4">
            {points.length ? <Line data={growthData as any} /> : <div className="text-gray-500">Loading or no data</div>}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Subscription breakdown</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-white">{totals.conversion}% paid</div>
          </div>

          <div className="mt-4">
            <Doughnut data={donutData as any} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
