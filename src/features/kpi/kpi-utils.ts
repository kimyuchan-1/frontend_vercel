/**
 * Utility functions for KPI data fetching and validation
 * Extracted for testability
 */

import { cookies } from 'next/headers';

export interface KPIData {
  totalCrosswalks: number;
  signalInstallationRate: number;
  riskIndex: number;
  safetyIndex: number;
}

export function coerceNumber(v: unknown, fallback = 0) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeKpiPayload(payload: any): KPIData {
  const timestamp = new Date().toISOString();
  const src = payload || {};
  
  // Required fields for KPI data
  const requiredFields = [
    'totalCrosswalks',
    'signalInstallationRate',
    'riskIndex',
    'safetyIndex'
  ] as const;

  // Validate and normalize each field
  const normalizedData: KPIData = {
    totalCrosswalks: 0,
    signalInstallationRate: 0,
    riskIndex: 0,
    safetyIndex: 0,
  };

  for (const field of requiredFields) {
    const originalValue = src[field];
    const normalizedValue = coerceNumber(originalValue, 0);
    normalizedData[field] = normalizedValue;

    // Log when field is missing
    if (originalValue === undefined || originalValue === null) {
      console.warn(
        `[${timestamp}] [Dashboard KPI] Field normalization: "${field}" is missing, using fallback value 0`
      );
    }
    // Log when field is invalid (NaN, Infinity, or wrong type)
    else if (normalizedValue !== originalValue) {
      const reason = 
        typeof originalValue !== 'number' ? 'wrong type' :
        Number.isNaN(originalValue) ? 'NaN' :
        !Number.isFinite(originalValue) ? 'Infinity' :
        'invalid';
      
      console.warn(
        `[${timestamp}] [Dashboard KPI] Field normalization: "${field}" has invalid value (${reason}: ${originalValue}), replaced with fallback value ${normalizedValue}`
      );
    }
  }

  return normalizedData;
}

export function getFallbackKPIData(): KPIData {
  return {
    totalCrosswalks: 0,
    signalInstallationRate: 0,
    riskIndex: 0,
    safetyIndex: 0,
  };
}

export async function getKPIData(): Promise<KPIData> {
  const timestamp = new Date().toISOString();
  
  try {
    // Use internal API route instead of external backend URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/dashboard/kpi`;

    // Retrieve cookies from Next.js
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Make request to internal API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[${timestamp}] [Dashboard KPI] HTTP error: ${response.status}`);
      console.error(`  URL: ${apiUrl}`);
      console.error(`  Status: ${response.status}`);
      return getFallbackKPIData();
    }

    // Validate and normalize response data
    const payload = await response.json();
    return normalizeKpiPayload(payload);

  } catch (error: any) {
    console.error(`[${timestamp}] [Dashboard KPI] Error fetching KPI data`);
    console.error(`  Details: ${error?.message || String(error)}`);

    // Always return fallback data on error
    return getFallbackKPIData();
  }
}
