'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Asset, PropertyType, AssetStatus } from '@/types/database';

// Dynamic import for modal - loads only when needed
const AddAssetModal = dynamic(() => import('@/components/AddAssetModal'), {
  loading: () => null,
});

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

const assetStatusLabels: Record<AssetStatus, { label: string; color: string }> = {
  developing: { label: 'ว่างรอการพัฒนา', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  ready_for_sale: { label: 'พร้อมขาย', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  ready_for_rent: { label: 'พร้อมเช่า', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  rented: { label: 'มีคนเช่าอยู่', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  sold: { label: 'ขายไปแล้ว', color: 'bg-warm-200 text-warm-700 dark:bg-warm-700 dark:text-warm-300' },
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
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchAssets = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          title_deed_number,
          property_type,
          status,
          purchase_price,
          appraised_value,
          mortgage_bank,
          mortgage_amount,
          fire_insurance_expiry,
          land_tax_due_date,
          tenant_name,
          tenant_contact,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        // Could add toast notification here
      } else {
        setAssets(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    // Load view preference from localStorage
    const savedView = localStorage.getItem('assetsViewMode');
    if (savedView === 'card' || savedView === 'table') {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'card' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('assetsViewMode', mode);
  };

  // Filter assets based on status (memoized to prevent unnecessary recalculations)
  const filteredAssets = useMemo(() => {
    return statusFilter === 'all'
      ? assets
      : assets.filter(asset => asset.status === statusFilter);
  }, [assets, statusFilter]);

  // Pagination (memoized)
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, currentPage]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Count assets by status (memoized)
  const statusCounts = useMemo(() => ({
    all: assets.length,
    developing: assets.filter(a => a.status === 'developing').length,
    ready_for_sale: assets.filter(a => a.status === 'ready_for_sale').length,
    ready_for_rent: assets.filter(a => a.status === 'ready_for_rent').length,
    rented: assets.filter(a => a.status === 'rented').length,
    sold: assets.filter(a => a.status === 'sold').length,
  }), [assets]);

  // Handle edit asset (memoized to prevent recreation on every render)
  const handleEditAsset = useCallback((asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    setEditingAsset(asset);
    setIsModalOpen(true);
  }, []);

  // Handle close modal (memoized)
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingAsset(null);
    // Refresh assets list without showing loading spinner
    fetchAssets(false);
  }, [fetchAssets]);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-warm-900 dark:text-warm-50">ทรัพย์สิน</h1>
            <p className="text-sm md:text-base text-warm-600 dark:text-warm-400 mt-1">
              จัดการทรัพย์สินและอสังหาริมทรัพย์ของคุณ
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-warm-100 dark:bg-warm-800 rounded-xl p-1">
              <button
                onClick={() => handleViewModeChange('card')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'card'
                  ? 'bg-white dark:bg-warm-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('table')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'table'
                  ? 'bg-white dark:bg-warm-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มทรัพย์สิน
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            ทั้งหมด ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('developing')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'developing'
              ? 'bg-yellow-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            ว่างรอการพัฒนา ({statusCounts.developing})
          </button>
          <button
            onClick={() => setStatusFilter('ready_for_sale')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'ready_for_sale'
              ? 'bg-green-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            พร้อมขาย ({statusCounts.ready_for_sale})
          </button>
          <button
            onClick={() => setStatusFilter('ready_for_rent')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'ready_for_rent'
              ? 'bg-blue-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            พร้อมเช่า ({statusCounts.ready_for_rent})
          </button>
          <button
            onClick={() => setStatusFilter('rented')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'rented'
              ? 'bg-red-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            มีคนเช่าอยู่ ({statusCounts.rented})
          </button>
          <button
            onClick={() => setStatusFilter('sold')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'sold'
              ? 'bg-warm-500 text-white'
              : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
              }`}
          >
            ขายไปแล้ว ({statusCounts.sold})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 animate-pulse"
            >
              {/* Header skeleton */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-warm-200 dark:bg-warm-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-warm-200 dark:bg-warm-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-warm-200 dark:bg-warm-700 rounded-lg"></div>
              </div>

              {/* Status badge skeleton */}
              <div className="h-6 w-24 bg-warm-200 dark:bg-warm-700 rounded-full mb-3"></div>

              {/* Price skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/3"></div>
                <div className="h-6 bg-warm-200 dark:bg-warm-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🏠</div>
            <p className="text-warm-500 dark:text-warm-400">
              {statusFilter === 'all' ? 'ไม่พบทรัพย์สิน' : `ไม่พบทรัพย์สินที่มีสถานะ "${assetStatusLabels[statusFilter as AssetStatus]?.label}"`}
            </p>
            <p className="text-sm text-warm-400 dark:text-warm-500 mt-1">
              {statusFilter === 'all' ? 'เพิ่มทรัพย์สินแรกของคุณเพื่อเริ่มต้นใช้งาน' : 'ลองเลือกตัวกรองอื่นหรือเพิ่มทรัพย์สินใหม่'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => router.push(`/assets/${asset.id}`)}
                  className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 cursor-pointer active:bg-warm-50 dark:active:bg-warm-800/50 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{propertyTypeLabels[asset.property_type]?.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-warm-900 dark:text-warm-50">{asset.name}</h3>
                        <p className="text-sm text-warm-500 dark:text-warm-400">
                          โฉนด: {asset.title_deed_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditAsset(asset, e)}
                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors group"
                        title="แก้ไข"
                      >
                        <svg className="w-4 h-4 text-warm-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <span className="px-2 py-1 text-xs font-medium rounded-lg bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400">
                        {propertyTypeLabels[asset.property_type]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assetStatusLabels[asset.status]?.color}`}>
                      {assetStatusLabels[asset.status]?.label}
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
                      <span className={`px-2 py-1 rounded-lg ${isExpired(asset.fire_insurance_expiry)
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400'
                        }`}>
                        ประกัน: {formatDate(asset.fire_insurance_expiry)}
                      </span>
                    )}
                    {asset.land_tax_due_date && (
                      <span className={`px-2 py-1 rounded-lg ${isExpired(asset.land_tax_due_date)
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
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden">
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
                        สถานะ
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200 dark:divide-warm-800">
                    {paginatedAssets.map((asset) => (
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assetStatusLabels[asset.status]?.color}`}>
                            {assetStatusLabels[asset.status]?.label}
                          </span>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => handleEditAsset(asset, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            แก้ไข
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && filteredAssets.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← ก่อนหน้า
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-xl transition-colors ${currentPage === page
                    ? 'bg-primary-500 text-white'
                    : 'bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ถัดไป →
          </button>
        </div>
      )}

      <AddAssetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchAssets}
        asset={editingAsset}
        mode={editingAsset ? 'edit' : 'add'}
      />
    </div>
  );
}
