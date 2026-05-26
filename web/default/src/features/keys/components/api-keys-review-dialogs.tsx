import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { reviewApiKey } from '../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { type ApiKey } from '../types'

type Props = {
  target: ApiKey | null
  action: 'approve' | 'reject' | null
  onClose: () => void
  onSuccess: () => void
}

export function ApiKeysReviewDialogs({
  target,
  action,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!target || !action) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const status = action === 'approve' ? 1 : 6
      const result = await reviewApiKey(target.id, status, comment || undefined)
      if (result.success) {
        toast.success(
          t(action === 'approve' ? SUCCESS_MESSAGES.API_KEY_APPROVED : SUCCESS_MESSAGES.API_KEY_REJECTED)
        )
        onSuccess()
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.REVIEW_FAILED))
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? t('Approve API Key') : t('Reject API Key')}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? t('Are you sure you want to approve this API key?')
              : t('Are you sure you want to reject this API key?')}
          </DialogDescription>
        </DialogHeader>
        {action === 'reject' && (
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {t('Rejection reason (optional)')}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('Enter the reason for rejection...')}
              rows={3}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            {t('Cancel')}
          </Button>
          <Button
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('Saving...') : action === 'approve' ? t('Approve') : t('Reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
