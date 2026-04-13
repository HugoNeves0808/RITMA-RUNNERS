import { faChevronDown, faEllipsisVertical, faPenToSquare, faTrashCan, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import dayjs from 'dayjs'
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Empty,
  type MenuProps,
  Modal,
  Select,
  Space,
  Spin,
  Tooltip,
} from 'antd'
import { useAuth } from '../../auth'
import {
  fetchRaceDetail,
  fetchRaceTable,
  deleteRace,
  updateRaceTableItem,
} from '../services/racesTableService'
import {
  EMPTY_RACE_FILTERS,
  getRaceStatusBackgroundColor,
  getRaceStatusColor,
  type RaceFilters,
} from '../types/raceFilters'
import type {
  CreateRacePayload,
  RaceCreateOptions,
  RaceDetailResponse,
  RaceTableItem,
  RaceTableYearGroup,
  TableYearSelection,
} from '../types/racesTable'
import { AddRaceDrawer } from './AddRaceDrawer'
import { RaceDetailsDrawer } from './RaceDetailsDrawer'
import styles from './RacesTableView.module.css'

function getDayLabel(value: string | null) {
  if (!value) {
    return 'No'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return String(date.getDate()).padStart(2, '0')
}

function getCompactMonthLabel(value: string | null) {
  if (!value) {
    return 'date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '---'
  }

  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date)
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()
}

function getCompactInlineDateLabel(value: string | null) {
  if (!value) {
    return 'No date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = new Intl.DateTimeFormat('pt-PT', { month: 'short' }).format(date)
    .replace('.', '')
  const normalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()

  return `${day}/${normalizedMonth}`
}

function getShortDateWithYear(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getLongMonthLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'NO MONTH'
  }

  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
  }).format(date).toUpperCase()
}

function getRaceStatusLabel(status: string | null | undefined) {
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

function getRaceStatusClassName(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return styles.raceStatusRegistered
    case 'COMPLETED':
      return styles.raceStatusCompleted
    case 'IN_LIST':
      return styles.raceStatusInList
    case 'NOT_REGISTERED':
      return styles.raceStatusNotRegistered
    case 'CANCELLED':
      return styles.raceStatusCancelled
    case 'DID_NOT_START':
      return styles.raceStatusDns
    case 'DID_NOT_FINISH':
      return styles.raceStatusDnf
    default:
      return styles.raceStatusUnknown
  }
}

function getRaceSurfaceClassName(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return styles.raceRowRegistered
    case 'COMPLETED':
      return styles.raceRowCompleted
    case 'CANCELLED':
      return styles.raceRowCancelled
    case 'DID_NOT_START':
      return styles.raceRowDns
    case 'DID_NOT_FINISH':
      return styles.raceRowDnf
    default:
      return ''
  }
}

function shouldShowPerformanceMetrics(status: string | null | undefined) {
  return status === 'COMPLETED'
}

function shouldUseInlineCompactMeta(status: string | null | undefined) {
  return status === 'CANCELLED'
    || status === 'NOT_REGISTERED'
    || status === 'DID_NOT_START'
    || status === 'DID_NOT_FINISH'
}

function shouldHideLocationInCompactMeta(status: string | null | undefined) {
  return status === 'CANCELLED'
    || status === 'NOT_REGISTERED'
    || status === 'DID_NOT_START'
    || status === 'DID_NOT_FINISH'
}

function shouldShowRegisteredMeta(status: string | null | undefined) {
  return status === 'REGISTERED'
}

function isTerminalRaceStatus(status: string | null | undefined) {
  return status === 'COMPLETED'
    || status === 'DID_NOT_START'
    || status === 'DID_NOT_FINISH'
    || status === 'CANCELLED'
}

