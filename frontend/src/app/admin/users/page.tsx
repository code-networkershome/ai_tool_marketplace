'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, ShieldAlert, ShieldCheck, Mail, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const data = await api.client.get(`/admin/users?page=${page}&limit=20`);
      setUsers(data.data.items);
      setPages(data.data.pages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.client.patch(`/admin/users/${userId}/role?role=${newRole}`);
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user roles and platform access</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">User</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Joined</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary-100 text-primary-700 flex items-center justify-center rounded-full font-bold">
                        {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'creator' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 tabular-nums">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="text-xs rounded border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
