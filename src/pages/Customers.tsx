// src/pages/Customers.tsx
import { useEffect, useMemo, useState } from 'react';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';
import type { Customer } from '../types';
import { useSearchParams } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';

const pageSize = 8;
const nf = new Intl.NumberFormat();

export default function Customers() {
  const { data, loading } = useAsync(() => api.getCustomers(), []);
  const customers: Customer[] = useMemo(() => (data ?? []) as Customer[], [data]);


  
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const debounced = useDebouncedValue(query, 250);
  const [page, setPage] = useState(1);

  useEffect(() => setQuery(initialQ), [initialQ]);

  const filtered = useMemo(() => {
    const list = customers ?? [];
    if (!debounced) return list;
    return list.filter((c: Customer) => `${c.name} ${c.email} ${c.plan}`.toLowerCase().includes(debounced.toLowerCase()));
  }, [customers, debounced]);

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const planCounts = useMemo(() => {
    const map: Record<string, number> = { Free: 0, Pro: 0, Business: 0 };
    customers.forEach((c: Customer) => map[c.plan]++);
    return map;
  }, [customers]);

  const donutData = {
    labels: ['Free', 'Pro', 'Business'],
    datasets: [{ data: [planCounts.Free, planCounts.Pro, planCounts.Business], backgroundColor: ['#E5E7EB', '#60A5FA', '#7C3AED'] }],
  } as const;

  return (
    <div className="text-gray-700 dark:text-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Customers</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">External customers using the Controlly platform</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500 dark:text-gray-300">{filtered.length} customers</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">Showing {Math.min(filtered.length, page * pageSize)} of {filtered.length}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Seats</th>
                  <th className="p-3 text-left">Plan</th>
                  <th className="p-3 text-left">Last active</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-300">Loading…</td></tr>}
                {!loading && paged.map((c: Customer) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.name}<div className="text-xs text-gray-500 dark:text-gray-300">{c.email}</div></td>
                    <td className="p-3">{nf.format(c.seats)}</td>
                    <td className="p-3">{c.plan}</td>
                    <td className="p-3">{new Date(c.lastActive).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-300">No customers found</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div />
            <div className="space-x-2">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
              <button disabled={page * pageSize >= filtered.length} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-300">Subscription distribution</div>
          <div className="mt-4"><Doughnut data={donutData} /></div>
        </div>
      </div>
    </div>
  );
}