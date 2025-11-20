// components/offline-indicator.tsx
'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff, X } from 'lucide-react'
import { useState } from 'react'

export function OfflineIndicator() {
    const isOnline = useOnlineStatus()
    const [isDismissed, setIsDismissed] = useState(false)

    // Reset dismissed state when coming back online
    if (isOnline && isDismissed) {
        setIsDismissed(false)
    }

    if (isOnline || isDismissed) {
        return null
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                    <WifiOff className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Modo Offline</p>
                        <p className="text-xs opacity-90">Mostrando datos guardados. Algunas funciones están deshabilitadas.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-amber-600 dark:hover:bg-amber-700 rounded transition-colors flex-shrink-0"
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
