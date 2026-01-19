/**
 * Utility functions for KPI data fetching and validation
 * Extracted for testability
 */

import axios from 'axios';
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

export function validateBackendUrl(url: string | undefined): string | null {
  if (!url || url.trim() === '') {
    if (url === '') {
      console.error(`[${new Date().toISOString()}] [Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is empty`);
    } else {
      console.error(`[${new Date().toISOString()}] [Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is not set`);
    }
    return null;
  }

  try {
    new URL(url);
    return url;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [Dashboard KPI] Configuration error: NEXT_PUBLIC_BACKEND_URL is not a valid URL: ${url}`);
    return null;
  }
}

export async function getKPIData(): Promise<KPIData> {
  const timestamp = new Date().toISOString();
  
  // Validate environment configuration
  const backendUrl = validateBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  if (!backendUrl) {
    return getFallbackKPIData();
  }

  try {
    // Retrieve cookies from Next.js
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Create axios instance with proper configuration
    const backendClient = axios.create({
      baseURL: backendUrl,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    // Make direct request to backend API
    const response = await backendClient.get('/api/dashboard/kpi');

    // Validate and normalize response data
    const payload = response.data;
    return normalizeKpiPayload(payload);

  } catch (error: any) {
    // Determine error type and log appropriately
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        // Timeout error
        console.error(`[${timestamp}] [Dashboard KPI] Timeout error`);
        console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
        console.error(`  Details: Request timed out after 15000ms`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // Network error
        console.error(`[${timestamp}] [Dashboard KPI] Network error: ${error.code}`);
        console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
        console.error(`  Details: ${error.message}`);
      } else if (error.response) {
        // HTTP error (4xx, 5xx)
        console.error(`[${timestamp}] [Dashboard KPI] HTTP error: ${error.response.status}`);
        console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Message: ${error.response.data?.message || error.response.statusText || 'No error message'}`);
      } else {
        // Other axios error
        console.error(`[${timestamp}] [Dashboard KPI] Request error`);
        console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
        console.error(`  Details: ${error.message}`);
      }
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error(`[${timestamp}] [Dashboard KPI] Parse error: Invalid JSON response`);
      console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
      console.error(`  Details: ${error.message}`);
    } else {
      // Unknown error
      console.error(`[${timestamp}] [Dashboard KPI] Unknown error`);
      console.error(`  URL: ${backendUrl}/api/dashboard/kpi`);
      console.error(`  Details: ${error?.message || String(error)}`);
    }

    // Always return fallback data on error
    return getFallbackKPIData();
  }
}
