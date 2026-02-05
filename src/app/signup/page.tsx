'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            // Sign up the user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'user', // Default role
                    },
                },
            });

            if (signUpError) {
                console.error('Sign up error:', signUpError);

                // Handle specific error cases
                if (signUpError.message.includes('already registered')) {
                    setError('อีเมลนี้ถูกใช้งานแล้ว');
                } else if (signUpError.message.includes('Invalid email')) {
                    setError('รูปแบบอีเมลไม่ถูกต้อง');
                } else if (signUpError.message.includes('Password')) {
                    setError('รหัสผ่านไม่ปลอดภัยพอ');
                } else {
                    setError(`เกิดข้อผิดพลาด: ${signUpError.message}`);
                }
                setLoading(false);
                return;
            }

            // Check if user was created
            if (data.user) {
                // Wait a moment for the trigger to create the profile
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Verify profile was created
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Profile check error:', profileError);
                    setError('สร้างผู้ใช้สำเร็จ แต่เกิดข้อผิดพลาดในการสร้างโปรไฟล์');
                    setLoading(false);
                    return;
                }

                if (!profile) {
                    console.error('Profile not created by trigger');
                    setError('เกิดข้อผิดพลาดในการสร้างโปรไฟล์ผู้ใช้');
                    setLoading(false);
                    return;
                }

                // Success! Redirect to login or dashboard
                alert('สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ');
                router.push('/login');
            } else {
                setError('ไม่สามารถสร้างผู้ใช้ได้');
                setLoading(false);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-500">Baanaioun</h1>
                    <p className="text-warm-500 dark:text-warm-400 mt-1">Property Management</p>
                </div>

                <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 p-6">
                    <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-6 text-center">
                        สร้างบัญชีใหม่
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
                            >
                                ชื่อ-นามสกุล
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                placeholder="ชื่อ นามสกุล"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
                            >
                                อีเมล
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
                            >
                                รหัสผ่าน
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                placeholder="••••••"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
                            >
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                                placeholder="••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-warm-600 dark:text-warm-400">
                            มีบัญชีอยู่แล้ว?{' '}
                            <Link
                                href="/login"
                                className="text-primary-500 hover:text-primary-600 font-medium"
                            >
                                เข้าสู่ระบบ
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
