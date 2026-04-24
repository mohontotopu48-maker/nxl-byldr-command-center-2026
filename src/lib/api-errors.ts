/**
 * API error handling utilities.
 * Provides a wrapper for API route handlers that catches errors
 * and returns proper JSON responses instead of 500 HTML pages.
 */

import { NextResponse } from 'next/server'

export type ApiHandler = (...args: unknown[]) => Promise<Response> | Response

interface JsonErrorProps {
  error: string
  message: string
  details?: unknown
}

function jsonError(props: JsonErrorProps, status = 500): NextResponse {
  return NextResponse.json(props, { status })
}

/**
 * Wraps an API route handler to catch all errors and return JSON responses.
 * Usage:
 *   export const GET = withErrorHandler(async (req) => { ... });
 *   export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (...args: unknown[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('[API Error]', error)

      // Prisma connection errors
      const message = error instanceof Error ? error.message : 'Internal server error'

      if (
        message.includes('DATABASE_URL') ||
        message.includes('prisma') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ENOTFOUND') ||
        message.includes('authentication failed') ||
        message.includes('SSL') ||
        message.includes('timeout') ||
        message.includes('getaddrinfo')
      ) {
        return jsonError(
          {
            error: 'Database connection failed',
            message: 'The server could not connect to the database. Please ensure DATABASE_URL is configured in your deployment environment.',
            details: process.env.NODE_ENV === 'development' ? message : undefined,
          },
          503, // Service Unavailable — not a code bug, it's an infrastructure issue
        )
      }

      return jsonError(
        {
          error: 'Internal server error',
          message,
          details: process.env.NODE_ENV === 'development' ? message : undefined,
        },
        500,
      )
    }
  }
}

/**
 * Standard error responses for common cases.
 */
export const apiErrors = {
  notFound: (resource = 'Resource') =>
    jsonError({ error: 'Not found', message: `${resource} was not found.` }, 404),

  unauthorized: () =>
    jsonError({ error: 'Unauthorized', message: 'Authentication required.' }, 401),

  forbidden: () =>
    jsonError({ error: 'Forbidden', message: 'You do not have permission.' }, 403),

  badRequest: (message: string) =>
    jsonError({ error: 'Bad request', message }, 400),

  dbUnavailable: () =>
    jsonError(
      {
        error: 'Database unavailable',
        message: 'The database is not configured. Please set the DATABASE_URL environment variable.',
      },
      503,
    ),
}
