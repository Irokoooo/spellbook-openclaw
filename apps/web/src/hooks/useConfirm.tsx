'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  showDontAskAgain?: boolean
  dontAskAgainKey?: string
  icon?: React.ReactNode
}

interface ConfirmState {
  open: boolean
  resolve: (value: boolean) => void
  options: ConfirmOptions
}

const defaultOptions: ConfirmOptions = {
  title: '确认操作',
  description: '确定要执行此操作吗？',
  confirmText: '确定',
  cancelText: '取消',
  variant: 'default',
  showDontAskAgain: false,
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (options?.dontAskAgainKey) {
        const skipped = localStorage.getItem('confirm_skip_' + options.dontAskAgainKey)
        if (skipped === 'true') {
          resolve(true)
          return
        }
      }

      setState({
        open: true,
        resolve,
        options: { ...defaultOptions, ...options },
      })
    })
  }, [])

  const handleConfirm = useCallback((dontAskAgain: boolean) => {
    if (state) {
      if (dontAskAgain && state.options.dontAskAgainKey) {
        localStorage.setItem('confirm_skip_' + state.options.dontAskAgainKey, 'true')
      }
      state.resolve(true)
      setState(null)
    }
  }, [state])

  const handleCancel = useCallback(() => {
    if (state) {
      state.resolve(false)
      setState(null)
    }
  }, [state])

  const variantConfig = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-500',
      iconRing: 'ring-red-200 dark:ring-red-800/50',
      accentBar: 'bg-red-500',
      confirmBtn: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs shadow-red-600/20',
      activeBorder: 'border-red-200 dark:border-red-800/50',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-500',
      iconRing: 'ring-amber-200 dark:ring-amber-800/50',
      accentBar: 'bg-amber-500',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs shadow-amber-600/20',
      activeBorder: 'border-amber-200 dark:border-amber-800/50',
    },
    default: {
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-500',
      iconRing: 'ring-violet-200 dark:ring-violet-800/50',
      accentBar: 'bg-violet-500',
      confirmBtn: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-xs shadow-violet-600/20',
      activeBorder: 'border-violet-200 dark:border-violet-800/50',
    },
  }

  const ConfirmDialog = () => {
    if (!state) return null
    const { options } = state
    const cfg = variantConfig[options.variant || 'default']
    const [dontAskAgain, setDontAskAgain] = useState(false)

    return (
      <Dialog
        open={state.open}
        onOpenChange={(open) => { if (!open) handleCancel() }}
      >
        <DialogContent
          showCloseButton={false}
          className={[
            'max-w-sm rounded-2xl border-2 p-0 overflow-hidden',
            'shadow-2xl',
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-4',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-4',
          ].join(' ')}
        >
          {/* Top accent bar */}
          <div className={`h-1.5 w-full ${cfg.accentBar}`} />

          <div className="p-6 pt-5">
            {/* Icon + Title */}
            <div className="flex flex-col items-center gap-4 mb-5">
              <div
                className={[
                  'h-14 w-14 rounded-2xl flex items-center justify-center',
                  cfg.iconBg, cfg.iconColor,
                  'ring-4', cfg.iconRing,
                ].join(' ')}
              >
                {options.icon || <AlertTriangle className="h-7 w-7" />}
              </div>
              <DialogTitle className="text-center text-lg font-semibold tracking-tight">
                {options.title}
              </DialogTitle>
              <DialogDescription className="text-center text-sm leading-relaxed max-w-[260px] mx-auto">
                {options.description}
              </DialogDescription>
            </div>

            {/* "Don't ask again" toggle */}
            {options.showDontAskAgain && options.dontAskAgainKey && (
              <div
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none',
                  'border transition-all duration-200 mb-5',
                  dontAskAgain
                    ? cfg.activeBorder + ' ' + cfg.iconBg
                    : 'border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30',
                ].join(' ')}
                onClick={() => setDontAskAgain(!dontAskAgain)}
                role="checkbox"
                aria-checked={dontAskAgain}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDontAskAgain(!dontAskAgain) }}
              >
                <div
                  className={[
                    'h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                    dontAskAgain
                      ? cfg.confirmBtn.split(' ')[0] + ' border-transparent shadow-xs'
                      : 'border-zinc-300 dark:border-zinc-600',
                  ].join(' ')}
                >
                  {dontAskAgain && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Label className="text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer font-normal select-none">
                  不再询问，直接操作
                </Label>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1 h-9"
              >
                {options.cancelText}
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirm(dontAskAgain)}
                className={`flex-1 h-9 ${cfg.confirmBtn}`}
              >
                {options.confirmText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return { confirm, ConfirmDialog }
}
