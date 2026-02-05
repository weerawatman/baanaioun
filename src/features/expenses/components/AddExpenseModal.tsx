'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ExpenseCategory } from '@/types/database';
import { EXPENSE_CATEGORY_OPTIONS } from '@/shared/utils';
import { Spinner } from '@/shared/components/ui';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renovationProjectId: string;
  assetId: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  renovationProjectId,
  assetId,
}: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'materials' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    vendor: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('expenses').insert({
        renovation_project_id: renovationProjectId,
        asset_id: assetId,
        category: formData.category,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        description: formData.description || null,
        vendor: formData.vendor || null,
      });

      if (insertError) throw insertError;

      setFormData({
        category: 'materials',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        vendor: '',
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const generalCategories = EXPENSE_CATEGORY_OPTIONS.filter(c => c.group === 'general');
  const constructionCategories = EXPENSE_CATEGORY_OPTIONS.filter(c => c.group === 'construction');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-warm-900 w-full md:max-w-lg md:mx-4 md:rounded-2xl shadow-xl max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-warm-200 dark:border-warm-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-warm-900 dark:text-warm-50">
              บันทึกค่าใช้จ่าย
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-warm-500 hover:text-warm-700 dark:hover:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* หมวดหมู่ */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-3">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>

              {/* General Categories */}
              <p className="text-xs font-medium text-warm-500 dark:text-warm-400 mb-2 uppercase tracking-wider">
                ทั่วไป
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {generalCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                      formData.category === cat.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600 text-warm-600 dark:text-warm-400'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Construction-specific Categories */}
              <p className="text-xs font-medium text-warm-500 dark:text-warm-400 mb-2 uppercase tracking-wider">
                งานก่อสร้าง
              </p>
              <div className="grid grid-cols-2 gap-2">
                {constructionCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                      formData.category === cat.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600 text-warm-600 dark:text-warm-400'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* จำนวนเงิน - Large input for easy mobile entry */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                จำนวนเงิน (บาท) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-4 pr-12 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xl font-semibold transition-shadow"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 dark:text-warm-500 text-lg">
                  ฿
                </span>
              </div>
            </div>

            {/* วันที่ */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                วันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* ร้านค้า/ผู้รับเหมา */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                ร้านค้า/ผู้รับเหมา
              </label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="เช่น ร้านวัสดุก่อสร้าง, ช่างสมชาย"
              />
            </div>

            {/* รายละเอียด */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                รายละเอียด
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 px-4 py-4 md:px-6 border-t border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-800/50">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-warm-300 dark:border-warm-700 rounded-xl text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
