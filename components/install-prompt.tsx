'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Instalar Transporte Escolar
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Instala la app en tu dispositivo para acceso rápido y funcionalidad offline.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="bg-[#722F37] hover:bg-[#5a252a]">
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Ahora no
            </Button>
          </div>
        </div>
        <Button 
          onClick={handleDismiss} 
          variant="ghost" 
          size="sm"
          className="p-1 h-auto -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
