import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  const { data: staff = [] } = useAsync(() => api.listUsers(), []);
  const { data: customers = [] } = useAsync(() => api.getCustomers(), []);

  const staffList = staff ?? [];
 const customerList = customers ?? [];

  const staffMatches = useMemo(() => {
    if (!q) return [];
    return (staffList as any[]).filter(s => `${s.name} ${s.email} ${s.role}`.toLowerCase().includes(q));
  }, [staffList, q]);

  const customerMatches = useMemo(() => {
    if (!q) return [];
    return (customerList as any[]).filter(c => `${c.name} ${c.email} ${c.plan}`.toLowerCase().includes(q));
  }, [customerList, q]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Search results</h1>
      {!q && <div className="mt-4 text-gray-600 dark:text-gray-300">Type and press Enter in the top search bar to search staff and customers.</div>}

      {q && (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Staff ({staffMatches.length})</h3>
            <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {staffMatches.map(s => <li key={s.id}><Link to="/users" className="underline">{s.name}</Link> — {s.email}</li>)}
              {staffMatches.length === 0 && <div className="text-gray-500 dark:text-gray-400">No staff matches.</div>}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Customers ({customerMatches.length})</h3>
            <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {customerMatches.map(c => <li key={c.id}><Link to="/customers" className="underline">{c.name}</Link> — {c.email ?? '—'}</li>)}
              {customerMatches.length === 0 && <div className="text-gray-500 dark:text-gray-400">No customers matches.</div>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}