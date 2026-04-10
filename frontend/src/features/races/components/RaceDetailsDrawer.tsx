import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Drawer, Spin, Tabs, Tooltip } from 'antd'
import type { TabsProps } from 'antd'
import type { ReactNode } from 'react'
import type { RaceDetailResponse } from '../types/racesTable'
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

  const [hoursText = '0', minutesText = '0'] = value.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12
  return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function formatBoolean(value: boolean | null | undefined) {
  if (value == null) {
    return '-'
  }

  return value ? 'Yes' : 'No'
}

function formatStatusLabel(status: string | null | undefined) {
  if (!status) {
    return 'Unknown'
  }

  switch (status) {
    case 'REGISTERED':
      return 'Registered'
    case 'COMPLETED':
      return 'Completed'
    case 'IN_LIST':
      return 'Future races'
    case 'NOT_REGISTERED':
      return 'Waiting for registration'
    case 'CANCELLED':
      return 'Cancelled'
    case 'DID_NOT_START':
      return 'Did not start'
    case 'DID_NOT_FINISH':
      return 'Did not finish'
    default:
      return status.replaceAll('_', ' ').toLowerCase()
  }
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
  const items: TabsProps['items'] = [
    {
      key: 'race',
      label: 'Race data',
      children: race ? (
        <div className={styles.tabPane}>
          <section className={styles.overviewCard}>
            <div className={styles.overviewHeader}>
              <div>
                <div className={styles.overviewEyebrow}>Race overview</div>
                <Tooltip title={race.race.name}>
                  <h3 className={styles.overviewTitle}>{race.race.name}</h3>
                </Tooltip>
              </div>

              <span className={`${styles.statusBadge} ${getStatusClassName(race.race.raceStatus)}`.trim()}>
                {formatStatusLabel(race.race.raceStatus)}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Date</span>
                <Tooltip title={race.race.raceDate ?? '-'}>
                  <span className={styles.summaryValue}>{race.race.raceDate ?? '-'}</span>
                </Tooltip>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Time</span>
                <Tooltip title={formatDisplayTime(race.race.raceTime)}>
                  <span className={styles.summaryValue}>{formatDisplayTime(race.race.raceTime)}</span>
                </Tooltip>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Type</span>
                <Tooltip title={race.race.raceTypeName ?? '-'}>
                  <span className={styles.summaryValue}>{race.race.raceTypeName ?? '-'}</span>
                </Tooltip>
              </div>
            </div>
          </section>

          {renderFieldsGrid([
            { label: 'Location', value: race.race.location ?? '-' },
            { label: 'Team', value: race.race.teamName ?? '-' },
            { label: 'Circuit', value: race.race.circuitName ?? '-' },
            { label: 'Real KM', value: race.race.realKm ?? '-' },
            { label: 'Elevation gain', value: race.race.elevation ?? '-' },
            { label: 'Valid for category ranking', value: formatBoolean(race.race.isValidForCategoryRanking) },
          ])}
        </div>
      ) : null,
    },
    {
      key: 'results',
      label: 'Race results',
      children: race ? (
        <div className={styles.tabPane}>
          <section className={styles.metricsPanel}>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>Official time</span>
              <Tooltip title={formatDuration(race.results.officialTimeSeconds)}>
                <span className={styles.metricCardValue}>{formatDuration(race.results.officialTimeSeconds)}</span>
              </Tooltip>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>Chip time</span>
              <Tooltip title={formatDuration(race.results.chipTimeSeconds)}>
                <span className={styles.metricCardValue}>{formatDuration(race.results.chipTimeSeconds)}</span>
              </Tooltip>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricCardLabel}>Pace per KM</span>
              <Tooltip title={formatPace(race.results.pacePerKmSeconds)}>
                <span className={styles.metricCardValue}>{formatPace(race.results.pacePerKmSeconds)}</span>
              </Tooltip>
            </div>
          </section>

          {renderFieldsGrid([
            { label: 'Shoe', value: race.results.shoeName ?? '-' },
            { label: 'General classification', value: race.results.generalClassification ?? '-' },
            { label: 'Age group classification', value: race.results.ageGroupClassification ?? '-' },
            { label: 'Team classification', value: race.results.teamClassification ?? '-' },
          ])}
        </div>
      ) : null,
    },
    {
      key: 'analysis',
      label: 'Race analysis',
      children: race ? (
        <div className={styles.tabPane}>
          {renderFieldsGrid([
            { label: 'Pre-race confidence', value: race.analysis.preRaceConfidence ?? '-' },
            { label: 'Race difficulty', value: race.analysis.raceDifficulty ?? '-' },
            { label: 'Final satisfaction', value: race.analysis.finalSatisfaction ?? '-' },
            { label: 'Would repeat this race', value: formatBoolean(race.analysis.wouldRepeatThisRace) },
          ])}

          <section className={styles.notesPanel}>
            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>Pain / injuries</span>
              <p className={styles.noteValue}>{race.analysis.painInjuries ?? '-'}</p>
            </div>
            <div className={styles.noteCard}>
              <span className={styles.noteLabel}>Analysis notes</span>
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
      ) : 'Race details'}
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
            Edit
          </Button>
          <Button
            danger
            type="text"
            className={styles.headerAction}
            icon={<FontAwesomeIcon icon={faTrashCan} />}
            onClick={onDelete}
            loading={isDeleting}
          >
            Delete
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
        <div className={styles.emptyState}>Could not load this race.</div>
      )}
    </Drawer>
  )
}
