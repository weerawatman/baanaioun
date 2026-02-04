'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Asset, PropertyType } from '@/types/database';
import AddAssetModal from '@/components/AddAssetModal';

export const runtime = 'edge';

const propertyTypeLabels: Record<PropertyType, { label: string; icon: string }> = {
  land: { label: 'ที่ดินเปล่า', icon: '🏞️' },
  house: { label: 'บ้านเดี่ยว', icon: '🏠' },
  semi_detached_house: { label: 'บ้านแฝด', icon: '🏘️' },
  condo: { label: 'คอนโดมิเนียม', icon: '🏢' },
  townhouse: { label: 'ทาวน์เฮาส์', icon: '🏡' },
  commercial: { label: 'อาคารพาณิชย์', icon: '🏬' },
  other: { label: 'อื่นๆ', icon: '📦' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-900 dark:text-warm-50">ทรัพย์สิน</h1>
          <p className="text-sm md:text-base text-warm-600 dark:text-warm-400 mt-1">
            จัดการทรัพย์สินและอสังหาริมทรัพย์ของคุณ
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มทรัพย์สิน
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="p-6 text-center text-warm-500 dark:text-warm-400">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              กำลังโหลด...
            </div>
          </div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🏠</div>
            <p className="text-warm-500 dark:text-warm-400">ไม่พบทรัพย์สิน</p>
            <p className="text-sm text-warm-400 dark:text-warm-500 mt-1">เพิ่มทรัพย์สินแรกของคุณเพื่อเริ่มต้นใช้งาน</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => router.push(`/assets/${asset.id}`)}
                className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 cursor-pointer active:bg-warm-50 dark:active:bg-warm-800/50 transition-colors"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{propertyTypeLabels[asset.property_type]?.icon}</span>
                    <div>
                      <h3 className="font-semibold text-warm-900 dark:text-warm-50">{asset.name}</h3>
                      <p className="text-sm text-warm-500 dark:text-warm-400">
                        โฉนด: {asset.title_deed_number}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-lg bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400">
                    {propertyTypeLabels[asset.property_type]?.label}
                  </span>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-3">
                    <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">ราคาซื้อ</p>
                    <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm">
                      {formatCurrency(asset.purchase_price)}
                    </p>
                  </div>
                  <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-3">
                    <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">ราคาประเมิน</p>
                    <p className="font-semibold text-warm-900 dark:text-warm-50 text-sm">
                      {asset.appraised_value ? formatCurrency(asset.appraised_value) : '-'}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {asset.mortgage_bank && (
                    <span className="px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
                      {asset.mortgage_bank}
                    </span>
                  )}
                  {asset.fire_insurance_expiry && (
                    <span className={`px-2 py-1 rounded-lg ${
                      isExpired(asset.fire_insurance_expiry)
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400'
                    }`}>
                      ประกัน: {formatDate(asset.fire_insurance_expiry)}
                    </span>
                  )}
                  {asset.land_tax_due_date && (
                    <span className={`px-2 py-1 rounded-lg ${
                      isExpired(asset.land_tax_due_date)
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400'
                    }`}>
                      ภาษี: {formatDate(asset.land_tax_due_date)}
                    </span>
                  )}
                </div>

                {/* Chevron indicator */}
                <div className="flex justify-end mt-3">
                  <svg className="w-5 h-5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-warm-50 dark:bg-warm-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      เลขที่โฉนด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ชื่อ/ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ราคาซื้อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ราคาประเมิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ธนาคารจำนอง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ประกันอัคคีภัย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ภาษีที่ดิน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200 dark:divide-warm-800">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      className="hover:bg-warm-50 dark:hover:bg-warm-800/50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-warm-900 dark:text-warm-50">
                          {asset.title_deed_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{propertyTypeLabels[asset.property_type]?.icon}</span>
                          <div>
                            <div className="text-warm-900 dark:text-warm-50">{asset.name}</div>
                            <div className="text-sm text-warm-500 dark:text-warm-400">
                              {propertyTypeLabels[asset.property_type]?.label || asset.property_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-warm-900 dark:text-warm-50">
                        {formatCurrency(asset.purchase_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-warm-900 dark:text-warm-50">
                        {asset.appraised_value ? formatCurrency(asset.appraised_value) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {asset.mortgage_bank ? (
                          <div>
                            <div className="text-warm-900 dark:text-warm-50">{asset.mortgage_bank}</div>
                            {asset.mortgage_amount && (
                              <div className="text-sm text-warm-500 dark:text-warm-400">
                                {formatCurrency(asset.mortgage_amount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-warm-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={
                          isExpired(asset.fire_insurance_expiry)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-warm-900 dark:text-warm-50'
                        }>
                          {formatDate(asset.fire_insurance_expiry)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={
                          isExpired(asset.land_tax_due_date)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-warm-900 dark:text-warm-50'
                        }>
                          {formatDate(asset.land_tax_due_date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAssets}
      />
    </div>
  );
}
