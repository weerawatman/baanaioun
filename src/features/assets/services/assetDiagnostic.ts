/**
 * Asset Creation Debugging & Verification Utility
 * 
 * Use this to diagnose and verify that asset creation is working.
 * This helps identify whether issues are with:
 * - RLS policies
 * - Authentication/Session
 * - API/Client configuration
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  check: string;
  message: string;
  details?: unknown;
}

interface DiagnosticReport {
  timestamp: string;
  checks: DiagnosticResult[];
  summary: string;
}

/**
 * Run comprehensive diagnostics for asset creation
 */
export async function diagnosticAssetCreation(): Promise<DiagnosticReport> {
  const checks: DiagnosticResult[] = [];
  const timestamp = new Date().toISOString();

  try {
    // Check 1: Is user authenticated?
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      checks.push({
        status: 'error',
        check: 'Authentication',
        message: 'Failed to get current user',
        details: { error: authError },
      });
    } else if (!user) {
      checks.push({
        status: 'error',
        check: 'Authentication',
        message: 'No user logged in',
        details: { user: null },
      });
    } else {
      checks.push({
        status: 'success',
        check: 'Authentication',
        message: `User logged in: ${user.email}`,
        details: { userId: user.id, email: user.email },
      });
    }

    // Check 2: Can read user profile?
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        checks.push({
          status: 'warning',
          check: 'User Profile',
          message: 'Could not fetch user profile',
          details: { error: profileError },
        });
      } else {
        checks.push({
          status: 'success',
          check: 'User Profile',
          message: `User profile found, role: ${profile?.role || 'unknown'}`,
          details: profile,
        });
      }
    }

    // Check 3: Can read existing assets?
    const { data: assets, error: readError } = await supabase
      .from('assets')
      .select('id, name')
      .limit(1);

    if (readError) {
      checks.push({
        status: 'error',
        check: 'Read Assets',
        message: 'Cannot read existing assets',
        details: { code: readError.code, message: readError.message },
      });
    } else {
      checks.push({
        status: 'success',
        check: 'Read Assets',
        message: `Can read assets (found ${assets?.length || 0} records)`,
        details: { count: assets?.length || 0 },
      });
    }

    // Check 4: Try to insert a test asset (with rollback)
    const testAssetData = {
      title_deed_number: `TEST-${Date.now()}`,
      property_type: 'land',
      purchase_price: 0,
      status: 'developing',
      name: 'Diagnostic Test Asset',
    };

    const { data: insertedAsset, error: insertError } = await supabase
      .from('assets')
      .insert(testAssetData)
      .select()
      .single();

    if (insertError) {
      checks.push({
        status: 'error',
        check: 'Create Asset (INSERT)',
        message: `Cannot create assets: ${insertError.message}`,
        details: {
          code: insertError.code,
          message: insertError.message,
          hint: (insertError as any).hint,
          details: (insertError as any).details,
        },
      });
    } else if (insertedAsset) {
      // Successfully inserted - now delete it to clean up
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', insertedAsset.id);

      checks.push({
        status: 'success',
        check: 'Create Asset (INSERT)',
        message: 'Can successfully create assets ✓',
        details: {
          testAssetId: insertedAsset.id,
          cleaned: !deleteError,
        },
      });
    }

    // Check 5: Verify RLS is actually enabled (metadata check)
    const { data: tableInfo, error: tableError } = await supabase.rpc(
      'table_rls_status',
      { table_name: 'assets' }
    ).single().catch(() => ({ data: null, error: new Error('RPC not available') }));

    if (!tableError && tableInfo) {
      checks.push({
        status: 'success',
        check: 'RLS Status (assets)',
        message: `RLS is ${tableInfo.rls_enabled ? 'enabled' : 'disabled'}`,
        details: tableInfo,
      });
    } else {
      checks.push({
        status: 'warning',
        check: 'RLS Status',
        message: 'Could not verify RLS status (RPC not available)',
        details: null,
      });
    }
  } catch (error) {
    checks.push({
      status: 'error',
      check: 'Unexpected Error',
      message: `Diagnostic suite crashed: ${error instanceof Error ? error.message : String(error)}`,
      details: error,
    });
  }

  // Generate summary
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const successCount = checks.filter(c => c.status === 'success').length;

  let summary = '';
  if (errorCount === 0 && warningCount === 0) {
    summary = '✓ All checks passed! Asset creation should work.';
  } else if (errorCount === 0) {
    summary = `⚠ ${warningCount} warning(s) found. Asset creation might work with limitations.`;
  } else {
    summary = `✗ ${errorCount} error(s) found. Asset creation will not work. See details below.`;
  }

  logger.info('Asset creation diagnostics completed', {
    successCount,
    warningCount,
    errorCount,
  });

  return {
    timestamp,
    checks,
    summary,
  };
}

/**
 * Log diagnostic results to console in a formatted way
 */
export function logDiagnosticReport(report: DiagnosticReport) {
  console.group('🔍 Asset Creation Diagnostics');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\n${report.summary}\n`);

  report.checks.forEach((check, index) => {
    const icon =
      check.status === 'success' ? '✓' : check.status === 'warning' ? '⚠' : '✗';
    console.group(`${icon} [${index + 1}] ${check.check}`);
    console.log(`Status: ${check.status}`);
    console.log(`Message: ${check.message}`);
    if (check.details) {
      console.log('Details:', check.details);
    }
    console.groupEnd();
  });

  console.groupEnd();
}

/**
 * For development: quick test in browser console
 * 
 * Usage in browser console:
 * ```
 * import { diagnosticAssetCreation, logDiagnosticReport } from '@/features/assets/services/assetDiagnostic'
 * const report = await diagnosticAssetCreation()
 * logDiagnosticReport(report)
 * ```
 */
export async function quickDiagTest() {
  const report = await diagnosticAssetCreation();
  logDiagnosticReport(report);
  return report;
}
