'use client';

export const runtime = 'edge';

import { useEffect, useState, use, useRef } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { PublicAsset, ImageCategory } from '@/types/database';
import Link from 'next/link';
import { parseLatLong } from '@/shared/utils/geo';
import { formatCurrency, PROPERTY_TYPE_LABELS, IMAGE_CATEGORY_LABELS } from '@/shared/utils';
import { env } from '@/config/env';



interface PublicImage {
  id: string;
  asset_id: string;
  url: string;
  caption?: string | null;
  is_primary: boolean;
  category: ImageCategory;
  created_at: string;
}

const contactFormSchema = z.object({
  customer_name: z.string().min(2, 'กรุณากรอกชื่อ (อย่างน้อย 2 ตัวอักษร)').max(100, 'ชื่อยาวเกินไป'),
  customer_phone: z.string().optional().refine(val => !val || /^[0-9]{9,10}$/.test(val), 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'),
  customer_line_id: z.string().max(50, 'LINE ID ยาวเกินไป').optional(),
  message: z.string().max(1000, 'ข้อความยาวเกินไป').optional(),
}).refine(data => data.customer_phone || data.customer_line_id, {
  message: 'กรุณากรอกเบอร์โทรหรือ LINE ID อย่างน้อย 1 ช่องทาง',
  path: ['customer_phone'],
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asset, setAsset] = useState<PublicAsset | null>(null);
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Contact form state
  type FormState = { success: boolean; errors?: Record<string, string>; message?: string } | null;
  const [formState, setFormState] = useState<FormState>(null);
  const [isPending, setIsPending] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [isTurnstileScriptLoaded, setIsTurnstileScriptLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors: fieldErrors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  // Render Turnstile imperatively once the script is loaded AND the form container is mounted
  useEffect(() => {
    if (!isTurnstileScriptLoaded || !turnstileContainerRef.current || turnstileWidgetId.current !== null) return;
    if (!window.turnstile) return;
    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: env.turnstile.siteKey,
      theme: 'auto',
      size: 'flexible',
    });
  }, [isTurnstileScriptLoaded, loading]); // re-check when page finishes loading (form becomes visible)

  const onFormSubmit = async (data: ContactFormData) => {
    setIsPending(true);
    setFormState(null);
    try {
      // Get Turnstile token
      const turnstileResponse = turnstileWidgetId.current
        ? window.turnstile?.getResponse(turnstileWidgetId.current)
        : null;

      if (!turnstileResponse && !env.app.isDev) {
        setFormState({ success: false, message: 'กรุณายืนยันตัวตน (Captcha)' });
        setIsPending(false);
        return;
      }

      const formData = new FormData();
      formData.set('asset_id', id);
      formData.set('customer_name', data.customer_name);
      formData.set('customer_phone', data.customer_phone || '');
      formData.set('customer_line_id', data.customer_line_id || '');
      formData.set('message', data.message || '');
      if (turnstileResponse) formData.set('cf-turnstile-response', turnstileResponse);

      const res = await fetch('/api/submit-lead', { method: 'POST', body: formData });
      const result = await res.json() as FormState;
      setFormState(result);

      if (result?.success) {
        reset();
      }
    } catch {
      setFormState({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsPending(false);
      // Reset Turnstile widget so user can submit again if needed
      if (turnstileWidgetId.current !== null && typeof window !== 'undefined' && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [assetResult, imagesResult] = await Promise.all([
          supabase.from('public_assets').select('*').eq('id', id).single(),
          supabase
            .from('public_asset_images')
            .select('*')
            .eq('asset_id', id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true }),
        ]);

        if (assetResult.error || !assetResult.data) {
          setNotFound(true);
          return;
        }

        setAsset(assetResult.data);
        setImages((imagesResult.data as PublicImage[]) || []);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching listing details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImage(images[index].url);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? (currentImageIndex + 1) % images.length
        : (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex].url);
  };

  if (loading) {
    return (
      <div className="bg-warm-50 dark:bg-warm-950 min-h-screen">
        {/* Skeleton Header */}
        <div className="bg-white dark:bg-warm-900 border-b border-warm-200 dark:border-warm-800 h-14" />
        {/* Skeleton Hero */}
        <div className="w-full h-[60vh] bg-warm-200 dark:bg-warm-800 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="h-10 bg-warm-200 dark:bg-warm-800 rounded-xl w-2/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-warm-200 dark:bg-warm-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-warm-200 dark:bg-warm-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="bg-warm-50 dark:bg-warm-950 min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">🏚️</div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">ไม่พบประกาศ</h1>
          <p className="text-warm-500 dark:text-warm-400 mb-6">
            ประกาศนี้อาจถูกลบหรือไม่พร้อมให้บริการแล้ว
          </p>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับไปหน้าประกาศ
          </Link>
        </div>
      </div>
    );
  }

  const coords = parseLatLong(asset.location_lat_long);
  const googleMapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : null;

  const heroImage = images.length > 0 ? images[0] : null;
  const galleryImages = images.length > 1 ? images.slice(1) : [];

  return (
    <div className="bg-warm-50 dark:bg-warm-950 min-h-screen">
      {/* Load Turnstile after hydration so the widget container is guaranteed
          to be in the DOM. afterInteractive avoids the "unused preload" warning
          that lazyOnload can trigger when idle-loading is deferred too long. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setIsTurnstileScriptLoaded(true)}
      />
      {/* Header */}
      <header className="bg-white dark:bg-warm-900 border-b border-warm-200 dark:border-warm-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/listings"
            className="flex items-center gap-2 text-warm-600 dark:text-warm-300 hover:text-primary-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">ประกาศทั้งหมด</span>
          </Link>
          <Link href="/listings" className="text-primary-500 font-bold text-lg">
            Baanaioun
          </Link>
        </div>
      </header>

      {/* Hero image */}
      <div className="relative w-full overflow-hidden bg-warm-200 dark:bg-warm-800">
        {heroImage ? (
          <div
            className="relative w-full max-h-[65vh] md:max-h-[70vh] flex justify-center cursor-pointer overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={heroImage.url}
              alt={heroImage.caption || asset.name}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Image count overlay */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
                className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 text-white rounded-xl text-sm font-medium backdrop-blur-sm flex items-center gap-2 hover:bg-black/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ดูรูปทั้งหมด ({images.length})
              </button>
            )}

            {/* Scroll Cue */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/80 animate-bounce pointer-events-none">
              <span className="text-[10px] font-medium uppercase tracking-widest">เลื่อนดูข้อมูล</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="w-full h-[40vh] bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
            <div className="text-center text-warm-400 dark:text-warm-600">
              <svg className="w-20 h-20 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">รอการอัปเดตรูปภาพ</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & type */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 mb-3">
                {PROPERTY_TYPE_LABELS[asset.property_type]?.icon}{' '}
                {PROPERTY_TYPE_LABELS[asset.property_type]?.label}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-warm-900 dark:text-warm-50 mt-2">
                {asset.name}
              </h1>

              {/* Address */}
              {asset.address && (
                <p className="text-warm-500 dark:text-warm-400 mt-2 flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {asset.address}
                </p>
              )}
            </div>

            {/* Price cards */}
            <div className="flex flex-wrap gap-4">
              {asset.selling_price != null && asset.selling_price > 0 && (
                <div className="flex-1 min-w-[180px] bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5">
                  <p className="text-sm text-warm-500 dark:text-warm-400 mb-1">ราคาขาย</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary-500">
                    {formatCurrency(asset.selling_price)}
                  </p>
                </div>
              )}
              {asset.rental_price != null && asset.rental_price > 0 && (
                <div className="flex-1 min-w-[180px] bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5">
                  <p className="text-sm text-warm-500 dark:text-warm-400 mb-1">ค่าเช่า / เดือน</p>
                  <p className="text-2xl md:text-3xl font-bold text-sage-500">
                    {formatCurrency(asset.rental_price)}
                  </p>
                </div>
              )}
              {(!asset.selling_price || asset.selling_price <= 0) &&
                (!asset.rental_price || asset.rental_price <= 0) && (
                  <div className="flex-1 bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5">
                    <p className="text-sm text-warm-500 dark:text-warm-400 mb-1">ราคา</p>
                    <p className="text-xl font-semibold text-warm-600 dark:text-warm-300 italic">
                      สอบถามราคา
                    </p>
                  </div>
                )}
            </div>

            {/* Description */}
            {asset.description && (
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-3">
                  รายละเอียด
                </h2>
                <p className="text-warm-700 dark:text-warm-300 leading-relaxed whitespace-pre-line">
                  {asset.description}
                </p>
              </div>
            )}

            {/* Location */}
            {googleMapsUrl && (
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-3">
                  ตำแหน่งที่ตั้ง
                </h2>
                {asset.address && (
                  <p className="text-sm text-warm-500 dark:text-warm-400 mb-4">
                    {asset.address}
                  </p>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 rounded-xl transition-colors text-warm-900 dark:text-warm-50 font-medium"
                >
                  <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <div>
                    <div className="text-sm">เปิดใน Google Maps</div>
                    <div className="text-xs text-warm-500 dark:text-warm-400">
                      {coords!.lat.toFixed(6)}, {coords!.lng.toFixed(6)}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-warm-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

            {/* Image gallery */}
            {galleryImages.length > 0 && (
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">
                  รูปภาพทั้งหมด ({images.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer"
                      onClick={() => openLightbox(index)}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-warm-100 dark:bg-warm-800 relative">
                        <Image
                          src={image.url}
                          alt={image.caption || `รูปที่ ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      {image.caption && (
                        <p className="text-xs text-warm-500 dark:text-warm-400 mt-1.5 truncate">
                          {image.caption}
                        </p>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded bg-black/50 text-white backdrop-blur-sm">
                        {IMAGE_CATEGORY_LABELS[image.category]?.label || image.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Contact form (sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 p-5 md:p-6">
                <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-1">
                  สนใจทรัพย์สินนี้?
                </h2>
                <p className="text-sm text-warm-500 dark:text-warm-400 mb-5">
                  กรอกข้อมูลเพื่อให้เราติดต่อกลับ
                </p>

                {formState?.success ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-sage-50 dark:bg-sage-900/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-1">
                      ส่งข้อมูลสำเร็จ
                    </h3>
                    <p className="text-sm text-warm-500 dark:text-warm-400 mb-4">
                      {formState.message}
                    </p>
                    <button
                      onClick={() => {
                        setFormState(null);
                      }}
                      className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                    >
                      ส่งข้อความอีกครั้ง
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    {/* General error */}
                    {formState && !formState.success && formState.message && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {formState.message}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                        ชื่อ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('customer_name')}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow ${fieldErrors.customer_name
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-warm-300 dark:border-warm-700'
                          }`}
                        placeholder="ชื่อ-นามสกุล"
                      />
                      {fieldErrors.customer_name && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{fieldErrors.customer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        {...register('customer_phone')}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow ${fieldErrors.customer_phone
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-warm-300 dark:border-warm-700'
                          }`}
                        placeholder="0812345678"
                      />
                      {fieldErrors.customer_phone && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{fieldErrors.customer_phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                        LINE ID
                      </label>
                      <input
                        type="text"
                        {...register('customer_line_id')}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow ${fieldErrors.customer_line_id
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-warm-300 dark:border-warm-700'
                          }`}
                        placeholder="@line_id"
                      />
                      {fieldErrors.customer_line_id && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{fieldErrors.customer_line_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                        ข้อความ
                      </label>
                      <textarea
                        {...register('message')}
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none ${fieldErrors.message
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-warm-300 dark:border-warm-700'
                          }`}
                        placeholder="สนใจดูทรัพย์สิน, ต้องการข้อมูลเพิ่มเติม..."
                      />
                      {fieldErrors.message && (
                        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{fieldErrors.message.message}</p>
                      )}
                    </div>

                    {/* Cloudflare Turnstile */}
                    <div ref={turnstileContainerRef} className="cf-turnstile-wrapper w-full" />

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full px-6 py-3.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {isPending ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          ส่งข้อมูลติดต่อ
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-warm-200 dark:border-warm-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-warm-400 dark:text-warm-500">
          Baanaioun - Property Management
        </div>
      </footer>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors z-10"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 text-white text-sm rounded-lg backdrop-blur-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImage}
              alt={`รูปที่ ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Caption */}
          {images[currentImageIndex]?.caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm max-w-sm text-center">
              {images[currentImageIndex].caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
