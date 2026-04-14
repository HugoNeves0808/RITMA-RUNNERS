import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Drawer, Spin, Tabs, Tooltip } from 'antd'
import type { TabsProps } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceDetailResponse } from '../types/racesTable'
import { getRaceStatusLabel } from '../types/raceFilters'
import styles from './RaceDetailsDrawer.module.css'

type RaceDetailsDrawerProps = {
  open: boolean
  race: RaceDetailResponse | null
  isLoading: boolean
  error?: string | null
  onEdit?: () => void
  onDelete?: () => void
  isDeleting?: boolean
  onClose: () => void
}

function truncateHeaderTitle(value: string, maxLength = 34) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}...`
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDisplayTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  return value
}

function formatBoolean(value: boolean | null | undefined, t: (key: string) => string) {
  if (value == null) {
    return '-'
  }

  return value ? t('common.yes') : t('common.no')
}

function getStatusClassName(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return styles.statusRegistered
    case 'COMPLETED':
      return styles.statusCompleted
    case 'IN_LIST':
      return styles.statusInList
    case 'NOT_REGISTERED':
      return styles.statusNotRegistered
    case 'CANCELLED':
      return styles.statusCancelled
    case 'DID_NOT_START':
      return styles.statusDns
    case 'DID_NOT_FINISH':
      return styles.statusDnf
    default:
      return styles.statusUnknown
  }
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

function renderFieldsGrid(fields: Array<{ label: string; value: ReactNode }>) {
  return (
    <div className={styles.fieldsGrid}>
      {fields.map((field) => (
        <div key={field.label}>{renderField(field.label, field.value)}</div>
      ))}
    </div>
  )
}

export function RaceDetailsDrawer({
  open,
  race,
  isLoading,
  error,
  onEdit,
  onDelete,
  isDeleting = false,
  onClose,
}: RaceDetailsDrawerProps) {
  const { t } = useTranslation()

  const items: TabsProps['items'] = [
    {
      key: 'race',
      label: t('races.details.tabs.race'),
      children: race ? (
        <div className={styles.tabPane}>
          <section className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <div>
                <div className={styles.overviewEyebrow}>{t('races.details.overviewEyebrow')}</div>
                <Tooltip title={race.race.name}>
                  <h3 className={styles.overviewTitle}>{race.race.name}</h3>
                </Tooltip>
              </div>

              <span className={`${styles.statusBadge} ${getStatusClassName(race.race.raceStatus)}`.trim()}>
                {race.race.raceStatus ? getRaceStatusLabel(race.race.raceStatus, t) : t('common.unknown')}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('races.details.summary.date')}</span>
                <Tooltip title={race.race.raceDate ?? '-'}>
                  <span className={styles.summaryValue}>{race.race.raceDate ?? '-'}</span>
                </Tooltip>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('races.details.summary.time')}</span>
                <Tooltip title={formatDisplayTime(race.race.raceTime)}>
                  <span className={styles.summaryValue}>{formatDisplayTime(race.race.raceTime)}</span>
                </Tooltip>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{t('races.details.summary.type')}</span>
                <Tooltip title={race.race.raceTypeName ?? '-'}>
                  <span className={styles.summaryValue}>{race.race.raceTypeName ?? '-'}</span>
                </Tooltip>
              </div>
            </div>
          </section>

          {renderFieldsGrid([
            { label: t('races.details.fields.location'), value: race.race.location ?? '-' },
            { label: t('races.details.fields.team'), value: race.race.teamName ?? '-' },
            { label: t('races.details.fields.circuit'), value: race.race.circuitName ?? '-' },
            { label: t('races.details.fields.realKm'), value: race.race.realKm ?? '-' },
            { label: t('races.details.fields.elevation'), value: race.race.elevation ?? '-' },
            { label: t('races.details.fields.validForRanking'), value: formatBoolean(race.race.isValidForCategoryRanking, t) },
          ])}
        </div>
      ) : null,
    },
    {
      key: 'results',
      label: t('races.details.tabs.results'),
      children: race ? (
        <div className={styles.tabPane}>
          <section className={styles.metricsPanel}>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>{t('races.details.metrics.officialTime')}</span>
              <Tooltip title={formatDuration(race.results.officialTimeSeconds)}>
                <span className={styles.metricCardValue}>{formatDuration(race.results.officialTimeSeconds)}</span>
              </Tooltip>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>{t('races.details.metrics.chipTime')}</span>
              <Tooltip title={formatDuration(race.results.chipTimeSeconds)}>
                <span className={styles.metricCardValue}>{formatDuration(race.results.chipTimeSeconds)}</span>
              </Tooltip>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>{t('races.details.metrics.pacePerKm')}</span>
              <Tooltip title={formatPace(race.results.pacePerKmSeconds)}>
                <span className={styles.metricCardValue}>{formatPace(race.results.pacePerKmSeconds)}</span>
              </Tooltip>
            </div>
          </section>

          {renderFieldsGrid([
            { label: t('races.details.fields.shoe'), value: race.results.shoeName ?? '-' },
            { label: t('races.details.fields.generalClassification'), value: race.results.generalClassification ?? '-' },
            { label: t('races.details.fields.ageGroupClassification'), value: race.results.ageGroupClassification ?? '-' },
            { label: t('races.details.fields.teamClassification'), value: race.results.teamClassification ?? '-' },
          ])}
        </div>
      ) : null,
    },
    {
      key: 'analysis',
      label: t('races.details.tabs.analysis'),
      children: race ? (
        <div className={styles.tabPane}>
          {renderFieldsGrid([
            { label: t('races.details.fields.preRaceConfidence'), value: race.analysis.preRaceConfidence ?? '-' },
            { label: t('races.details.fields.raceDifficulty'), value: race.analysis.raceDifficulty ?? '-' },
            { label: t('races.details.fields.finalSatisfaction'), value: race.analysis.finalSatisfaction ?? '-' },
          ])}

          <section className={styles.notesPanel}>
            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>{t('races.details.fields.painInjuries')}</span>
              <p className={styles.noteValue}>{race.analysis.painInjuries ?? '-'}</p>
            </div>
            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>{t('races.details.fields.analysisNotes')}</span>
              <p className={styles.noteValue}>{race.analysis.analysisNotes ?? '-'}</p>
            </div>
          </section>
        </div>
      ) : null,
    },
  ]

  return (
    <Drawer
      open={open}
      title={race ? (
        <Tooltip title={race.race.name}>
          <span>{truncateHeaderTitle(race.race.name)}</span>
        </Tooltip>
      ) : t('races.details.title')}
      placement="right"
      width={860}
      extra={race ? (
        <div className={styles.headerActions}>
          <Button
            type="text"
            className={styles.headerAction}
            icon={<FontAwesomeIcon icon={faPenToSquare} />}
            onClick={onEdit}
          >
            {t('races.details.actions.edit')}
          </Button>
          <Button
            danger
            type="text"
            className={styles.headerAction}
            icon={<FontAwesomeIcon icon={faTrashCan} />}
            onClick={onDelete}
            loading={isDeleting}
          >
            {t('races.details.actions.delete')}
          </Button>
        </div>
      ) : null}
      onClose={onClose}
      className={styles.drawer}
      destroyOnHidden
    >
      {isLoading ? (
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : race ? (
        <Tabs items={items} />
      ) : (
        <div className={styles.emptyState}>{t('races.calendar.loadRaceErrorFallback')}</div>
      )}
    </Drawer>
  )
}
