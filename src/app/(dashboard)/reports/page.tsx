'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset, Income, Expense, ExpenseCategory } from '@/types/database';
import AddIncomeModal from '@/features/income/components/AddIncomeModal';

interface AssetFinancialSummary {
  asset: Asset;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  incomeBySource: Record<string, number>;
  expensesByCategory: Record<ExpenseCategory, number>;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  materials: 'ค่าวัสดุ',
  labor: 'ค่าแรง',
  service: 'ค่าบริการช่าง',
  electricity: 'ค่าไฟฟ้า',
  land_filling: 'ถมดิน',
  building_permit: 'ขออนุญาต',
  foundation: 'งานฐานราก',
  architect_fee: 'ค่าสถาปนิก',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toFixed(0);
}

export default function ReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const [assetsRes, incomesRes, expensesRes] = await Promise.all([
      supabase.from('assets').select('*').order('name'),
      supabase.from('incomes').select('*'),
      supabase.from('expenses').select('*'),
    ]);

    if (assetsRes.data) setAssets(assetsRes.data);
    if (incomesRes.data) setIncomes(incomesRes.data);
    if (expensesRes.data) setExpenses(expensesRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assetSummaries = useMemo((): AssetFinancialSummary[] => {
    return assets.map(asset => {
      const assetIncomes = incomes.filter(i => i.asset_id === asset.id);
      const assetExpenses = expenses.filter(e => e.asset_id === asset.id);

      const totalIncome = assetIncomes.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = assetExpenses.reduce((sum, e) => sum + e.amount, 0);

      const incomeBySource = assetIncomes.reduce((acc, i) => {
        acc[i.source] = (acc[i.source] || 0) + i.amount;
        return acc;
      }, {} as Record<string, number>);

      const expensesByCategory = assetExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);

      return {
        asset,
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        incomeBySource,
        expensesByCategory,
      };
    });
  }, [assets, incomes, expenses]);

  const totals = useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      profit: totalIncome - totalExpenses,
      assetCount: assets.length,
    };
  }, [assets, incomes, expenses]);

  const monthlyData = useMemo((): MonthlyData[] => {
    const months: MonthlyData[] = [];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(selectedYear, month, 1);
      const monthEnd = new Date(selectedYear, month + 1, 0);

      const monthIncomes = incomes.filter(i => {
        const date = new Date(i.date);
        return date >= monthStart && date <= monthEnd;
      });

      const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      });

      const income = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
      const exp = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: monthNames[month],
        income,
        expenses: exp,
        profit: income - exp,
      });
    }

    return months;
  }, [incomes, expenses, selectedYear]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());

    incomes.forEach(i => years.add(new Date(i.date).getFullYear()));
    expenses.forEach(e => years.add(new Date(e.date).getFullYear()));

    return Array.from(years).sort((a, b) => b - a);
  }, [incomes, expenses]);

  const chartMax = useMemo(() => {
    const maxIncome = Math.max(...monthlyData.map(d => d.income), 1);
    const maxExpense = Math.max(...monthlyData.map(d => d.expenses), 1);
    return Math.max(maxIncome, maxExpense);
  }, [monthlyData]);

  const expenseBreakdown = useMemo(() => {
    const breakdown: Record<ExpenseCategory, number> = {
      materials: 0,
      labor: 0,
      service: 0,
      electricity: 0,
      land_filling: 0,
      building_permit: 0,
      foundation: 0,
      architect_fee: 0,
    };

    expenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });

    return breakdown;
  }, [expenses]);

  const incomeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    incomes.forEach(i => {
      breakdown[i.source] = (breakdown[i.source] || 0) + i.amount;
    });
    return breakdown;
  }, [incomes]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-warm-900 dark:text-warm-50">รายงานการเงิน</h1>
          <p className="text-sm md:text-base text-warm-600 dark:text-warm-400 mt-1">
            สรุปรายรับ-รายจ่าย และกำไร/ขาดทุน
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-sage-500 text-white rounded-xl hover:bg-sage-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">บันทึกรายรับ</span>
            <span className="sm:hidden">รายรับ</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-warm-500 dark:text-warm-400 truncate">ทรัพย์สิน</p>
              <p className="text-lg md:text-2xl font-bold text-warm-900 dark:text-warm-50">{totals.assetCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-sage-100 dark:bg-sage-900/30 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-sage-500 dark:text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-warm-500 dark:text-warm-400 truncate">รายรับ</p>
              <p className="text-sm md:text-2xl font-bold text-green-600 dark:text-green-400 truncate">{formatCurrency(totals.totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-warm-500 dark:text-warm-400 truncate">รายจ่าย</p>
              <p className="text-sm md:text-2xl font-bold text-red-600 dark:text-red-400 truncate">{formatCurrency(totals.totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-2 md:p-3 rounded-xl ${totals.profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
              <svg className={`w-5 h-5 md:w-6 md:h-6 ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totals.profit >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-warm-500 dark:text-warm-400 truncate">{totals.profit >= 0 ? 'กำไร' : 'ขาดทุน'}</p>
              <p className={`text-sm md:text-2xl font-bold truncate ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(Math.abs(totals.profit))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Monthly Chart */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">รายรับ-รายจ่ายรายเดือน</h3>
          <div className="h-48 md:h-64 overflow-x-auto">
            <svg viewBox="0 0 600 250" className="w-full h-full min-w-[500px]">
              <text x="35" y="20" className="fill-warm-500 text-xs" textAnchor="end">{formatCompactCurrency(chartMax)}</text>
              <text x="35" y="120" className="fill-warm-500 text-xs" textAnchor="end">{formatCompactCurrency(chartMax / 2)}</text>
              <text x="35" y="220" className="fill-warm-500 text-xs" textAnchor="end">0</text>

              <line x1="45" y1="15" x2="590" y2="15" stroke="#e5e7eb" strokeDasharray="4" />
              <line x1="45" y1="115" x2="590" y2="115" stroke="#e5e7eb" strokeDasharray="4" />
              <line x1="45" y1="215" x2="590" y2="215" stroke="#e5e7eb" />

              {monthlyData.map((data, index) => {
                const x = 55 + index * 45;
                const incomeHeight = chartMax > 0 ? (data.income / chartMax) * 190 : 0;
                const expenseHeight = chartMax > 0 ? (data.expenses / chartMax) * 190 : 0;

                return (
                  <g key={index}>
                    <rect x={x} y={215 - incomeHeight} width="15" height={incomeHeight} fill="#5c8a4e" rx="2" />
                    <rect x={x + 18} y={215 - expenseHeight} width="15" height={expenseHeight} fill="#ef4444" rx="2" />
                    <text x={x + 16} y="235" className="fill-warm-500 text-xs" textAnchor="middle">{data.month}</text>
                  </g>
                );
              })}

              <rect x="450" y="5" width="12" height="12" fill="#5c8a4e" rx="2" />
              <text x="467" y="15" className="fill-warm-600 dark:fill-warm-400 text-xs">รายรับ</text>
              <rect x="510" y="5" width="12" height="12" fill="#ef4444" rx="2" />
              <text x="527" y="15" className="fill-warm-600 dark:fill-warm-400 text-xs">รายจ่าย</text>
            </svg>
          </div>
        </div>

        {/* Breakdown Charts */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">สัดส่วนรายจ่าย</h3>

          {totals.totalExpenses === 0 ? (
            <div className="h-48 md:h-64 flex items-center justify-center text-warm-500 dark:text-warm-400">
              ยังไม่มีข้อมูลรายจ่าย
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(Object.entries(expenseBreakdown) as [ExpenseCategory, number][])
                .filter(([, amount]) => amount > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / totals.totalExpenses) * 100;
                  const colors: Record<ExpenseCategory, string> = {
                    materials: 'bg-blue-500',
                    labor: 'bg-green-500',
                    service: 'bg-purple-500',
                    electricity: 'bg-yellow-500',
                    land_filling: 'bg-amber-500',
                    building_permit: 'bg-indigo-500',
                    foundation: 'bg-orange-500',
                    architect_fee: 'bg-pink-500',
                  };

                  return (
                    <div key={category}>
                      <div className="flex justify-between text-xs md:text-sm mb-1">
                        <span className="text-warm-700 dark:text-warm-300">{expenseCategoryLabels[category]}</span>
                        <span className="text-warm-900 dark:text-warm-50 font-medium">
                          {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 md:h-3 bg-warm-200 dark:bg-warm-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[category]} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Per-Asset Profit/Loss */}
      <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-warm-200 dark:border-warm-800">
          <h3 className="text-base md:text-lg font-semibold text-warm-900 dark:text-warm-50">กำไร/ขาดทุนแยกตามทรัพย์สิน</h3>
        </div>

        {assetSummaries.length === 0 ? (
          <div className="p-6 text-center text-warm-500 dark:text-warm-400">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">ยังไม่มีข้อมูล</p>
            <p className="text-sm">เพิ่มทรัพย์สินและบันทึกรายรับ-รายจ่ายเพื่อดูรายงาน</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {assetSummaries
                .sort((a, b) => b.profit - a.profit)
                .map((summary) => (
                  <div key={summary.asset.id} className="border border-warm-200 dark:border-warm-700 rounded-xl p-4">
                    {/* Asset Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-warm-900 dark:text-warm-50">{summary.asset.name}</h4>
                        <p className="text-sm text-warm-500 dark:text-warm-400">{summary.asset.title_deed_number}</p>
                      </div>
                      {summary.profit > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          กำไร
                        </span>
                      ) : summary.profit < 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          ขาดทุน
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warm-100 text-warm-800 dark:bg-warm-700 dark:text-warm-300">
                          คุ้มทุน
                        </span>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2">
                        <p className="text-xs text-warm-500 dark:text-warm-400">รายรับ</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(summary.totalIncome)}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2">
                        <p className="text-xs text-warm-500 dark:text-warm-400">รายจ่าย</p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(summary.totalExpenses)}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2 ${summary.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                        <p className="text-xs text-warm-500 dark:text-warm-400">กำไร/ขาดทุน</p>
                        <p className={`text-sm font-bold ${summary.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {summary.profit >= 0 ? '+' : ''}{formatCurrency(summary.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Total Card */}
              <div className="border-2 border-warm-300 dark:border-warm-600 rounded-xl p-4 bg-warm-50 dark:bg-warm-800/50">
                <h4 className="font-bold text-warm-900 dark:text-warm-50 mb-3">รวมทั้งหมด</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-warm-500 dark:text-warm-400">รายรับ</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(totals.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-warm-500 dark:text-warm-400">รายจ่าย</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(totals.totalExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-warm-500 dark:text-warm-400">กำไร/ขาดทุน</p>
                    <p className={`text-sm font-bold ${totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totals.profit >= 0 ? '+' : ''}{formatCurrency(totals.profit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-warm-50 dark:bg-warm-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      ทรัพย์สิน
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      รายรับ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      รายจ่าย
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      กำไร/ขาดทุน
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200 dark:divide-warm-800">
                  {assetSummaries
                    .sort((a, b) => b.profit - a.profit)
                    .map((summary) => (
                      <tr key={summary.asset.id} className="hover:bg-warm-50 dark:hover:bg-warm-800/50">
                        <td className="px-6 py-4">
                          <div className="text-warm-900 dark:text-warm-50 font-medium">{summary.asset.name}</div>
                          <div className="text-sm text-warm-500 dark:text-warm-400">{summary.asset.title_deed_number}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {formatCurrency(summary.totalIncome)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {formatCurrency(summary.totalExpenses)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-lg font-bold ${summary.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {summary.profit >= 0 ? '+' : ''}{formatCurrency(summary.profit)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {summary.profit > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              กำไร
                            </span>
                          ) : summary.profit < 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              ขาดทุน
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-warm-800 dark:bg-warm-700 dark:text-warm-300">
                              คุ้มทุน
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-warm-50 dark:bg-warm-800 font-semibold">
                  <tr>
                    <td className="px-6 py-4 text-warm-900 dark:text-warm-50">รวมทั้งหมด</td>
                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                      {formatCurrency(totals.totalIncome)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">
                      {formatCurrency(totals.totalExpenses)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={totals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}>
                        {totals.profit >= 0 ? '+' : ''}{formatCurrency(totals.profit)}
                      </span>
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={fetchData}
        assets={assets}
      />
    </div>
  );
}
