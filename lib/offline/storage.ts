// lib/offline/storage.ts
/**
 * IndexedDB wrapper for offline data caching
 * Stores dashboard data, representatives, passengers, and transactions
 */

const DB_NAME = 'TransporteEscolarDB'
const DB_VERSION = 1

interface CachedData<T> {
    data: T
    timestamp: number
    expiresAt: number
}

interface DollarRateCache {
    rate: number
    date: string
    timestamp: number
}

class OfflineStorage {
    private db: IDBDatabase | null = null

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result

                // Create object stores
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' })
                }
                if (!db.objectStoreNames.contains('dollarRate')) {
                    db.createObjectStore('dollarRate', { keyPath: 'id' })
                }
            }
        })
    }

    async set<T>(key: string, data: T, ttlMinutes: number = 60): Promise<void> {
        if (!this.db) await this.init()

        const cachedData: CachedData<T> & { key: string } = {
            key,
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMinutes * 60 * 1000,
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cache'], 'readwrite')
            const store = transaction.objectStore('cache')
            const request = store.put(cachedData)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cache'], 'readonly')
            const store = transaction.objectStore('cache')
            const request = store.get(key)

            request.onsuccess = () => {
                const result = request.result as (CachedData<T> & { key: string }) | undefined

                if (!result) {
                    resolve(null)
                    return
                }

                // Check if expired
                if (Date.now() > result.expiresAt) {
                    // Delete expired data
                    this.delete(key)
                    resolve(null)
                    return
                }

                resolve(result.data)
            }
            request.onerror = () => reject(request.error)
        })
    }

    async delete(key: string): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cache'], 'readwrite')
            const store = transaction.objectStore('cache')
            const request = store.delete(key)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['cache'], 'readwrite')
            const store = transaction.objectStore('cache')
            const request = store.clear()

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    // Dollar rate specific methods
    async setDollarRate(rate: number, date: string): Promise<void> {
        if (!this.db) await this.init()

        const rateData: DollarRateCache & { id: string } = {
            id: 'current',
            rate,
            date,
            timestamp: Date.now(),
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['dollarRate'], 'readwrite')
            const store = transaction.objectStore('dollarRate')
            const request = store.put(rateData)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async getDollarRate(): Promise<DollarRateCache | null> {
        if (!this.db) await this.init()

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['dollarRate'], 'readonly')
            const store = transaction.objectStore('dollarRate')
            const request = store.get('current')

            request.onsuccess = () => {
                const result = request.result as DollarRateCache | undefined
                resolve(result || null)
            }
            request.onerror = () => reject(request.error)
        })
    }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()
