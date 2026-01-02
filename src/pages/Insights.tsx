import { useMemo, useState } from 'react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';
import type { Customer } from '../types';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

type UsagePoint = { date: string; users: number; featureA: number; featureB: number; featureC: number };
type UsageResponse = { points: UsagePoint[] };

const RangeButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`px-3 py-1 rounded ${active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border'}`}>{children}</button>
);

const Insights = () => {
  const [days, setDays] = useState(30);
  const [view, setView] = useState<'growth'|'usage'>('growth');

  // users for summary
  const { data: customersData = [] } = useAsync(() => api.getCustomers(), []);
    const users: Customer[] = useMemo(() => (customersData ?? []) as Customer[], [customersData]);

  // usage data
  const { data: usageData, loading } = useAsync<UsageResponse>(() => api.getUsage({ days }), [days]);

    const points = useMemo(() => (usageData?.points ?? []), [usageData]);


  const totals = useMemo(() => {
    const list = users ?? [];
    const total = list.reduce((s: number, c: Customer) => s + (c.seats ?? 0), 0);
    const activeDAU = Math.floor(total * 0.6); // estimate DAU as 60% of total seats
    const activeWAU = list.filter(u => (Date.now() - new Date(u.lastActive).getTime()) < 7*24*60*60*1000).length;
    const paid = list.filter(u => u.plan !== 'Free').length;
    const conversion = total ? Math.round((paid / total) * 100) : 0;
    return { total, activeDAU, activeWAU, paid, conversion };
  }, [users]);


  // Line chart data (user growth)
  const growthData = useMemo(() => {
    const arr = points ?? [];
    return {
      labels: arr.map(p => new Date(p.date).toLocaleDateString()),
      datasets: [{ label: 'Active users', data: arr.map(p => p.users), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.25, fill: true }],
    };
  }, [points]);

  // Bar chart: feature usage totals for range
  const featureTotals = useMemo(() => {
    const arr = points ?? [];
    const totals = arr.reduce((acc, p) => {
      acc.A += p.featureA; acc.B += p.featureB; acc.C += p.featureC; return acc;
    }, { A: 0, B: 0, C: 0 });
    return totals;
  }, [points]);

  const featureData = {
    labels: ['Feature A', 'Feature B', 'Feature C'],
    datasets: [{ label: 'Events', data: [featureTotals.A, featureTotals.B, featureTotals.C], backgroundColor: ['#60A5FA','#34D399','#F59E0B'] }],
  };

  const planCounts = useMemo(() => {
    const list = users ?? [];
    const map: Record<string, number> = { Free: 0, Pro: 0, Business: 0 };
    list.forEach((u: Customer) => map[u.plan]++);
    return map;
  }, [users]);

  const donutData = {
    labels: ['Free','Pro','Business'],
    datasets: [{ data: [planCounts.Free, planCounts.Pro, planCounts.Business], backgroundColor: ['#E5E7EB', '#60A5FA', '#7C3AED'] }],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Product Insights</h1>
        <div className="flex items-center gap-2 text-gray-800 dark:text-white">
          <RangeButton active={days===7} onClick={() => setDays(7)}>7d</RangeButton>
          <RangeButton active={days===30} onClick={() => setDays(30)}>30d</RangeButton>
          <RangeButton active={days===90} onClick={() => setDays(90)}>90d</RangeButton>
          <div className="ml-4">
            <button className={`px-3 py-1 rounded ${view==='growth' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border'}`} onClick={() => setView('growth')}>Growth</button>
            <button className={`px-3 py-1 ml-2 rounded ${view==='usage' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border'}`} onClick={() => setView('usage')}>Usage</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3 grid grid-cols-1 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex justify-between">
            <div>
              <div className="text-sm text-gray-500">Total users</div>
              <div className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white">{totals.total}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Active (DAU)</div>
              <div className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white">{totals.activeDAU}</div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            {loading && <div className="text-gray-500">Loading charts…</div>}
            {!loading && view === 'growth' && <Line data={growthData} />}
            {!loading && view === 'usage' && <Bar data={featureData} />}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Subscription distribution</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-white">{totals.conversion}% paid</div>
          </div>

          <div className="mt-4">
            <Doughnut data={donutData} />
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <div>Paid users: <strong className="text-gray-800 dark:text-white">{totals.paid}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
