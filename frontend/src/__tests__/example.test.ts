import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic arithmetic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should validate environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined()
    expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:3001')
  })

  it('should handle arrays correctly', () => {
    const items = ['apple', 'banana', 'orange']
    expect(items).toHaveLength(3)
    expect(items).toContain('banana')
  })

  it('should handle objects correctly', () => {
    const user = {
      name: 'أحمد',
      email: 'ahmad@syriamart.com',
      role: 'customer'
    }
    
    expect(user).toHaveProperty('name')
    expect(user.name).toBe('أحمد')
    expect(user).toMatchObject({
      email: expect.stringContaining('@syriamart.com')
    })
  })

  it('should handle async operations', async () => {
    const fetchData = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ status: 'success' }), 100)
      })
    }
    
    const result = await fetchData()
    expect(result).toEqual({ status: 'success' })
  })
})