'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types/database';
import { Spinner } from '@/shared/components/ui';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Asset[];
  preselectedAssetId?: string;
}

const incomeSources: { value: string; label: string; icon: string }[] = [
  { value: 'ค่าเช่า', label: 'ค่าเช่า', icon: '🏠' },
  { value: 'เงินมัดจำ', label: 'เงินมัดจำ', icon: '💰' },
  { value: 'ค่าส่วนกลาง', label: 'ค่าส่วนกลาง', icon: '🏢' },
  { value: 'ค่าน้ำ/ไฟ', label: 'ค่าน้ำ/ไฟ', icon: '💡' },
  { value: 'ค่าบริการ', label: 'ค่าบริการ', icon: '🛠️' },
  { value: 'อื่นๆ', label: 'อื่นๆ', icon: '📝' },
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

  const handleSourceSelect = (source: string) => {
    if (source === 'อื่นๆ') {
      setCustomSource(true);
    } else {
      setCustomSource(false);
      setFormData(prev => ({ ...prev, customSourceText: '' }));
    }
    setFormData(prev => ({ ...prev, source }));
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
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-warm-900 w-full md:max-w-lg md:mx-4 md:rounded-2xl shadow-xl max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-warm-200 dark:border-warm-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-warm-900 dark:text-warm-50">
              บันทึกรายรับ
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

            {/* เลือกทรัพย์สิน */}
            {!preselectedAssetId && (
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  ทรัพย์สิน <span className="text-red-500">*</span>
                </label>
                <select
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-shadow"
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

            {/* แหล่งรายรับ - Grid of buttons */}
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                แหล่งรายรับ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {incomeSources.map(source => (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => handleSourceSelect(source.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      formData.source === source.value
                        ? 'border-sage-500 bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-300'
                        : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600 text-warm-600 dark:text-warm-400'
                    }`}
                  >
                    <span className="text-xl mb-1">{source.icon}</span>
                    <span className="text-xs font-medium">{source.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom source input */}
            {customSource && (
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  ระบุแหล่งรายรับ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customSourceText"
                  value={formData.customSourceText}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-shadow"
                  placeholder="เช่น ค่าจอดรถ, ค่าโฆษณา"
                />
              </div>
            )}

            {/* จำนวนเงิน - Large input */}
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
                  className="w-full px-4 py-4 pr-12 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-sage-500 focus:border-transparent text-xl font-semibold transition-shadow"
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
                className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-shadow"
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
                className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-shadow resize-none"
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
                className="w-full sm:w-auto px-6 py-3 bg-sage-500 text-white rounded-xl hover:bg-sage-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกรายรับ'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
