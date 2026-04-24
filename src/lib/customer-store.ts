/**
 * In-memory customer store for when DATABASE_URL is not configured.
 * This allows customer registration and login to work without a database.
 * Data is lost on server restart (cold start on serverless).
 */

export interface InMemoryCustomer {
  id: string
  name: string
  email: string
  passwordHash: string
  company: string | null
  phone: string | null
  status: 'active' | 'inactive'
  plan: 'free' | 'pro' | 'enterprise'
  revenue: number
  createdAt: Date
}

// Hardcoded test customer accounts (fallback when DATABASE_URL is not set)
const TEST_CUSTOMER_HASHES: Record<string, { hash: string; name: string; company: string | null; plan: string }> = {
  'test@customer.com': {
    hash: '$2b$10$2sLy/qTAfV0bGh3IVbg1Ae9gIp1iw69TBhkaeNQ5sUKqHQ/XpQsVW', // test123
    name: 'Test Customer',
    company: 'Test Company',
    plan: 'free',
  },
}

// Singleton in-memory store
const inMemoryCustomers: Map<string, InMemoryCustomer> = new Map()

// Seed test customers into the in-memory store
for (const [email, data] of Object.entries(TEST_CUSTOMER_HASHES)) {
  inMemoryCustomers.set(email, {
    id: `customer-${email}`,
    name: data.name,
    email,
    passwordHash: data.hash,
    company: data.company,
    phone: null,
    status: 'active',
    plan: data.plan as InMemoryCustomer['plan'],
    revenue: 0,
    createdAt: new Date('2026-01-01'),
  })
}

/**
 * Check if an email is a known fallback customer (hardcoded or in-memory).
 */
export function isFallbackCustomer(email: string): boolean {
  return !!TEST_CUSTOMER_HASHES[email] || inMemoryCustomers.has(email)
}

/**
 * Get a fallback customer by email.
 */
export function getFallbackCustomer(email: string): InMemoryCustomer | undefined {
  return inMemoryCustomers.get(email)
}

/**
 * Add a customer to the in-memory store (used by customer-register when DB is unavailable).
 */
export function addInMemoryCustomer(customer: InMemoryCustomer): void {
  inMemoryCustomers.set(customer.email, customer)
}

/**
 * Get all in-memory customers.
 */
export function getAllInMemoryCustomers(): InMemoryCustomer[] {
  return Array.from(inMemoryCustomers.values())
}

/**
 * In-memory OTP store for when DATABASE_URL is not configured.
 */
interface InMemoryOtp {
  email: string
  code: string
  expiresAt: Date
  verified: boolean
}

const inMemoryOtps: Map<string, InMemoryOtp> = new Map()

export function storeInMemoryOtp(email: string, code: string): void {
  inMemoryOtps.set(email, {
    email,
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    verified: false,
  })
}

export function getInMemoryOtp(email: string): InMemoryOtp | undefined {
  return inMemoryOtps.get(email)
}

export function deleteInMemoryOtp(email: string): void {
  inMemoryOtps.delete(email)
}
