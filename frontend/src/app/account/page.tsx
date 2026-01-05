'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, Trash2, LogOut, Shield, Crown, UserCircle } from 'lucide-react';
import api from '@/lib/api';
import { User as UserType } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load account info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteAccount();
      toast.success('Account deleted successfully');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-xl bg-gray-200" />
            <div className="h-64 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in</h1>
          <p className="mt-2 text-gray-600">You need to be logged in to view this page</p>
          <Link href="/login">
            <Button className="mt-4">Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const isSuperAdmin = user.role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your profile and account preferences</p>
        </div>

        {/* Profile Card */}
        <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || user.email} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <UserCircle className="h-12 w-12 text-white" />
                )}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.full_name || 'User'}</h2>
                <p className="opacity-90">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      {isSuperAdmin ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                    {user.is_verified ? (
                      <>
                        <Crown className="h-4 w-4" />
                        Verified
                      </>
                    ) : (
                      'Unverified'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-gray-900">{user.full_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
              {user.company_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Company</label>
                  <p className="mt-1 text-gray-900">{user.company_name}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <p className="mt-1 capitalize text-gray-900">{user.role.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Link href="/account/edit">
                <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Admin Dashboard
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Access admin features and settings</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin">
                  <Button variant="outline" size="sm">Admin Panel</Button>
                </Link>
                <Link href="/admin/tools">
                  <Button variant="outline" size="sm">Manage Tools</Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">Manage Users</Button>
                </Link>
                <Link href="/admin/categories">
                  <Button variant="outline" size="sm">Categories</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
          <div className="border-b border-red-200 bg-red-50 px-6 py-4">
            <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
