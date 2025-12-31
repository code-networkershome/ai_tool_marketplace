'use client';

import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Save, RotateCw } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminRankingPage() {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setIsLoading(true);
    try {
      const data = await api.client.get('/admin/ranking/config');
      setConfig(data.data);
    } catch (error) {
      toast.error('Failed to load ranking config');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.client.patch('/admin/ranking/config', config);
      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      await api.recalculateRankings();
      toast.success('Ranking recalculation started');
    } catch (error) {
      toast.error('Failed to start recalculation');
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ranking configuration</h1>
          <p className="text-gray-600">Adjust the algorithm weights for tool rankings</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleRecalculate} variant="outline" className="flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Recalculate All
          </Button>
          <Button onClick={handleSave} variant="primary" className="flex items-center gap-2" isLoading={isSaving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            Weights
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Sponsored weight', key: 'weight_sponsored' },
              { label: 'Featured weight', key: 'weight_featured' },
              { label: 'Engagement weight', key: 'weight_engagement' },
              { label: 'Reviews weight', key: 'weight_reviews' },
              { label: 'Freshness weight', key: 'weight_freshness' },
              { label: 'Internal tool weight', key: 'weight_internal' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  value={config[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: parseFloat(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Thresholds & Decay
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Freshness Decay (Days)', key: 'freshness_decay_days' },
              { label: 'Engagement Decay (Days)', key: 'engagement_decay_days' },
              { label: 'Min Reviews for Score', key: 'min_reviews_for_score' },
              { label: 'Trending Threshold', key: 'trending_threshold' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  value={config[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: parseInt(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
