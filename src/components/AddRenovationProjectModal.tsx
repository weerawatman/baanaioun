'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset, RenovationStatus, ProjectType, PropertyType } from '@/types/database';

interface AddRenovationProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Asset[];
}

const statusOptions: { value: RenovationStatus; label: string; color: string }[] = [
  { value: 'planned', label: 'วางแผน', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'in_progress', label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'completed', label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'cancelled', label: 'ยกเลิก', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

const propertyTypeOptions: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'house', label: 'บ้านเดี่ยว', icon: '🏠' },
  { value: 'semi_detached_house', label: 'บ้านแฝด', icon: '🏘️' },
  { value: 'townhouse', label: 'ทาวน์เฮ้าส์', icon: '🏡' },
  { value: 'condo', label: 'คอนโดมิเนียม', icon: '🏢' },
  { value: 'commercial', label: 'อาคารพาณิชย์', icon: '🏬' },
  { value: 'other', label: 'อื่นๆ', icon: '📦' },
];

export default function AddRenovationProjectModal({
  isOpen,
  onClose,
  onSuccess,
  assets,
}: AddRenovationProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    asset_id: '',
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: '',
    status: 'planned' as RenovationStatus,
    project_type: 'renovation' as ProjectType,
    target_property_type: '' as PropertyType | '',
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
      const { error: insertError } = await supabase.from('renovation_projects').insert({
        asset_id: formData.asset_id,
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        budget: parseFloat(formData.budget) || 0,
        status: formData.status,
        project_type: formData.project_type,
        target_property_type: formData.project_type === 'new_construction' && formData.target_property_type
          ? formData.target_property_type
          : null,
      });

      if (insertError) throw insertError;

      setFormData({
        asset_id: '',
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget: '',
        status: 'planned',
        project_type: 'renovation',
        target_property_type: '',
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-2xl md:mx-4 md:rounded-xl shadow-xl max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-xl md:rounded-xl">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              สร้างโปรเจกต์ใหม่
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

            {/* ประเภทโปรเจกต์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ประเภทโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, project_type: 'renovation' }))}
                  className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    formData.project_type === 'renovation'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-3xl mb-2">🔧</span>
                  <span className={`font-medium text-sm ${
                    formData.project_type === 'renovation'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    ปรับปรุง
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Renovation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, project_type: 'new_construction' }))}
                  className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    formData.project_type === 'new_construction'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-3xl mb-2">🏗️</span>
                  <span className={`font-medium text-sm ${
                    formData.project_type === 'new_construction'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    สร้างใหม่
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">New Construction</span>
                </button>
              </div>
            </div>

            {/* เลือกทรัพย์สิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ทรัพย์สิน <span className="text-red-500">*</span>
              </label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                <option value="">-- เลือกทรัพย์สิน --</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.title_deed_number})
                  </option>
                ))}
              </select>
            </div>

            {/* ประเภททรัพย์สินเป้าหมาย (สำหรับโปรเจกต์สร้างใหม่) */}
            {formData.project_type === 'new_construction' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ประเภททรัพย์สินที่จะสร้าง <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {propertyTypeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, target_property_type: option.value }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        formData.target_property_type === option.value
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-xl mb-1">{option.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{option.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  เมื่อโปรเจกต์เสร็จสิ้น ระบบจะอัปเดตประเภททรัพย์สินโดยอัตโนมัติ
                </p>
              </div>
            )}

            {/* ชื่อโปรเจกต์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                ชื่อโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder={formData.project_type === 'renovation' ? 'เช่น ปรับปรุงห้องน้ำ, ทาสีใหม่' : 'เช่น สร้างบ้าน 2 ชั้น, สร้างทาวน์โฮม'}
              />
            </div>

            {/* วันที่เริ่ม และ วันที่สิ้นสุด */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  วันที่เริ่ม <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* งบประมาณ และ สถานะ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  งบประมาณ (บาท) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">
                    ฿
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  สถานะ <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
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
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                placeholder="รายละเอียดของโปรเจกต์..."
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
                className={`w-full sm:w-auto px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 ${
                  formData.project_type === 'renovation'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
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
                  'สร้างโปรเจกต์'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
