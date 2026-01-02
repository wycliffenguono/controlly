import { useState } from 'react';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import type { PlanDef } from '../types';

const Pricing = () => {
  const { data: plansData, loading, error, execute } = useAsync(() => api.getPlans(), []);
  const plans: PlanDef[] = (plansData ?? []) as PlanDef[];
  const [editing, setEditing] = useState<PlanDef | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  const savePlan = async (id: string, patch: Partial<PlanDef>) => {
    try {
      await api.updatePlan(id, patch);
      toast.add({ kind: 'success', title: 'Plan updated' });
      await execute();
      setEditing(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      toast.add({ kind: 'error', title: 'Update failed', message: err.message });
    }
  };

  const restoreDefaults = async () => {
    localStorage.removeItem('controlly:plans');
    await execute();
    toast.add({ kind: 'success', title: 'Default plans restored' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Pricing & Plans</h1>
        <div className="text-sm text-gray-500">Admins can update plan limits</div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-36 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-36 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-36 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4">Error loading pricing data.</div>
      )}

      {!loading && plans.length === 0 && (
        <div className="p-4 bg-yellow-50 rounded mb-4">
          <div className="text-sm text-gray-700">No pricing plans found.</div>
          <div className="mt-2">
            <button onClick={restoreDefaults} className="px-3 py-1 bg-blue-600 text-white rounded">Restore defaults</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {plans.map((p: PlanDef) => (
          <div key={p.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{p.name}</h3>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-300">{p.price === 0 ? 'Free' : `$${p.price}/mo`}</div>
            </div>

            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <div>Projects: <strong>{p.limits?.projects ?? '—'}</strong></div>
              <div>Seats: <strong>{p.limits?.seats ?? '—'}</strong></div>
            </div>

            <div className="mt-4">
              <button
                disabled={user?.role !== 'Admin'}
                onClick={() => setEditing(p)}
                className={`px-3 py-2 rounded ${user?.role === 'Admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                Edit limits
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && <PlanEdit plan={editing} onSave={savePlan} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
};

function PlanEdit({ plan, onSave, onCancel }: { plan: PlanDef; onSave: (id: string, patch: Partial<PlanDef>) => Promise<void>; onCancel: () => void }) {
  const [projects, setProjects] = useState<number>(plan.limits?.projects ?? 0);
  const [seats, setSeats] = useState<number>(plan.limits?.seats ?? 0);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Edit {plan.name}</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm">Projects</label>
          <input type="number" value={projects} onChange={e => setProjects(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm">Seats</label>
          <input type="number" value={seats} onChange={e => setSeats(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={() => onSave(plan.id, { limits: { projects, seats } })} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
