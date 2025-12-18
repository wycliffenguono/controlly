import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useAsync from '../hooks/useAsync';
import { api } from '../services/mockApi';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import type { User } from '../types';
import { useSearchParams } from 'react-router-dom';

const pageSize = 6;

const Staff = () => {
  const { data: dataRaw, loading, error, execute } = useAsync(() => api.listUsers(), []);
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const users = dataRaw ?? [];

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q !== query) setQuery(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!debounced) return users;
    return users.filter(u =>
      [u.name, u.email, u.role].join(' ').toLowerCase().includes(debounced.toLowerCase())
    );
  }, [users, debounced]);

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const handleDeactivate = async (id: number) => {
    if (!isAdmin) {
      toast.add({ kind: 'error', title: 'Unauthorized', message: 'Only Admins can deactivate users' });
      return;
    }

    try {
      await api.deactivateUser(id);
      toast.add({ kind: 'success', title: 'User deactivated' });
      await execute();
    } catch (e) {
      toast.add({ kind: 'error', title: 'Could not deactivate user', message: (e as any).message });
    }
  };

  const handleActivate = async (id: number) => {
  if (!isAdmin) {
    toast.add({ kind: 'error', title: 'Unauthorized', message: 'Only Admins can activate users' });
    return;
  }
  if (!confirm('Activate this staff account?')) return;
  try {
    await api.activateUser(id);
    toast.add({ kind: 'success', title: 'User activated' });
    await execute();
  } catch (e) {
    toast.add({ kind: 'error', title: 'Could not activate user', message: (e as any).message });
  }
};

  const handleSave = async (payload: Partial<User>) => {
    try {
      if ((payload as any).id) {
        await api.updateUser((payload as any).id, payload as any);
        toast.add({ kind: 'success', title: 'User updated' });
      } else {
        // Ensure staff users created here default to 'Free' plan (customers manage plans separately)
        await api.createUser({ ...payload, plan: payload.plan ?? 'Free' } as any);
        toast.add({ kind: 'success', title: 'User created' });
      }
      setEditing(null);
      setShowCreate(false);
      await execute();
    } catch (e) {
      toast.add({ kind: 'error', title: 'Save failed', message: (e as any).message });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Staff</h1>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Search by name, email or role..."
          />
          <button
            onClick={() => setShowCreate(true)}
            disabled={!isAdmin}
            className={`px-4 py-2 rounded ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center">Loading…</td></tr>}
            {error && <tr><td colSpan={5} className="p-6 text-center text-red-600">Error loading users</td></tr>}
            {!loading && paged.map(u => (
              <tr className="border-t text-gray-700 dark:text-gray-300" key={u.id}>
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(u)}
                      className={`px-2 py-1 rounded border ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={!isAdmin}
                    >
                      Edit
                    </button>

                    {u.status === 'inactive' ? (
                      <button
                        onClick={() => handleActivate(u.id)}
                        className="px-2 py-1 rounded border text-green-600"
                        disabled={!isAdmin}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(u.id)}
                        className="px-2 py-1 rounded border text-red-600"
                        disabled={!isAdmin}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No staff found</td></tr>}
          </tbody>
        </table>
        <div className="p-4 flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div>Showing {Math.min(filtered.length, page * pageSize)}/{filtered.length}</div>
          <div className="space-x-2">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
            <button disabled={page * pageSize >= filtered.length} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <UserForm onSave={handleSave} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <UserForm user={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}

function UserForm({ user, onSave, onCancel }: { user?: Partial<User>, onSave: (u: Partial<User>) => void, onCancel: () => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState(user?.role ?? 'Staff');

  const submit = () => {
    if (!name || !email) return;
    onSave({ ...(user ?? {}), name, email, role: role as any });
  };

  return (
    <div className="text-gray-700 dark:text-gray-300">
      <h3 className="text-lg font-semibold mb-3">{user ? 'Edit Staff' : 'Add Staff'}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select value={role} onChange={e => setRole(e.target.value as "Admin" | "Staff")} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900">
            <option>Admin</option>
            <option>Staff</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

export default Staff;
