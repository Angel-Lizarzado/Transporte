'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="ml-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copiar
        </>
      )}
    </Button>
  )
}

