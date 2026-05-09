import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { ApiKeysReviewTable } from '@/features/keys/components/api-keys-review-table'

export default function KeyReviewPage() {
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