function shouldWarnAboutPastRaceStatus(race: RaceTableItem, now: dayjs.Dayjs) {
  if (!race.raceDate || isTerminalRaceStatus(race.raceStatus)) {
    return false
  }

  return now.startOf('day').isAfter(dayjs(race.raceDate).startOf('day'))
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return <span className={styles.emptyValue}>-</span>
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return <span className={styles.emptyValue}>-</span>
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

function formatDurationText(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPaceText(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
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

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

type OverflowTooltipProps = {
  title: string
  className?: string
  children: ReactNode
}

function OverflowTooltip({ title, className, children }: OverflowTooltipProps) {
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const updateOverflow = () => {
    const element = contentRef.current
    if (!element) {
      return
    }

    setIsOverflowing(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
  }

  return (
    <Tooltip title={isOverflowing ? title : null}>
      <span ref={contentRef} className={className} onMouseEnter={updateOverflow}>
        {children}
      </span>
    </Tooltip>
  )
}

function renderMetricValueWithTooltip(value: ReactNode, tooltip: string) {
  return (
    <OverflowTooltip title={tooltip} className={styles.metricValue}>
      {value}
    </OverflowTooltip>
  )
}

function buildUpdatePayloadFromDetails(details: RaceDetailResponse, nextStatus: string): CreateRacePayload {
  return {
    race: {
      raceStatus: nextStatus,
      raceDate: details.race.raceDate,
      raceTime: details.race.raceTime,
      name: details.race.name,
      location: details.race.location,
      teamId: details.race.teamId,
      circuitId: details.race.circuitId,
      raceTypeId: details.race.raceTypeId,
      realKm: details.race.realKm,
      elevation: details.race.elevation,
      isValidForCategoryRanking: details.race.isValidForCategoryRanking ?? false,
    },
    results: {
      officialTimeSeconds: details.results.officialTimeSeconds,
      chipTimeSeconds: details.results.chipTimeSeconds,
      pacePerKmSeconds: details.results.pacePerKmSeconds,
      shoeId: details.results.shoeId,
      generalClassification: details.results.generalClassification,
      ageGroupClassification: details.results.ageGroupClassification,
      teamClassification: details.results.teamClassification,
    },
    analysis: {
      preRaceConfidence: details.analysis.preRaceConfidence,
      raceDifficulty: details.analysis.raceDifficulty,
      finalSatisfaction: details.analysis.finalSatisfaction,
      painInjuries: details.analysis.painInjuries,
      analysisNotes: details.analysis.analysisNotes,
    },
  }
}

function renderRaceMetrics(race: RaceTableItem) {
  const showPerformanceMetrics = shouldShowPerformanceMetrics(race.raceStatus)
  const useInlineCompactMeta = shouldUseInlineCompactMeta(race.raceStatus)
  const showRegisteredMeta = shouldShowRegisteredMeta(race.raceStatus)

  if (useInlineCompactMeta) {
    return (
      <div className={styles.inlineMetaRow}>
        <span className={styles.inlineMetaLabel}>Location</span>
        <span className={styles.inlineMetaValue}>{race.location ?? '-'}</span>
        <span className={styles.inlineMetaDivider}>•</span>
        <span className={styles.inlineMetaLabel}>Race type</span>
        <span className={styles.inlineMetaValue}>{race.raceTypeName ?? '-'}</span>
      </div>
    )
  }

  return (
    <div className={styles.metricsGrid}>
      <div className={styles.metricItem}>
        <span className={styles.metricLabel}>Location</span>
        {renderMetricValueWithTooltip(
          race.location ?? <span className={styles.emptyValue}>-</span>,
          race.location ?? '-',
        )}
      </div>

      <div className={styles.metricItem}>
        <span className={styles.metricLabel}>Race type</span>
        {renderMetricValueWithTooltip(
          race.raceTypeName ?? <span className={styles.emptyValue}>-</span>,
          race.raceTypeName ?? '-',
        )}
      </div>

      {showRegisteredMeta ? (
        <>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Circuit</span>
            {renderMetricValueWithTooltip(
              race.circuitName ?? <span className={styles.emptyValue}>-</span>,
              race.circuitName ?? '-',
            )}
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Time</span>
            {renderMetricValueWithTooltip(
              formatDisplayTime(race.raceTime),
              formatDisplayTime(race.raceTime),
            )}
          </div>
        </>
      ) : null}

      {showPerformanceMetrics ? (
        <>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Chip time</span>
            {renderMetricValueWithTooltip(
              formatDuration(race.chipTimeSeconds),
              formatDurationText(race.chipTimeSeconds),
            )}
          </div>

          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Pace per km</span>
            {renderMetricValueWithTooltip(
              formatPace(race.pacePerKmSeconds),
              formatPaceText(race.pacePerKmSeconds),
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function renderCompactInlineMeta(race: RaceTableItem) {
  const hideLocation = shouldHideLocationInCompactMeta(race.raceStatus)

  if (hideLocation) {
    return null
  }

  return (
    <div className={styles.compactInlineMeta}>
      <span className={styles.compactInlineMetaLabel}>Location</span>
      <span className={styles.compactInlineMetaValue}>{race.location ?? '-'}</span>
      <span className={styles.compactInlineMetaDivider}>•</span>
      <span className={styles.compactInlineMetaLabel}>Race type</span>
      <span className={styles.compactInlineMetaValue}>{race.raceTypeName ?? '-'}</span>
    </div>
  )
}

function renderPastRaceStatusWarning(
  race: RaceTableItem,
  now: dayjs.Dayjs,
  onClick: (race: RaceTableItem) => void,
) {
  if (!shouldWarnAboutPastRaceStatus(race, now)) {
    return null
  }

  return (
    <Tooltip title="This race date has passed. Click to review and update the final race status.">
      <button
        type="button"
        className={styles.statusWarningBadge}
        onClick={(event) => {
          event.stopPropagation()
          onClick(race)
        }}
      >
        <FontAwesomeIcon icon={faTriangleExclamation} className={styles.statusWarningIcon} />
        <span>Click to Update</span>
      </button>
    </Tooltip>
  )
}

function groupRacesByMonth(races: RaceTableItem[]) {
  const monthMap = new Map<string, RaceTableItem[]>()

  races.forEach((race) => {
    if (!race.raceDate) {
      return
    }

    const key = race.raceDate.slice(0, 7)
    const currentMonthRaces = monthMap.get(key)
    if (currentMonthRaces) {
      currentMonthRaces.push(race)
      return
    }

    monthMap.set(key, [race])
  })

  return Array.from(monthMap.entries()).map(([key, monthRaces]) => ({
    key,
    label: getLongMonthLabel(`${key}-01`),
    races: monthRaces,
  }))
}

function getRaceDateTime(race: RaceTableItem) {
  if (race.raceTime) {
    return dayjs(`${race.raceDate}T${race.raceTime}`)
  }

  return dayjs(`${race.raceDate}T23:59:59`)
}

function isRegisteredRace(race: RaceTableItem) {
  return race.raceStatus === 'REGISTERED'
}

function isUpcomingRace(race: RaceTableItem, now: dayjs.Dayjs) {
  const raceDateTime = getRaceDateTime(race)
  const startOfToday = now.startOf('day')

  if (raceDateTime.isSame(startOfToday, 'day')) {
    return true
  }

  if (!isRegisteredRace(race)) {
    return false
  }

  const daysSinceMonday = (startOfToday.day() + 6) % 7
  const startOfWeek = startOfToday.subtract(daysSinceMonday, 'day')
  const endOfWeek = startOfWeek.add(7, 'day')

  return raceDateTime.isAfter(now) && raceDateTime.isBefore(endOfWeek)
}

function removeUpcomingRaces(years: RaceTableYearGroup[], upcomingRaceIds: Set<string>) {
  return years
    .map((yearGroup) => ({
      ...yearGroup,
      races: yearGroup.races.filter((race) => !upcomingRaceIds.has(race.id)),
    }))
    .filter((yearGroup) => yearGroup.races.length > 0)
}

function getFallbackUpcomingRaces(races: RaceTableItem[], now: dayjs.Dayjs) {
  const nextRace = races
    .filter((race) => isRegisteredRace(race) && getRaceDateTime(race).isAfter(now))
    .sort((left, right) => getRaceDateTime(left).diff(getRaceDateTime(right)))[0]

  return nextRace ? [nextRace] : []
}

function filterYearsByRaceName(years: RaceTableYearGroup[], search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return years
  }

  return years
    .map((yearGroup) => ({
      ...yearGroup,
      races: yearGroup.races.filter((race) => race.name.toLowerCase().includes(normalizedSearch)),
    }))
    .filter((yearGroup) => yearGroup.races.length > 0)
}

function matchesSidebarFilters(race: RaceTableItem, filters: RaceFilters) {
  if (filters.statuses.length > 0 && (!race.raceStatus || !filters.statuses.includes(race.raceStatus))) {
    return false
  }

  if (filters.raceTypeIds.length > 0 && (!race.raceTypeId || !filters.raceTypeIds.includes(race.raceTypeId))) {
    return false
  }

  return true
}

function filterYearsBySidebarFilters(years: RaceTableYearGroup[], filters: RaceFilters) {
  if (filters.statuses.length === 0 && filters.raceTypeIds.length === 0) {
    return years
  }

  return years
    .map((yearGroup) => ({
      ...yearGroup,
      races: yearGroup.races.filter((race) => matchesSidebarFilters(race, filters)),
    }))
    .filter((yearGroup) => yearGroup.races.length > 0)
}

function extractRacesByStatus(years: RaceTableYearGroup[], status: string) {
  return years.flatMap((yearGroup) => yearGroup.races.filter((race) => race.raceStatus === status))
}

function removeRacesByStatus(years: RaceTableYearGroup[], status: string) {
  return years
    .map((yearGroup) => ({
      ...yearGroup,
      races: yearGroup.races.filter((race) => race.raceStatus !== status),
    }))
    .filter((yearGroup) => yearGroup.races.length > 0)
}

function sortInListRaces(races: RaceTableItem[]) {
  return [...races].sort((left, right) => {
    if (left.raceDate && right.raceDate) {
      return left.raceDate.localeCompare(right.raceDate)
    }

    if (left.raceDate) {
      return -1
    }

    if (right.raceDate) {
      return 1
    }

    return left.name.localeCompare(right.name)
  })
}

type RacesTableViewProps = {
  tableYearSelection: TableYearSelection
  filters: RaceFilters
  refreshKey?: number
  createOptions: RaceCreateOptions
  hideContent?: boolean
  bucketListOpen?: boolean
  onBucketListOpenChange?: (open: boolean) => void
  onBucketListCountChange?: (count: number) => void
  pendingUpdatesOpen?: boolean
  onPendingUpdatesOpenChange?: (open: boolean) => void
  onPendingUpdatesCountChange?: (count: number) => void
  onCreateOptionsChange?: (nextOptions: RaceCreateOptions) => void
}

export function RacesTableView({
  tableYearSelection,
  filters,
  refreshKey = 0,
  createOptions,
  hideContent = false,
  bucketListOpen,
  onBucketListOpenChange,
  onBucketListCountChange,
  pendingUpdatesOpen,
  onPendingUpdatesOpenChange,
  onPendingUpdatesCountChange,
  onCreateOptionsChange,
}: RacesTableViewProps) {
  const { token } = useAuth()
  const currentYear = dayjs().year()
  const [now, setNow] = useState(() => dayjs())
  const [years, setYears] = useState<RaceTableYearGroup[]>([])
  const [inListYears, setInListYears] = useState<RaceTableYearGroup[]>([])
  const [undatedRaces, setUndatedRaces] = useState<RaceTableItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBucketListLoading, setIsBucketListLoading] = useState(false)
  const [bucketListModalError, setBucketListModalError] = useState<string | null>(null)
  const [movingFutureRaceId, setMovingFutureRaceId] = useState<string | null>(null)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isPreparingEdit, setIsPreparingEdit] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceDetailResponse | null>(null)
  const [editStatusOverride, setEditStatusOverride] = useState<string | null>(null)
  const [editStatusOverrideLabel, setEditStatusOverrideLabel] = useState<string | null>(null)
  const [returnToDetailsAfterEditClose, setReturnToDetailsAfterEditClose] = useState(false)
  const [returnToBucketListAfterDetailsClose, setReturnToBucketListAfterDetailsClose] = useState(false)
  const [isPendingUpdatesModalOpenInternal, setIsPendingUpdatesModalOpenInternal] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [raceDetails, setRaceDetails] = useState<RaceDetailResponse | null>(null)
  const [selectedDetailsRace, setSelectedDetailsRace] = useState<RaceTableItem | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [racePendingDelete, setRacePendingDelete] = useState<RaceTableItem | null>(null)
  const [isDeletingRace, setIsDeletingRace] = useState(false)
  const [isInListModalOpenInternal, setIsInListModalOpenInternal] = useState(false)
  const [selectedBucketListRaceType, setSelectedBucketListRaceType] = useState<string | undefined>(undefined)
  const [openYearSections, setOpenYearSections] = useState<Record<number, boolean>>({})
  const raceDetailsCacheRef = useRef<Map<string, RaceDetailResponse>>(new Map())
  const hasLoadedTableDataRef = useRef(false)
  const isInListModalOpen = bucketListOpen ?? isInListModalOpenInternal
  const setIsInListModalOpen = onBucketListOpenChange ?? setIsInListModalOpenInternal
  const isPendingUpdatesModalOpen = pendingUpdatesOpen ?? isPendingUpdatesModalOpenInternal
  const setIsPendingUpdatesModalOpen = onPendingUpdatesOpenChange ?? setIsPendingUpdatesModalOpenInternal
  const shouldLoadTableData = !hideContent || isInListModalOpen || isPendingUpdatesModalOpen || !hasLoadedTableDataRef.current

  const visibleYears = useMemo(() => (
    tableYearSelection.allRaces
      ? years
      : years.filter((yearGroup) => tableYearSelection.selectedYears.includes(yearGroup.year))
  ), [tableYearSelection.allRaces, tableYearSelection.selectedYears, years])
  const visibleInListYears = useMemo(() => (
    tableYearSelection.allRaces
      ? inListYears
      : inListYears.filter((yearGroup) => tableYearSelection.selectedYears.includes(yearGroup.year))
  ), [inListYears, tableYearSelection.allRaces, tableYearSelection.selectedYears])
  const normalizedSearch = filters.search.trim().toLowerCase()
  const sidebarFilteredVisibleYears = useMemo(
    () => filterYearsBySidebarFilters(visibleYears, filters),
    [filters, visibleYears],
  )
  const filteredVisibleYears = useMemo(
    () => filterYearsByRaceName(sidebarFilteredVisibleYears, filters.search),
    [filters.search, sidebarFilteredVisibleYears],
  )
  const allowsUndatedRacesForYearFilter = tableYearSelection.allRaces
  const filteredVisibleInListYears = useMemo(
    () => filterYearsByRaceName(visibleInListYears, filters.search),
    [filters.search, visibleInListYears],
  )
  const filteredDatedInListRaces = useMemo(
    () => extractRacesByStatus(filteredVisibleInListYears, 'IN_LIST'),
    [filteredVisibleInListYears],
  )
  const filteredUndatedRaces = useMemo(() => (
    !allowsUndatedRacesForYearFilter
      ? []
      : normalizedSearch
      ? undatedRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
      : undatedRaces
  ), [allowsUndatedRacesForYearFilter, normalizedSearch, undatedRaces])
  const filteredInListRaces = useMemo(
    () => sortInListRaces([...filteredDatedInListRaces, ...filteredUndatedRaces]),
    [filteredDatedInListRaces, filteredUndatedRaces],
  )
  const bucketListRaceTypeOptions = useMemo(() => (
    Array.from(new Set(filteredInListRaces.map((race) => race.raceTypeName?.trim() || 'No race type')))
      .sort((left, right) => left.localeCompare(right))
  ), [filteredInListRaces])
  const visibleBucketListRaces = useMemo(() => (
    selectedBucketListRaceType
      ? filteredInListRaces.filter((race) => (race.raceTypeName?.trim() || 'No race type') === selectedBucketListRaceType)
      : filteredInListRaces
  ), [filteredInListRaces, selectedBucketListRaceType])
  const allFilteredVisibleRaces = useMemo(
    () => filteredVisibleYears.flatMap((yearGroup) => yearGroup.races),
    [filteredVisibleYears],
  )
  const allRaces = useMemo(
    () => years.flatMap((yearGroup) => yearGroup.races),
    [years],
  )
  const pendingUpdateRaces = useMemo(
    () => allRaces
      .filter((race) => shouldWarnAboutPastRaceStatus(race, now))
      .sort((left, right) => getRaceDateTime(left).diff(getRaceDateTime(right))),
    [allRaces, now],
  )
  const weekUpcomingRaces = useMemo(
    () => allFilteredVisibleRaces
      .filter((race) => isUpcomingRace(race, now))
      .sort((left, right) => getRaceDateTime(left).diff(getRaceDateTime(right))),
    [allFilteredVisibleRaces, now],
  )
  const baseUpcomingRaces = useMemo(
    () => (weekUpcomingRaces.length > 0 ? weekUpcomingRaces : getFallbackUpcomingRaces(allFilteredVisibleRaces, now)),
    [allFilteredVisibleRaces, now, weekUpcomingRaces],
  )
  const upcomingRaces = useMemo(() => (
    normalizedSearch
      ? baseUpcomingRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
      : baseUpcomingRaces
  ), [baseUpcomingRaces, normalizedSearch])
  const yearsWithoutInList = useMemo(
    () => removeRacesByStatus(filteredVisibleYears, 'IN_LIST'),
    [filteredVisibleYears],
  )
  const regularYears = useMemo(
    () => removeUpcomingRaces(yearsWithoutInList, new Set(upcomingRaces.map((race) => race.id))),
    [upcomingRaces, yearsWithoutInList],
  )
  const hasRacesForSelectedYears = useMemo(
    () => visibleYears.length > 0 || visibleInListYears.length > 0 || undatedRaces.length > 0,
    [undatedRaces.length, visibleInListYears.length, visibleYears.length],
  )
  const hasDisplayedRaces = useMemo(
    () => (
      upcomingRaces.length > 0
      || regularYears.length > 0
      || (isInListModalOpen && filteredInListRaces.length > 0)
    ),
    [filteredInListRaces.length, isInListModalOpen, regularYears.length, upcomingRaces.length],
  )

  const loadBucketListData = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) {
      setInListYears([])
      setUndatedRaces([])
      setIsBucketListLoading(false)
      return
    }

    try {
      if (!options?.silent) {
        setIsBucketListLoading(true)
      }
      const bucketListPayload = await fetchRaceTable(token, {
        ...EMPTY_RACE_FILTERS,
        statuses: ['IN_LIST'],
      })

      setInListYears(bucketListPayload.years ?? [])
      setUndatedRaces(bucketListPayload.undatedRaces ?? [])
    } catch {
      setInListYears([])
      setUndatedRaces([])
    } finally {
      if (!options?.silent) {
        setIsBucketListLoading(false)
      }
    }
  }, [token])

  const loadTableData = async (options?: { silent?: boolean }) => {
    if (!token) {
      setYears([])
      setIsLoading(false)
      return
    }

    try {
      if (!options?.silent) {
        setIsLoading(true)
      }
      const tablePayload = await fetchRaceTable(token, EMPTY_RACE_FILTERS)

      setYears(tablePayload.years ?? [])
      setError(null)
      hasLoadedTableDataRef.current = true
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      if (!options?.silent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!shouldLoadTableData) {
      return
    }

    void loadTableData()
  }, [refreshKey, shouldLoadTableData, token])

  useEffect(() => {
    void loadBucketListData()
  }, [loadBucketListData, refreshKey])

  useEffect(() => {
    if (hideContent) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(dayjs())
    }, 60000)

    return () => window.clearInterval(intervalId)
  }, [hideContent])

  useEffect(() => {
    onBucketListCountChange?.(inListYears.flatMap((yearGroup) => yearGroup.races).length + undatedRaces.length)
  }, [inListYears, onBucketListCountChange, undatedRaces.length])

  useEffect(() => {
    onPendingUpdatesCountChange?.(pendingUpdateRaces.length)
  }, [onPendingUpdatesCountChange, pendingUpdateRaces.length])

  useEffect(() => {
    setOpenYearSections((current) => {
      const next = { ...current }
      let changed = false

      regularYears.forEach((yearGroup) => {
        if (!(yearGroup.year in next)) {
          next[yearGroup.year] = true
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [regularYears])

  const handleOpenEdit = useCallback(async (
    race: RaceTableItem,
    options?: {
      raceStatusOverride?: string | null
      raceStatusOverrideLabel?: string | null
    },
  ) => {
    if (!token) {
      return
    }

    try {
      const cachedDetails = raceDetailsCacheRef.current.get(race.id)
      setIsPreparingEdit(!cachedDetails)
      setError(null)
      setReturnToDetailsAfterEditClose(false)
      setEditStatusOverride(options?.raceStatusOverride ?? null)
      setEditStatusOverrideLabel(options?.raceStatusOverrideLabel ?? null)
      setEditingRace(cachedDetails ?? null)
      setIsEditDrawerOpen(true)

      if (cachedDetails) {
        return
      }

      const details = await fetchRaceDetail(race.id, token)
      raceDetailsCacheRef.current.set(race.id, details)
      setEditingRace(details)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this race for editing right now.')
    } finally {
      setIsPreparingEdit(false)
    }
  }, [token])

  const handleOpenDetails = useCallback(async (race: RaceTableItem, options?: { source?: 'table' | 'bucket-list' }) => {
    if (!token) {
      return
    }

    try {
      setReturnToBucketListAfterDetailsClose(options?.source === 'bucket-list')
      const cachedDetails = raceDetailsCacheRef.current.get(race.id)
      setIsDetailsOpen(true)
      setDetailsError(null)
      setSelectedDetailsRace(race)
      setRaceDetails(cachedDetails ?? null)
      setIsDetailsLoading(!cachedDetails)

      if (cachedDetails) {
        return
      }

      const details = await fetchRaceDetail(race.id, token)
      raceDetailsCacheRef.current.set(race.id, details)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setDetailsError(loadError instanceof Error ? loadError.message : 'Could not load this race right now.')
    } finally {
      setIsDetailsLoading(false)
    }
  }, [token])

  const handleRequestDelete = useCallback((race: RaceTableItem) => {
    setRacePendingDelete(race)
  }, [])

  const handleDeleteRace = useCallback(async (race: RaceTableItem) => {
    if (!token) {
      return
    }

    try {
      setIsDeletingRace(true)
      setError(null)
      await deleteRace(race.id, token)
      raceDetailsCacheRef.current.delete(race.id)
      setRacePendingDelete(null)
      setIsDetailsOpen(false)
      setRaceDetails(null)
      setSelectedDetailsRace(null)
      setDetailsError(null)
      await Promise.all([
        loadTableData(),
        loadBucketListData(),
      ])
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this race right now.')
    } finally {
      setIsDeletingRace(false)
    }
  }, [loadBucketListData, loadTableData, token])

  const handleMoveFutureRace = useCallback(async (
    race: RaceTableItem,
    nextStatus: 'REGISTERED' | 'NOT_REGISTERED',
    nextStatusLabel: string,
  ) => {
    if (!token) {
      return
    }

    if (!race.raceDate) {
      setBucketListModalError(null)
      setIsInListModalOpen(false)
      void handleOpenEdit(race, {
        raceStatusOverride: nextStatus,
        raceStatusOverrideLabel: nextStatusLabel,
      })
      return
    }

    try {
      setMovingFutureRaceId(race.id)
      setBucketListModalError(null)
      const details = raceDetailsCacheRef.current.get(race.id) ?? await fetchRaceDetail(race.id, token)
      raceDetailsCacheRef.current.set(race.id, details)
      await updateRaceTableItem(race.id, buildUpdatePayloadFromDetails(details, nextStatus), token)
      raceDetailsCacheRef.current.delete(race.id)
      await Promise.all([
        loadTableData({ silent: true }),
        loadBucketListData({ silent: true }),
      ])
    } catch (moveError) {
      setBucketListModalError(moveError instanceof Error ? moveError.message : `Could not move this race to ${nextStatusLabel}.`)
    } finally {
      setMovingFutureRaceId(null)
    }
  }, [handleOpenEdit, loadBucketListData, loadTableData, token])

  const handleConfirmDelete = useCallback(async () => {
    if (!racePendingDelete) {
      return
    }

    await handleDeleteRace(racePendingDelete)
  }, [handleDeleteRace, racePendingDelete])

  const getRaceActionsMenu = useCallback((race: RaceTableItem) => ({
    items: [
      {
        key: 'edit',
        label: 'Edit race',
        icon: <FontAwesomeIcon icon={faPenToSquare} />,
      },
      {
        key: 'delete',
        label: 'Delete race',
        icon: <FontAwesomeIcon icon={faTrashCan} />,
        danger: true,
      },
    ],
    onClick: ({ key, domEvent }: Parameters<NonNullable<MenuProps['onClick']>>[0]) => {
      domEvent.preventDefault()
      domEvent.stopPropagation()

      if (key === 'edit') {
        void handleOpenEdit(race)
        return
      }

      if (key === 'delete') {
        handleRequestDelete(race)
      }
    },
  }), [handleOpenEdit, handleRequestDelete])

  const tableContent = useMemo(() => (
    <>
      {isLoading ? (
        <div className={styles.loadingState}>
          <Space size="middle">
            <Spin />
            <span className={styles.loadingText}>Loading races</span>
          </Space>
        </div>
      ) : null}

      {isPreparingEdit ? (
        <Space>
          <Spin size="small" />
          <span>Loading race editor</span>
        </Space>
      ) : null}

      {error ? (
        <Alert type="error" showIcon message="Could not load the race table" description={error} />
      ) : null}

      {!isLoading && years.length === 0 && inListYears.length === 0 && undatedRaces.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races available." />
        </div>
      ) : null}

      {!isLoading && (years.length > 0 || inListYears.length > 0) && visibleYears.length === 0 && filteredInListRaces.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty
            description={tableYearSelection.selectedYears.length === 1 && tableYearSelection.selectedYears[0] === currentYear
              ? `No races available for ${currentYear}.`
              : 'No races available for the selected years.'}
          />
        </div>
      ) : null}

      {!isLoading && !error && !hasDisplayedRaces && hasRacesForSelectedYears ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races match the current filters." />
        </div>
      ) : null}

      {!isLoading && filteredVisibleYears.length > 0 && upcomingRaces.length > 0 ? (
        <section className={styles.yearSection}>
          <div className={styles.yearCard}>
            <div className={styles.monthSection}>
              <div className={styles.raceList}>
                {upcomingRaces.map((race) => {
                  const isCompactInlineCard = shouldUseInlineCompactMeta(race.raceStatus)

                  return (
                    <article
                      key={race.id}
                      className={`${styles.raceRow} ${styles.raceRowComingUp} ${getRaceSurfaceClassName(race.raceStatus)} ${isCompactInlineCard ? styles.raceRowInlineCompact : ''}`.trim()}
                      onClick={() => void handleOpenDetails(race)}
                    >
                      {isCompactInlineCard ? (
                        <div className={styles.compactDateLabel}>{getCompactInlineDateLabel(race.raceDate)}</div>
                      ) : (
                        <div className={styles.dateBadge}>
                          <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                          <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                        </div>
                      )}

                      <div className={styles.raceContent}>
                        <div className={styles.raceTopRow}>
                          <div className={styles.raceTitleBlock}>
                            <div className={isCompactInlineCard ? styles.compactHeaderLine : undefined}>
                              <OverflowTooltip title={race.name} className={styles.raceCardTitle}>
                                {race.name}
                              </OverflowTooltip>
                              {isCompactInlineCard ? renderCompactInlineMeta(race) : null}
                            </div>
                          </div>

                          <div className={styles.raceTopMeta}>
                            {renderPastRaceStatusWarning(race, now, (selectedRace) => {
                              void handleOpenEdit(selectedRace)
                            })}
                            <span className={`${styles.raceStatusBadge} ${getRaceStatusClassName(race.raceStatus)}`.trim()}>
                              {getRaceStatusLabel(race.raceStatus)}
                            </span>
                            <Dropdown
                              menu={getRaceActionsMenu(race)}
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <Button
                                type="text"
                                className={styles.moreAction}
                                aria-label="Race actions"
                                icon={<FontAwesomeIcon icon={faEllipsisVertical} />}
                                onClick={(event) => event.stopPropagation()}
                              />
                            </Dropdown>
                          </div>
                        </div>

                        {!isCompactInlineCard ? (
                          <div className={styles.raceBottomRow}>
                            {renderRaceMetrics(race)}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && filteredVisibleYears.length > 0 ? regularYears.map((yearGroup) => (
        <section key={yearGroup.year} className={styles.yearSection}>
          <button
            type="button"
            className={`${styles.yearHeader} ${styles.yearHeaderButton}`.trim()}
            onClick={() => setOpenYearSections((current) => ({
              ...current,
              [yearGroup.year]: !(current[yearGroup.year] ?? true),
            }))}
            aria-expanded={openYearSections[yearGroup.year] ?? true}
            aria-label={(openYearSections[yearGroup.year] ?? true) ? `Collapse ${yearGroup.year} section` : `Expand ${yearGroup.year} section`}
          >
            <span className={styles.yearHeaderLineLeft} aria-hidden="true" />
            <span className={styles.yearHeaderContent}>
              <h3 className={`${styles.yearTitle} ${styles.yearNumberTitle}`.trim()}>{yearGroup.year}</h3>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={(openYearSections[yearGroup.year] ?? true) ? styles.collapseIconOpen : styles.collapseIcon}
              />
            </span>
            <span className={styles.yearHeaderLineRight} aria-hidden="true" />
          </button>

          {(openYearSections[yearGroup.year] ?? true) ? (
            <div className={styles.yearCard}>
              {groupRacesByMonth(yearGroup.races).map((monthGroup) => (
                <div key={monthGroup.key} className={styles.monthSection}>
                  <div className={styles.raceList}>
                    {monthGroup.races.map((race) => {
                      const isTodayRace = race.raceDate === now.format('YYYY-MM-DD')
                      const isCompactInlineCard = shouldUseInlineCompactMeta(race.raceStatus)

                      return (
                        <article
                          key={race.id}
                          className={isTodayRace
                            ? `${styles.raceRow} ${styles.raceRowToday} ${getRaceSurfaceClassName(race.raceStatus)} ${isCompactInlineCard ? styles.raceRowInlineCompact : ''}`.trim()
                            : `${styles.raceRow} ${getRaceSurfaceClassName(race.raceStatus)} ${isCompactInlineCard ? styles.raceRowInlineCompact : ''}`.trim()}
                          onClick={() => void handleOpenDetails(race)}
                        >
                          {isCompactInlineCard ? (
                            <div className={styles.compactDateLabel}>{getCompactInlineDateLabel(race.raceDate)}</div>
                          ) : (
                            <div className={styles.dateBadge}>
                              <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                              <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                            </div>
                          )}

                          <div className={styles.raceContent}>
                            <div className={styles.raceTopRow}>
                              <div className={styles.raceTitleBlock}>
                                <div className={isCompactInlineCard ? styles.compactHeaderLine : undefined}>
                                  <OverflowTooltip title={race.name} className={styles.raceCardTitle}>
                                    {race.name}
                                  </OverflowTooltip>
                                  {isCompactInlineCard ? renderCompactInlineMeta(race) : null}
                                </div>
                              </div>

                              <div className={styles.raceTopMeta}>
                                {renderPastRaceStatusWarning(race, now, (selectedRace) => {
                                  void handleOpenEdit(selectedRace)
                                })}
                                <span className={`${styles.raceStatusBadge} ${getRaceStatusClassName(race.raceStatus)}`.trim()}>
                                  {getRaceStatusLabel(race.raceStatus)}
                                </span>
                                <Dropdown
                                  menu={getRaceActionsMenu(race)}
                                  trigger={['click']}
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="text"
                                    className={styles.moreAction}
                                    aria-label="Race actions"
                                    icon={<FontAwesomeIcon icon={faEllipsisVertical} />}
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                </Dropdown>
                              </div>
                            </div>

                            {!isCompactInlineCard ? (
                              <div className={styles.raceBottomRow}>
                                {renderRaceMetrics(race)}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )) : null}
    </>
  ), [
    currentYear,
    error,
    filteredInListRaces.length,
    hasDisplayedRaces,
    hasRacesForSelectedYears,
    filteredVisibleYears.length,
    getRaceActionsMenu,
    handleOpenDetails,
    inListYears.length,
    isLoading,
    isPreparingEdit,
    now,
    openYearSections,
    regularYears,
    tableYearSelection,
    upcomingRaces,
    undatedRaces.length,
    visibleInListYears.length,
    visibleYears,
    years.length,
  ])

  return (
    <Card className={styles.pageCard} variant="borderless" style={hideContent ? { display: 'none' } : undefined}>
      {tableContent}

      <AddRaceDrawer
        mode="edit"
        open={isEditDrawerOpen}
        raceId={editingRace?.id ?? null}
        initialRace={editingRace}
        raceStatusOverride={editStatusOverride}
        raceStatusOverrideLabel={editStatusOverrideLabel}
        isLoadingInitialRace={isPreparingEdit}
        createOptions={createOptions}
        onCreateOptionsChange={onCreateOptionsChange}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          setEditStatusOverride(null)
          setEditStatusOverrideLabel(null)
          if (returnToDetailsAfterEditClose) {
            setIsDetailsOpen(true)
            setReturnToDetailsAfterEditClose(false)
          }
        }}
        onCreated={async () => {
          const editedRaceId = editingRace?.id ?? selectedDetailsRace?.id ?? null
          const shouldReturnToDetails = returnToDetailsAfterEditClose && editedRaceId !== null

          setIsEditDrawerOpen(false)
          setEditingRace(null)
          setEditStatusOverride(null)
          setEditStatusOverrideLabel(null)

          if (editedRaceId) {
            raceDetailsCacheRef.current.delete(editedRaceId)
          }

          if (shouldReturnToDetails) {
            setIsDetailsOpen(true)
            setIsDetailsLoading(true)
            setDetailsError(null)
          }

          setReturnToDetailsAfterEditClose(false)

          try {
            await Promise.all([
              loadTableData(),
              loadBucketListData(),
            ])

            if (!editedRaceId || !token) {
              return
            }

            const updatedDetails = await fetchRaceDetail(editedRaceId, token)
            raceDetailsCacheRef.current.set(editedRaceId, updatedDetails)
            setRaceDetails(updatedDetails)
            setSelectedDetailsRace((current) => (
              current && current.id === editedRaceId
                ? {
                  ...current,
                  raceDate: updatedDetails.race.raceDate,
                  raceTime: updatedDetails.race.raceTime,
                  raceStatus: updatedDetails.race.raceStatus,
                  name: updatedDetails.race.name,
                  location: updatedDetails.race.location,
                  circuitId: updatedDetails.race.circuitId,
                  circuitName: updatedDetails.race.circuitName,
                  raceTypeId: updatedDetails.race.raceTypeId,
                  raceTypeName: updatedDetails.race.raceTypeName,
                  officialTimeSeconds: updatedDetails.results.officialTimeSeconds,
                  chipTimeSeconds: updatedDetails.results.chipTimeSeconds,
                  pacePerKmSeconds: updatedDetails.results.pacePerKmSeconds,
                }
                : current
            ))
          } catch (loadError) {
            if (shouldReturnToDetails) {
              setRaceDetails(null)
              setDetailsError(loadError instanceof Error ? loadError.message : 'Could not refresh this race right now.')
            } else {
              setError(loadError instanceof Error ? loadError.message : 'Could not refresh this race right now.')
            }
          } finally {
            if (shouldReturnToDetails) {
              setIsDetailsLoading(false)
            }
          }
        }}
      />

      <Modal
        title="Delete race?"
        open={racePendingDelete != null}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        confirmLoading={isDeletingRace}
        onOk={() => void handleConfirmDelete()}
        onCancel={() => {
          if (isDeletingRace) {
            return
          }

          setRacePendingDelete(null)
        }}
      >
        <p className={styles.modalHint}>
          {racePendingDelete
            ? `This will permanently delete "${racePendingDelete.name}".`
            : 'This will permanently delete this race.'}
        </p>
      </Modal>

      <Modal
        open={isInListModalOpen}
        title={(
          <div className={styles.bucketListModalHeader}>
            <span className={styles.bucketListModalTitle}>Future Races</span>
            <Select
              allowClear
              showSearch
              className={styles.bucketListFilter}
              placeholder="Filter race type"
              optionFilterProp="label"
              value={selectedBucketListRaceType}
              onChange={(value) => setSelectedBucketListRaceType(value)}
              options={bucketListRaceTypeOptions.map((raceTypeName) => ({
                value: raceTypeName,
                label: raceTypeName,
              }))}
            />
          </div>
        )}
        footer={null}
        onCancel={() => {
          setIsInListModalOpen(false)
          setSelectedBucketListRaceType(undefined)
          setBucketListModalError(null)
        }}
        width={980}
      >
        <div className={styles.inListModalList}>
          {bucketListModalError ? (
            <Alert
              type="error"
              showIcon
              message="Could not update this future race"
              description={bucketListModalError}
              className={styles.bucketListModalAlert}
            />
          ) : null}

          {isBucketListLoading ? (
            <div className={styles.loadingState}>
              <Space size="middle">
                <Spin />
                <span className={styles.loadingText}>Updating bucket list</span>
              </Space>
            </div>
          ) : null}

          {!isBucketListLoading ? (
            <div className={styles.bucketListList}>
              {visibleBucketListRaces.map((race) => (
                <div
                  key={race.id}
                  className={[
                    styles.bucketListRow,
                    styles.clickableBucketListRow,
                    movingFutureRaceId === race.id ? styles.bucketListRowUpdating : '',
                  ].join(' ').trim()}
                  onClick={() => {
                    if (movingFutureRaceId != null) {
                      return
                    }
                    setIsInListModalOpen(false)
                    void handleOpenDetails(race, { source: 'bucket-list' })
                  }}
                >
                        <div className={styles.inListModalHeader}>
                          <div className={styles.inListModalMain}>
                            <div className={styles.inListModalTitleBlock}>
                              <div className={styles.inListModalTitleRow}>
                                <OverflowTooltip title={race.name} className={styles.inListModalTitle}>
                                  {race.name}
                                </OverflowTooltip>
                                <span className={`${styles.raceStatusBadge} ${getRaceStatusClassName(race.raceStatus)}`.trim()}>
                                  {race.raceTypeName ?? '-'}
                                </span>
                              </div>
                              <div className={styles.inListModalSubtitle}>
                                {race.raceDate ? <span>{getShortDateWithYear(race.raceDate)}</span> : null}
                                {race.location ? <span>{race.location}</span> : null}
                              </div>
                            </div>
                          </div>

                          <div className={styles.inListModalActions}>
                            {movingFutureRaceId === race.id ? (
                              <div className={styles.bucketListInlineLoading}>
                                <Spin size="small" />
                                <span>Updating...</span>
                              </div>
                            ) : null}

                            <div className={styles.bucketListQuickActions}>
                              <Button
                                size="small"
                                className={styles.bucketListQuickActionButton}
                                loading={movingFutureRaceId === race.id}
                                disabled={movingFutureRaceId != null}
                                style={{
                                  color: getRaceStatusColor('REGISTERED'),
                                  borderColor: getRaceStatusBackgroundColor('REGISTERED'),
                                  background: getRaceStatusBackgroundColor('REGISTERED'),
                                }}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleMoveFutureRace(race, 'REGISTERED', 'Registered')
                                }}
                              >
                                Move to Registered
                              </Button>
                              <Button
                                size="small"
                                className={styles.bucketListQuickActionButton}
                                loading={movingFutureRaceId === race.id}
                                disabled={movingFutureRaceId != null}
                                style={{
                                  color: getRaceStatusColor('NOT_REGISTERED'),
                                  borderColor: getRaceStatusBackgroundColor('NOT_REGISTERED'),
                                  background: getRaceStatusBackgroundColor('NOT_REGISTERED'),
                                }}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleMoveFutureRace(race, 'NOT_REGISTERED', 'Waiting for registration')
                                }}
                              >
                                Move to Waiting
                              </Button>
                            </div>

                            <div className={styles.bucketListIconActions}>
                              <Button
                                type="text"
                                className={`${styles.bucketListActionButton} ${styles.bucketListEditAction}`.trim()}
                                aria-label="Edit race"
                                icon={<FontAwesomeIcon icon={faPenToSquare} />}
                                disabled={movingFutureRaceId != null}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setIsInListModalOpen(false)
                                  void handleOpenEdit(race)
                                }}
                              />
                              <Button
                                type="text"
                                danger
                                className={`${styles.bucketListActionButton} ${styles.bucketListDeleteAction}`.trim()}
                                aria-label="Delete race"
                                icon={<FontAwesomeIcon icon={faTrashCan} />}
                                disabled={movingFutureRaceId != null}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setIsInListModalOpen(false)
                                  void handleDeleteRace(race)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isBucketListLoading && visibleBucketListRaces.length === 0 ? (
            <Empty description="Nao existem corridas com esse status." />
          ) : null}
        </div>
      </Modal>

      <Modal
        open={isPendingUpdatesModalOpen}
        title="Races Needing Updates"
        footer={null}
        onCancel={() => setIsPendingUpdatesModalOpen(false)}
        width={980}
      >
        <div className={styles.pendingUpdatesModalList}>
          {pendingUpdateRaces.map((race) => {
            const isCompactInlineCard = shouldUseInlineCompactMeta(race.raceStatus)

            return (
              <article
                key={race.id}
                className={`${styles.raceRow} ${getRaceSurfaceClassName(race.raceStatus)} ${isCompactInlineCard ? styles.raceRowInlineCompact : ''}`.trim()}
                onClick={() => void handleOpenDetails(race)}
              >
                {isCompactInlineCard ? (
                  <div className={styles.compactDateLabel}>{getCompactInlineDateLabel(race.raceDate)}</div>
                ) : (
                  <div className={styles.dateBadge}>
                    <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                    <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                  </div>
                )}

                <div className={styles.raceContent}>
                  <div className={styles.raceTopRow}>
                    <div className={styles.raceTitleBlock}>
                      <div className={isCompactInlineCard ? styles.compactHeaderLine : undefined}>
                        <OverflowTooltip title={race.name} className={styles.raceCardTitle}>
                          {race.name}
                        </OverflowTooltip>
                        {isCompactInlineCard ? renderCompactInlineMeta(race) : null}
                      </div>
                    </div>

                    <div className={styles.raceTopMeta}>
                      {renderPastRaceStatusWarning(race, now, (selectedRace) => {
                        void handleOpenEdit(selectedRace)
                      })}
                      <span className={`${styles.raceStatusBadge} ${getRaceStatusClassName(race.raceStatus)}`.trim()}>
                        {getRaceStatusLabel(race.raceStatus)}
                      </span>
                      <Dropdown
                        menu={getRaceActionsMenu(race)}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          className={styles.moreAction}
                          aria-label="Race actions"
                          icon={<FontAwesomeIcon icon={faEllipsisVertical} />}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  </div>

                  {!isCompactInlineCard ? (
                    <div className={styles.raceBottomRow}>
                      {renderRaceMetrics(race)}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}

          {pendingUpdateRaces.length === 0 ? (
            <Empty description="No races are waiting for a status update." />
          ) : null}
        </div>
      </Modal>

      <RaceDetailsDrawer
        open={isDetailsOpen}
        race={raceDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        isDeleting={isDeletingRace}
        onEdit={() => {
          if (!selectedDetailsRace) {
            return
          }

          setIsDetailsOpen(false)
          setDetailsError(null)
          setReturnToDetailsAfterEditClose(true)
          if (raceDetails?.id === selectedDetailsRace.id) {
            setEditingRace(raceDetails)
            setIsEditDrawerOpen(true)
            return
          }

          void handleOpenEdit(selectedDetailsRace)
        }}
        onDelete={() => {
          if (!selectedDetailsRace) {
            return
          }

          handleRequestDelete(selectedDetailsRace)
        }}
        onClose={() => {
          setIsDetailsOpen(false)
          setRaceDetails(null)
          setSelectedDetailsRace(null)
          setDetailsError(null)
          setReturnToDetailsAfterEditClose(false)
          if (returnToBucketListAfterDetailsClose) {
            setIsInListModalOpen(true)
          }
          setReturnToBucketListAfterDetailsClose(false)
        }}
      />

    </Card>
  )
}
