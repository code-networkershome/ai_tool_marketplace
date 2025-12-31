'use client';

import { useState } from 'react';
import { Settings, Save, Bell, Shield, Globe, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure general marketplace behavior and integrations</p>
        </div>
        <Button onClick={handleSave} variant="primary" isLoading={isSaving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      <div className="grid gap-8 max-w-4xl">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            General Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input type="text" className="w-full rounded-lg border-gray-300" defaultValue="AI_for_X" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" className="w-full rounded-lg border-gray-300" defaultValue="admin@ai_for_x.com" />
            </div>
          </div>
        </div>

        {/* Moderation Settings */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Moderation Policy
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-approve Creator Submissions</p>
                <p className="text-sm text-gray-500">Enable this to bypass moderation for trusted creators</p>
              </div>
              <input type="checkbox" className="h-5 w-5 rounded text-primary-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Require Email Verification</p>
                <p className="text-sm text-gray-500">Users must verify email before submitting tools</p>
              </div>
              <input type="checkbox" className="h-5 w-5 rounded text-primary-600" defaultChecked />
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary-600" />
            External Integrations
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scraper User Agent</label>
              <input type="text" className="w-full rounded-lg border-gray-300" defaultValue="AI_for_X Crawler v1.0" />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Vector Database (Qdrant) is currently disconnected.</span>
              </div>
              <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-100">
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
