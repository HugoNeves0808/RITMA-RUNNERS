import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Drawer, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrainingTableItem } from '../types/trainings'
import styles from './TrainingDetailsDrawer.module.css'

type TrainingDetailsDrawerProps = {
  open: boolean
  training: TrainingTableItem | null
  locale: string
  onEdit?: () => void
  onDelete?: () => void
  onClose: () => void
}

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : '-'
}

function truncateHeaderTitle(value: string, maxLength = 34) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}...`
}

function renderField(label: string, value: ReactNode) {
  const tooltipTitle = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <Tooltip title={tooltipTitle}>
        <span className={styles.fieldValue}>{value ?? '-'}</span>
      </Tooltip>
    </div>
  )
}

function getStatusClassName(status: TrainingTableItem['trainingStatus']) {
  if (status === 'REALIZADO') {
    return styles.statusDone
  }

  if (status === 'PLANEADO') {
    return styles.statusPlanned
  }

  return styles.statusScheduled
}

export function TrainingDetailsDrawer({
  open,
  training,
  locale,
  onEdit,
  onDelete,
  onClose,
}: TrainingDetailsDrawerProps) {
  const { t } = useTranslation()

  const statusLabel = training
    ? t(
      training.trainingStatus === 'REALIZADO'
        ? 'trainings.status.done'
        : training.trainingStatus === 'PLANEADO'
          ? 'trainings.status.planned'
          : 'trainings.status.scheduled',
    )
    : ''

  const seriesValue = training?.seriesId
    ? t('trainings.details.values.everyWeeks', { count: training.seriesIntervalWeeks ?? 1 })
    : t('trainings.details.values.single')

  return (
    <Drawer
      open={open}
      title={training ? (
        <Tooltip title={training.name}>
          <span>{truncateHeaderTitle(training.name)}</span>
        </Tooltip>
      ) : t('trainings.details.title')}
      placement="right"
      width={760}
      extra={training ? (
        <div className={styles.headerActions}>
          <Button
            type="text"
            className={styles.headerAction}
            icon={<FontAwesomeIcon icon={faPenToSquare} />}
            onClick={onEdit}
          >
            {t('trainings.details.actions.edit')}
          </Button>
          <Button
            danger
            type="text"
            className={styles.headerAction}
            icon={<FontAwesomeIcon icon={faTrashCan} />}
            onClick={onDelete}
          >
            {t('trainings.details.actions.delete')}
          </Button>
        </div>
      ) : null}
      onClose={onClose}
      className={styles.drawer}
      destroyOnHidden
    >
      {training ? (
        <div className={styles.content}>
          <section className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <div>
                <div className={styles.overviewEyebrow}>{t('trainings.details.overviewEyebrow')}</div>
                <Tooltip title={training.name}>
                  <h3 className={styles.overviewTitle}>{training.name}</h3>
                </Tooltip>
              </div>

              <span className={`${styles.statusBadge} ${getStatusClassName(training.trainingStatus)}`.trim()}>
                {statusLabel}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('trainings.details.summary.date')}</span>
                <span className={styles.summaryValue}>{formatDate(training.trainingDate, locale)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('trainings.details.summary.time')}</span>
                <span className={styles.summaryValue}>{formatTime(training.trainingTime)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('trainings.details.summary.type')}</span>
                <span className={styles.summaryValue}>{training.trainingTypeName ?? t('trainings.details.values.none')}</span>
              </div>
            </div>
          </section>

          <div className={styles.fieldsGrid}>
            <div>{renderField(t('trainings.details.fields.status'), statusLabel)}</div>
            <div>{renderField(t('trainings.details.fields.series'), seriesValue)}</div>
          </div>

          <section className={styles.notesPanel}>
            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>{t('trainings.details.fields.notes')}</span>
              <p className={styles.noteValue}>{training.notes ?? t('trainings.details.values.none')}</p>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.emptyState}>{t('trainings.details.title')}</div>
      )}
    </Drawer>
  )
}
