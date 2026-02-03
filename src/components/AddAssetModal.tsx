'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PropertyType } from '@/types/database';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'land', label: 'ที่ดินเปล่า' },
  { value: 'house', label: 'บ้านเดี่ยว' },
  { value: 'condo', label: 'คอนโดมิเนียม' },
  { value: 'townhouse', label: 'ทาวน์เฮาส์' },
  { value: 'commercial', label: 'อาคารพาณิชย์' },
  { value: 'other', label: 'อื่นๆ' },
];

export default function AddAssetModal({ isOpen, onClose, onSuccess }: AddAssetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title_deed_number: '',
    name: '',
    address: '',
    property_type: 'land' as PropertyType,
    purchase_price: '',
    appraised_value: '',
    mortgage_bank: '',
    mortgage_amount: '',
    fire_insurance_expiry: '',
    land_tax_due_date: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('assets').insert({
        title_deed_number: formData.title_deed_number,
        name: formData.name || formData.title_deed_number,
        address: formData.address || null,
        property_type: formData.property_type,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        appraised_value: formData.appraised_value ? parseFloat(formData.appraised_value) : null,
        mortgage_bank: formData.mortgage_bank || null,
        mortgage_amount: formData.mortgage_amount ? parseFloat(formData.mortgage_amount) : null,
        fire_insurance_expiry: formData.fire_insurance_expiry || null,
        land_tax_due_date: formData.land_tax_due_date || null,
        notes: formData.notes || null,
        status: 'owned',
      });

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        title_deed_number: '',
        name: '',
        address: '',
        property_type: 'land',
        purchase_price: '',
        appraised_value: '',
        mortgage_bank: '',
        mortgage_amount: '',
        fire_insurance_expiry: '',
        land_tax_due_date: '',
        notes: '',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              เพิ่มทรัพย์สินใหม่
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* เลขที่โฉนด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เลขที่โฉนด <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title_deed_number"
                value={formData.title_deed_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น 12345"
              />
            </div>

            {/* ชื่อทรัพย์สิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ชื่อทรัพย์สิน
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น บ้านพักตากอากาศ"
              />
            </div>

            {/* ประเภททรัพย์สิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ประเภททรัพย์สิน <span className="text-red-500">*</span>
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ที่อยู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ที่อยู่
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ที่ตั้งทรัพย์สิน"
              />
            </div>

            {/* ราคาซื้อ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ราคาซื้อ (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* ราคาประเมิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ราคาประเมิน (บาท)
              </label>
              <input
                type="number"
                name="appraised_value"
                value={formData.appraised_value}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* ธนาคารจำนอง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ธนาคารจำนอง
              </label>
              <input
                type="text"
                name="mortgage_bank"
                value={formData.mortgage_bank}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น ธนาคารกสิกรไทย"
              />
            </div>

            {/* วงเงินจำนอง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วงเงินจำนอง (บาท)
              </label>
              <input
                type="number"
                name="mortgage_amount"
                value={formData.mortgage_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* วันหมดอายุประกันอัคคีภัย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วันหมดอายุประกันอัคคีภัย
              </label>
              <input
                type="date"
                name="fire_insurance_expiry"
                value={formData.fire_insurance_expiry}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* กำหนดจ่ายภาษีที่ดิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                กำหนดจ่ายภาษีที่ดิน
              </label>
              <input
                type="date"
                name="land_tax_due_date"
                value={formData.land_tax_due_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              หมายเหตุ
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
