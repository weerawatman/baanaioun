'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types/database';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Asset[];
  preselectedAssetId?: string;
}

const commonSources = [
  'ค่าเช่า',
  'เงินมัดจำ',
  'ค่าส่วนกลาง',
  'ค่าน้ำ/ไฟ',
  'ค่าบริการ',
  'อื่นๆ',
];

export default function AddIncomeModal({
  isOpen,
  onClose,
  onSuccess,
  assets,
  preselectedAssetId,
}: AddIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSource, setCustomSource] = useState(false);

  const [formData, setFormData] = useState({
    asset_id: preselectedAssetId || '',
    source: 'ค่าเช่า',
    customSourceText: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'source') {
      if (value === 'อื่นๆ') {
        setCustomSource(true);
      } else {
        setCustomSource(false);
        setFormData(prev => ({ ...prev, customSourceText: '' }));
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const source = customSource ? formData.customSourceText : formData.source;

      if (!source.trim()) {
        throw new Error('กรุณาระบุแหล่งรายรับ');
      }

      const { error: insertError } = await supabase.from('incomes').insert({
        asset_id: formData.asset_id,
        source: source.trim(),
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        description: formData.description || null,
      });

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        asset_id: preselectedAssetId || '',
        source: 'ค่าเช่า',
        customSourceText: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      setCustomSource(false);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              บันทึกรายรับ
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* เลือกทรัพย์สิน */}
          {!preselectedAssetId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ทรัพย์สิน <span className="text-red-500">*</span>
              </label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกทรัพย์สิน --</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.title_deed_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* แหล่งรายรับ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              แหล่งรายรับ <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {commonSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Custom source input */}
          {customSource && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ระบุแหล่งรายรับ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customSourceText"
                value={formData.customSourceText}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น ค่าจอดรถ, ค่าโฆษณา"
              />
            </div>
          )}

          {/* จำนวนเงิน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              จำนวนเงิน (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="0.00"
            />
          </div>

          {/* วันที่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              วันที่ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              รายละเอียด
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกรายรับ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
