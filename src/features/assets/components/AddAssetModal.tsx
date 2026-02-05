'use client';

import { useState } from 'react';
import { Asset, PropertyType, AssetStatus } from '@/types/database';
import MapPickerDynamic from '@/shared/components/MapPickerDynamic';
import { PROPERTY_TYPE_OPTIONS, ASSET_STATUS_OPTIONS } from '@/shared/utils';
import { Spinner } from '@/shared/components/ui';
import { useAssetMutations } from '@/features/assets/hooks/useAssetMutations';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset?: Asset | null;
  mode?: 'add' | 'edit';
}

export default function AddAssetModal({ isOpen, onClose, onSuccess, asset, mode = 'add' }: AddAssetModalProps) {
  const { createAsset, updateAsset, creating, updating, error: mutationError } = useAssetMutations();
  const loading = creating || updating;
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title_deed_number: asset?.title_deed_number || '',
    name: asset?.name || '',
    address: asset?.address || '',
    property_type: (asset?.property_type || 'land') as PropertyType,
    status: (asset?.status || 'developing') as AssetStatus,
    purchase_price: asset?.purchase_price?.toString() || '',
    appraised_value: asset?.appraised_value?.toString() || '',
    mortgage_bank: asset?.mortgage_bank || '',
    mortgage_amount: asset?.mortgage_amount?.toString() || '',
    location_lat_long: asset?.location_lat_long || '',
    fire_insurance_expiry: asset?.fire_insurance_expiry || '',
    land_tax_due_date: asset?.land_tax_due_date || '',
    notes: asset?.notes || '',
    tenant_name: asset?.tenant_name || '',
    tenant_contact: asset?.tenant_contact || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dataToSave = {
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
      location_lat_long: formData.location_lat_long || null,
      notes: formData.notes || null,
      status: formData.status,
      tenant_name: formData.status === 'rented' ? (formData.tenant_name || null) : null,
      tenant_contact: formData.status === 'rented' ? (formData.tenant_contact || null) : null,
    };

    let result;
    if (mode === 'edit' && asset) {
      result = await updateAsset(asset.id, dataToSave);
    } else {
      result = await createAsset(dataToSave);
    }

    if (result) {
      setFormData({
        title_deed_number: '',
        name: '',
        address: '',
        property_type: 'land',
        status: 'developing',
        purchase_price: '',
        appraised_value: '',
        mortgage_bank: '',
        mortgage_amount: '',
        location_lat_long: '',
        fire_insurance_expiry: '',
        land_tax_due_date: '',
        notes: '',
        tenant_name: '',
        tenant_contact: '',
      });

      onSuccess();
      onClose();
    } else if (mutationError) {
      setError(mutationError.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-warm-900 w-full md:max-w-2xl md:mx-4 md:rounded-2xl shadow-xl max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 px-4 py-4 md:px-6 border-b border-warm-200 dark:border-warm-800">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-warm-900 dark:text-warm-50">
              {mode === 'edit' ? 'แก้ไขทรัพย์สิน' : 'เพิ่มทรัพย์สินใหม่'}
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
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Section: ข้อมูลทรัพย์สิน */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                ข้อมูลทรัพย์สิน
              </h3>

              {/* เลขที่โฉนด */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  เลขที่โฉนด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title_deed_number"
                  value={formData.title_deed_number}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="เช่น 12345"
                />
              </div>

              {/* ชื่อทรัพย์สิน */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  ชื่อทรัพย์สิน
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="เช่น บ้านพักตากอากาศ"
                />
                <p className="mt-1 text-xs text-warm-500 dark:text-warm-400">
                  หากไม่ระบุ จะใช้เลขที่โฉนดแทน
                </p>
              </div>

              {/* ประเภททรัพย์สิน - Grid of buttons */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                  ประเภททรัพย์สิน <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PROPERTY_TYPE_OPTIONS.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, property_type: type.value }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.property_type === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 dark:hover:border-warm-600 text-warm-600 dark:text-warm-400'
                        }`}
                    >
                      <span className="text-xl mb-1">{type.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* สถานะ */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                >
                  {ASSET_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* ที่อยู่ */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  ที่อยู่
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  placeholder="ที่ตั้งทรัพย์สิน"
                />
              </div>

              {/* ตำแหน่งบนแผนที่ */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                  ตำแหน่งบนแผนที่
                </label>
                <MapPickerDynamic
                  value={formData.location_lat_long || null}
                  onChange={(val) => setFormData(prev => ({ ...prev, location_lat_long: val || '' }))}
                />
              </div>
            </div>

            {/* Section: มูลค่าและการเงิน */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                มูลค่าและการเงิน
              </h3>

              {/* ราคาซื้อ และ ราคาประเมิน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    ราคาซื้อ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 dark:text-warm-500 text-sm">
                      ฿
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    ราคาประเมิน (บาท)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="appraised_value"
                      value={formData.appraised_value}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 dark:text-warm-500 text-sm">
                      ฿
                    </span>
                  </div>
                </div>
              </div>

              {/* ธนาคารจำนอง และ วงเงินจำนอง */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    ธนาคารจำนอง
                  </label>
                  <input
                    type="text"
                    name="mortgage_bank"
                    value={formData.mortgage_bank}
                    onChange={handleChange}
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    placeholder="เช่น ธนาคารกสิกรไทย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    วงเงินจำนอง (บาท)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      name="mortgage_amount"
                      value={formData.mortgage_amount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 dark:text-warm-500 text-sm">
                      ฿
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: วันที่สำคัญ */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                วันที่สำคัญ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    วันหมดอายุประกันอัคคีภัย
                  </label>
                  <input
                    type="date"
                    name="fire_insurance_expiry"
                    value={formData.fire_insurance_expiry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                    กำหนดจ่ายภาษีที่ดิน
                  </label>
                  <input
                    type="date"
                    name="land_tax_due_date"
                    value={formData.land_tax_due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Section: ข้อมูลผู้เช่า - Show only when status is 'rented' */}
            {formData.status === 'rented' && (
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                  ข้อมูลผู้เช่า
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                      ชื่อผู้เช่า <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tenant_name"
                      value={formData.tenant_name}
                      onChange={handleChange}
                      required={formData.status === 'rented'}
                      autoComplete="off"
                      className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="ชื่อ-นามสกุล ผู้เช่า"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                      เบอร์ติดต่อผู้เช่า
                    </label>
                    <input
                      type="text"
                      name="tenant_contact"
                      value={formData.tenant_contact}
                      onChange={handleChange}
                      autoComplete="tel"
                      className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                      placeholder="เบอร์โทร / อีเมล"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section: หมายเหตุ */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                หมายเหตุ
              </h3>

              <div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
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
