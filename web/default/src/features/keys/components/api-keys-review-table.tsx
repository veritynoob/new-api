import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatTimestampToDate } from '@/lib/format'
import { getApiKeys } from '../api'
import { API_KEY_STATUSES } from '../constants'
import { type ApiKey } from '../types'
import { ApiKeysReviewDialogs } from './api-keys-review-dialogs'

export function ApiKeysReviewTable() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState(5)
  const [reviewTarget, setReviewTarget] = useState<ApiKey | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['api-keys-review', statusFilter],
    queryFn: () => getApiKeys({ p: 1, size: 100, status: statusFilter }),
  })

  const keys = data?.data?.items || []

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Button variant={statusFilter === 5 ? 'default' : 'outline'} size='sm' onClick={() => setStatusFilter(5)}>
          {t('Pending')}
        </Button>
        <Button variant={statusFilter === 1 ? 'default' : 'outline'} size='sm' onClick={() => setStatusFilter(1)}>
          {t('Approved')}
        </Button>
        <Button variant={statusFilter === 6 ? 'default' : 'outline'} size='sm' onClick={() => setStatusFilter(6)}>
          {t('Rejected')}
        </Button>
      </div>
      {isLoading ? (
        <div className='text-center py-8 text-muted-foreground'>{t('Loading...')}</div>
      ) : keys.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground'>{t('No API Keys Found')}</div>
      ) : (
        <div className='rounded-md border'>
          <table className='w-full text-sm'>
            <thead className='bg-muted/50'>
              <tr>
                <th className='px-3 py-2 text-left'>{t('Applicant')}</th>
                <th className='px-3 py-2 text-left'>{t('Name')}</th>
                <th className='px-3 py-2 text-left'>{t('System')}</th>
                <th className='px-3 py-2 text-left'>{t('Team')}</th>
                <th className='px-3 py-2 text-left'>{t('Group')}</th>
                <th className='px-3 py-2 text-left'>{t('Models')}</th>
                <th className='px-3 py-2 text-left'>{t('Created')}</th>
                <th className='px-3 py-2 text-left'>{t('Status')}</th>
                <th className='px-3 py-2 text-right'>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const statusConfig = API_KEY_STATUSES[key.status]
                return (
                  <tr key={key.id} className='border-t'>
                    <td className='px-3 py-2 text-muted-foreground'>{key.user_name || key.user_id}</td>
                    <td className='px-3 py-2 font-medium'>{key.name}</td>
                    <td className='px-3 py-2 text-muted-foreground'>{key.system || '-'}</td>
                    <td className='px-3 py-2 text-muted-foreground'>{key.team || '-'}</td>
                    <td className='px-3 py-2 text-muted-foreground'>{key.group || '-'}</td>
                    <td className='px-3 py-2 text-muted-foreground'>
                      {key.model_limits ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className='cursor-default underline decoration-dotted underline-offset-2'>
                              {key.model_limits.split(',').length + ' model(s)'}
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              <ul className='list-disc pl-3 text-left'>
                                {key.model_limits.split(',').map((model) => (
                                  <li key={model.trim()}>{model.trim()}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        t('All')
                      )}
                    </td>
                    <td className='px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground'>
                      {formatTimestampToDate(key.created_time)}
                    </td>
                    <td className='px-3 py-2'>
                      {statusConfig && (
                        <StatusBadge label={t(statusConfig.label)} variant={statusConfig.variant} showDot={statusConfig.showDot} copyable={false} />
                      )}
                    </td>
                    <td className='px-3 py-2 text-right'>
                      {key.status === 5 && (
                        <div className='flex gap-1 justify-end'>
                          <Button size='sm' variant='default' onClick={() => { setReviewTarget(key); setAction('approve') }}>
                            {t('Approve')}
                          </Button>
                          <Button size='sm' variant='destructive' onClick={() => { setReviewTarget(key); setAction('reject') }}>
                            {t('Reject')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <ApiKeysReviewDialogs target={reviewTarget} action={action} onClose={() => { setReviewTarget(null); setAction(null) }} onSuccess={() => { setReviewTarget(null); setAction(null); refetch() }} />
    </div>
  )
}
