import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { SectionPageLayout } from '@/components/layout'
import { ApiKeysReviewTable } from '@/features/keys/components/api-keys-review-table'

export const Route = createFileRoute('/_authenticated/admin/keys/review/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    if (!auth.user || auth.user.role < ROLE.SUPER_ADMIN) {
      throw redirect({ to: '/403' })
    }
  },
  component: KeyReviewPage,
})

function KeyReviewPage() {
  const { t } = useTranslation()
  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Key Review')}</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Review and approve API key applications')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <ApiKeysReviewTable />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
