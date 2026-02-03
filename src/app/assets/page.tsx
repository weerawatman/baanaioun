'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Asset, PropertyType } from '@/types/database';
import AddAssetModal from '@/components/AddAssetModal';

const propertyTypeLabels: Record<PropertyType, string> = {
  land: 'ที่ดินเปล่า',
  house: 'บ้านเดี่ยว',
  semi_detached_house: 'บ้านแฝด',
  condo: 'คอนโดมิเนียม',
  townhouse: 'ทาวน์เฮาส์',
  commercial: 'อาคารพาณิชย์',
  other: 'อื่นๆ',
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ทรัพย์สิน</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการทรัพย์สินและอสังหาริมทรัพย์ของคุณ
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มทรัพย์สิน
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>กำลังโหลด...</p>
          </div>
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>ไม่พบทรัพย์สิน เพิ่มทรัพย์สินแรกของคุณเพื่อเริ่มต้นใช้งาน</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    เลขที่โฉนด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ชื่อ/ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ราคาซื้อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ราคาประเมิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ธนาคารจำนอง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ประกันอัคคีภัย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ภาษีที่ดิน
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => router.push(`/assets/${asset.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {asset.title_deed_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{asset.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {propertyTypeLabels[asset.property_type] || asset.property_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {formatCurrency(asset.purchase_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {asset.appraised_value ? formatCurrency(asset.appraised_value) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {asset.mortgage_bank ? (
                        <div>
                          <div className="text-gray-900 dark:text-white">{asset.mortgage_bank}</div>
                          {asset.mortgage_amount && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(asset.mortgage_amount)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={
                        asset.fire_insurance_expiry && new Date(asset.fire_insurance_expiry) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }>
                        {formatDate(asset.fire_insurance_expiry)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={
                        asset.land_tax_due_date && new Date(asset.land_tax_due_date) < new Date()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
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
      )}

      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAssets}
      />
    </div>
  );
}
