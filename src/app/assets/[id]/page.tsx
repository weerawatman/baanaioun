'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Asset, AssetImage, PropertyType, ImageCategory } from '@/types/database';
import Link from 'next/link';

const propertyTypeLabels: Record<PropertyType, string> = {
  land: 'ที่ดินเปล่า',
  house: 'บ้านเดี่ยว',
  semi_detahed_house: 'บ้านแฝด',
  condo: 'คอนโดมิเนียม',
  townhouse: 'ทาวน์เฮาส์',
  commercial: 'อาคารพาณิชย์',
  other: 'อื่นๆ',
};

const imageCategoryLabels: Record<ImageCategory, { label: string; color: string }> = {
  purchase: { label: 'รูปตอนซื้อ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  before_renovation: { label: 'ก่อนรีโนเวท', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  after_renovation: { label: 'หลังรีโนเวท', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
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
    month: 'long',
    day: 'numeric',
  });
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [images, setImages] = useState<AssetImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('purchase');
  const [activeTab, setActiveTab] = useState<ImageCategory | 'all'>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchAsset = useCallback(async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('Error fetching asset:', error);
      router.push('/assets');
    } else {
      setAsset(data);
    }
  }, [assetId, router]);

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from('asset_images')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
    } else {
      setImages(data || []);
    }
  }, [assetId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAsset(), fetchImages()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAsset, fetchImages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${assetId}/${selectedCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('asset-files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`ไม่สามารถอัปโหลด ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('asset-files')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase.from('asset_images').insert({
          asset_id: assetId,
          url: publicUrl,
          category: selectedCategory,
          is_primary: images.length === 0,
        });

        if (dbError) {
          console.error('Database error:', dbError);
          alert(`ไม่สามารถบันทึกข้อมูล: ${dbError.message}`);
        }
      }

      // Refresh images
      await fetchImages();
    } catch (err) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (image: AssetImage) => {
    if (!confirm('ต้องการลบรูปภาพนี้หรือไม่?')) return;

    try {
      // Extract file path from URL
      const urlParts = image.url.split('/asset-files/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('asset-files').remove([filePath]);
      }

      // Delete from database
      await supabase.from('asset_images').delete().eq('id', image.id);

      // Refresh images
      await fetchImages();
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  };

  const filteredImages = activeTab === 'all'
    ? images
    : images.filter(img => img.category === activeTab);

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>กำลังโหลด...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>ไม่พบทรัพย์สิน</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/assets"
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับไปรายการทรัพย์สิน
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{asset.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              เลขที่โฉนด: {asset.title_deed_number} | {propertyTypeLabels[asset.property_type]}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Asset Details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ข้อมูลทรัพย์สิน</h2>

            <dl className="space-y-4">
              {asset.address && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">ที่อยู่</dt>
                  <dd className="text-gray-900 dark:text-white">{asset.address}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">ราคาซื้อ</dt>
                <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(asset.purchase_price)}</dd>
              </div>
              {asset.purchase_date && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">วันที่ซื้อ</dt>
                  <dd className="text-gray-900 dark:text-white">{formatDate(asset.purchase_date)}</dd>
                </div>
              )}
              {asset.appraised_value && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">ราคาประเมิน</dt>
                  <dd className="text-gray-900 dark:text-white font-medium">{formatCurrency(asset.appraised_value)}</dd>
                </div>
              )}
              {asset.mortgage_bank && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">ธนาคารจำนอง</dt>
                  <dd className="text-gray-900 dark:text-white">{asset.mortgage_bank}</dd>
                  {asset.mortgage_amount && (
                    <dd className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(asset.mortgage_amount)}</dd>
                  )}
                </div>
              )}
              {asset.fire_insurance_expiry && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">วันหมดอายุประกันอัคคีภัย</dt>
                  <dd className={new Date(asset.fire_insurance_expiry) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                    {formatDate(asset.fire_insurance_expiry)}
                  </dd>
                </div>
              )}
              {asset.land_tax_due_date && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">กำหนดจ่ายภาษีที่ดิน</dt>
                  <dd className={new Date(asset.land_tax_due_date) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                    {formatDate(asset.land_tax_due_date)}
                  </dd>
                </div>
              )}
              {asset.notes && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">หมายเหตุ</dt>
                  <dd className="text-gray-900 dark:text-white whitespace-pre-wrap">{asset.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Images Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">รูปภาพ</h2>

              {/* Upload Section */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ImageCategory)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.entries(imageCategoryLabels) as [ImageCategory, { label: string }][]).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      อัปโหลดรูป
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ทั้งหมด ({images.length})
              </button>
              {(Object.entries(imageCategoryLabels) as [ImageCategory, { label: string; color: string }][]).map(([key, { label }]) => {
                const count = images.filter(img => img.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Images Grid */}
            {filteredImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium mb-2">ยังไม่มีรูปภาพ</p>
                <p className="text-sm">เลือกประเภทและอัปโหลดรูปภาพของทรัพย์สิน</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                      onClick={() => setLightboxImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.caption || 'Asset image'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium ${imageCategoryLabels[image.category]?.color}`}>
                      {imageCategoryLabels[image.category]?.label}
                    </span>
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
