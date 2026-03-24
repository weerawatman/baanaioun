'use client';

import { useState } from 'react';
import { useLeads } from '@/features/leads/hooks/useLeads';
import { LeadWithAsset } from '@/features/leads/services/leadsService';
import { LeadStatus } from '@/types/database';
import { toast } from 'sonner';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: 'ใหม่',       className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  contacted: { label: 'ติดต่อแล้ว', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  closed:    { label: 'ปิดแล้ว',    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

function Cell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-warm-400 dark:text-warm-600">—</span>;
  return <>{value}</>;
}

interface LeadRowProps {
  lead: LeadWithAsset;
  index: number;
  onUpdateLead: (id: string, data: { status?: LeadStatus; admin_notes?: string | null }) => Promise<void>;
}

function LeadRow({ lead, index, onUpdateLead }: LeadRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [noteValue, setNoteValue] = useState(lead.admin_notes ?? '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const rowBg = index % 2 === 0 ? 'bg-white dark:bg-warm-900' : 'bg-warm-50 dark:bg-warm-800/50';

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as LeadStatus;
    try {
      await onUpdateLead(lead.id, { status: newStatus });
    } catch {
      toast.error('บันทึกสถานะไม่สำเร็จ');
    }
  };

  const handleNoteSave = async () => {
    const trimmed = noteValue.trim();
    if (trimmed === (lead.admin_notes ?? '').trim()) return;
    setIsSavingNote(true);
    try {
      await onUpdateLead(lead.id, { admin_notes: trimmed || null });
    } catch {
      toast.error('บันทึกโน้ตไม่สำเร็จ');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <>
      <tr className={rowBg}>
        <td className="px-4 py-3 text-sm text-warm-900 dark:text-warm-100 font-medium">
          {lead.customer_name}
        </td>
        <td className="px-4 py-3 text-sm text-warm-700 dark:text-warm-300">
          <Cell value={lead.customer_phone} />
        </td>
        <td className="px-4 py-3 text-sm text-warm-700 dark:text-warm-300">
          <Cell value={lead.customer_line_id} />
        </td>
        <td className="px-4 py-3 text-sm text-warm-700 dark:text-warm-300 max-w-[180px]">
          {lead.message ? (
            <span className="line-clamp-2">{lead.message}</span>
          ) : (
            <span className="text-warm-400 dark:text-warm-600">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-warm-700 dark:text-warm-300">
          <Cell value={lead.assets?.name ?? null} />
        </td>
        <td className="px-4 py-3 text-sm text-warm-500 dark:text-warm-400 whitespace-nowrap">
          {formatDate(lead.created_at)}
        </td>
        {/* Status dropdown */}
        <td className="px-4 py-3">
          <select
            value={lead.status ?? 'new'}
            onChange={handleStatusChange}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none ${STATUS_CONFIG[lead.status ?? 'new'].className}`}
          >
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </td>
        {/* Expand toggle for notes */}
        <td className="px-3 py-3">
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            title="โน้ต Admin"
            className={`p-1.5 rounded-lg transition-colors ${
              isExpanded || lead.admin_notes
                ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:hover:bg-warm-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </td>
      </tr>
      {/* Expanded notes row */}
      {isExpanded && (
        <tr className={rowBg}>
          <td colSpan={8} className="px-4 pb-3 pt-0">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={noteValue}
                onChange={e => setNoteValue(e.target.value)}
                onBlur={handleNoteSave}
                placeholder="บันทึกโน้ต Admin (บันทึกอัตโนมัติเมื่อคลิกออก)"
                className="flex-1 px-3 py-2 text-sm border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-shadow"
              />
              {isSavingNote && (
                <span className="text-xs text-warm-400 pb-2">กำลังบันทึก...</span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function LeadsPage() {
  const { leads, loading, error, refetch, updateLead } = useLeads();

  const counts = leads.reduce(
    (acc, l) => { acc[l.status ?? 'new']++; return acc; },
    { new: 0, contacted: 0, closed: 0 } as Record<LeadStatus, number>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">ลูกค้าที่สนใจ</h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">Leads</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-warm-300 dark:border-warm-700 rounded-xl text-warm-700 dark:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          รีเฟรช
        </button>
      </div>

      {/* Summary badges */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300">
            ทั้งหมด {leads.length} ราย
          </span>
          {counts.new > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG.new.className}`}>
              {STATUS_CONFIG.new.label} {counts.new}
            </span>
          )}
          {counts.contacted > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG.contacted.className}`}>
              {STATUS_CONFIG.contacted.label} {counts.contacted}
            </span>
          )}
          {counts.closed > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG.closed.className}`}>
              {STATUS_CONFIG.closed.label} {counts.closed}
            </span>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-warm-500 dark:text-warm-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>กำลังโหลด...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-sm">โหลดข้อมูลไม่สำเร็จ</p>
            <button onClick={refetch} className="text-sm text-primary-500 hover:underline">ลองใหม่</button>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-warm-400 dark:text-warm-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
            <p className="text-sm font-medium">ยังไม่มีลูกค้าที่สนใจ</p>
            <p className="text-xs">เมื่อมีคนกรอกฟอร์มสนใจ จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-warm-200 dark:border-warm-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">ชื่อลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">LINE ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">ข้อความ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">ทรัพย์สิน</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">วันที่</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">สถานะ</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">โน้ต</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 dark:divide-warm-800">
                {leads.map((lead, i) => (
                  <LeadRow key={lead.id} lead={lead} index={i} onUpdateLead={updateLead} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
