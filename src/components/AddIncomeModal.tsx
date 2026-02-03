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
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-lg md:mx-4 md:rounded-xl shadow-xl max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-xl md:rounded-xl">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              บันทึกรายรับ
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* เลือกทรัพย์สิน */}
            {!preselectedAssetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ทรัพย์สิน <span className="text-red-500">*</span>
                </label>
                <select
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                แหล่งรายรับ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {incomeSources.map(source => (
                  <button
                    key={source.value}
                    type="button"
                    onClick={() => handleSourceSelect(source.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      formData.source === source.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ระบุแหล่งรายรับ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customSourceText"
                  value={formData.customSourceText}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  placeholder="เช่น ค่าจอดรถ, ค่าโฆษณา"
                />
              </div>
            )}

            {/* จำนวนเงิน - Large input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  className="w-full px-4 py-4 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-semibold transition-shadow"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">
                  ฿
                </span>
              </div>
            </div>

            {/* วันที่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                วันที่ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* รายละเอียด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                รายละเอียด
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow resize-none"
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 px-4 py-4 md:px-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
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
