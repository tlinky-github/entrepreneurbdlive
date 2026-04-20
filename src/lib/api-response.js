import { NextResponse } from 'next/server';

/**
 * Standardized Success Response
 */
export function successResponse(data, message = '', status = 200) {
  const responseData = typeof data === 'object' && data !== null && !Array.isArray(data) 
    ? { success: true, ...data, message }
    : { success: true, data, message };

  return NextResponse.json(responseData, { status });
}

/**
 * Standardized Error Response
 */
export function errorResponse(message, status = 400) {
  return NextResponse.json({
    success: false,
    error: message,
  }, { status });
}
