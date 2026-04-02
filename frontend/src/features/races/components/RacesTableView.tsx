import { faChevronDown, faEllipsisVertical, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
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
} from '../services/racesTableService'
import type { RaceFilters } from '../types/raceFilters'
import type {
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
      return 'In list'
    case 'NOT_REGISTERED':
      return 'Not registered'
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

type OverflowTooltipProps = {
  title: string
  className?: string
  children: ReactNode
}

function OverflowTooltip({ title, className, children }: OverflowTooltipProps) {
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = contentRef.current
    if (!element) {
      return
    }

    const updateOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
    }

    updateOverflow()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateOverflow)
      return () => window.removeEventListener('resize', updateOverflow)
    }

    const resizeObserver = new ResizeObserver(() => updateOverflow())
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [title])

  return (
    <Tooltip title={isOverflowing ? title : null}>
      <span ref={contentRef} className={className}>
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
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isPreparingEdit, setIsPreparingEdit] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceDetailResponse | null>(null)
  const [returnToDetailsAfterEditClose, setReturnToDetailsAfterEditClose] = useState(false)
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
  const [openBucketListSections, setOpenBucketListSections] = useState<Record<string, boolean>>({})
  const isInListModalOpen = bucketListOpen ?? isInListModalOpenInternal
  const setIsInListModalOpen = onBucketListOpenChange ?? setIsInListModalOpenInternal

  const visibleYears = tableYearSelection.allRaces
    ? years
    : years.filter((yearGroup) => tableYearSelection.selectedYears.includes(yearGroup.year))
  const visibleInListYears = tableYearSelection.allRaces
    ? inListYears
    : inListYears.filter((yearGroup) => tableYearSelection.selectedYears.includes(yearGroup.year))
  const normalizedSearch = filters.search.trim().toLowerCase()
  const filteredVisibleYears = filterYearsByRaceName(visibleYears, filters.search)
  const allowsUndatedRacesForYearFilter = tableYearSelection.allRaces
  const filteredVisibleInListYears = filterYearsByRaceName(visibleInListYears, filters.search)
  const filteredDatedInListRaces = extractRacesByStatus(filteredVisibleInListYears, 'IN_LIST')
  const filteredUndatedRaces = !allowsUndatedRacesForYearFilter
    ? []
    : normalizedSearch
    ? undatedRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
    : undatedRaces
  const filteredInListRaces = sortInListRaces([...filteredDatedInListRaces, ...filteredUndatedRaces])
  const bucketListGroups = useMemo(() => {
    const groupMap = new Map<string, RaceTableItem[]>()

    filteredInListRaces.forEach((race) => {
      const key = race.raceTypeName?.trim() || 'No race type'
      const currentGroup = groupMap.get(key)
      if (currentGroup) {
        currentGroup.push(race)
        return
      }

      groupMap.set(key, [race])
    })

    return Array.from(groupMap.entries())
      .map(([raceTypeName, races]) => ({ raceTypeName, races }))
      .sort((left, right) => left.raceTypeName.localeCompare(right.raceTypeName))
  }, [filteredInListRaces])
  const visibleBucketListGroups = selectedBucketListRaceType
    ? bucketListGroups.filter((group) => group.raceTypeName === selectedBucketListRaceType)
    : bucketListGroups
  const allVisibleRaces = visibleYears.flatMap((yearGroup) => yearGroup.races)
  const weekUpcomingRaces = allVisibleRaces
    .filter((race) => isUpcomingRace(race, now))
    .sort((left, right) => getRaceDateTime(left).diff(getRaceDateTime(right)))
  const baseUpcomingRaces = weekUpcomingRaces.length > 0
    ? weekUpcomingRaces
    : getFallbackUpcomingRaces(allVisibleRaces, now)
  const upcomingRaces = normalizedSearch
    ? baseUpcomingRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
    : baseUpcomingRaces
  const yearsWithoutInList = removeRacesByStatus(filteredVisibleYears, 'IN_LIST')
  const regularYears = removeUpcomingRaces(yearsWithoutInList, new Set(upcomingRaces.map((race) => race.id)))
  const loadTableData = async () => {
    if (!token) {
      setYears([])
      setInListYears([])
      setUndatedRaces([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const [tablePayload, undatedPayload] = await Promise.all([
        fetchRaceTable(token, {
          ...filters,
        }),
        fetchRaceTable(token, {
          ...filters,
          statuses: ['IN_LIST'],
        }),
      ])

      setYears(tablePayload.years ?? [])
      setInListYears(undatedPayload?.years ?? [])
      setUndatedRaces(undatedPayload?.undatedRaces ?? [])
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTableData()
  }, [filters, refreshKey, token])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    onBucketListCountChange?.(filteredInListRaces.length)
  }, [filteredInListRaces.length, onBucketListCountChange])

  useEffect(() => {
    setOpenBucketListSections((current) => {
      const next = { ...current }
      let changed = false

      bucketListGroups.forEach((group) => {
        if (!(group.raceTypeName in next)) {
          next[group.raceTypeName] = false
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [bucketListGroups])

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

  const handleOpenEdit = async (race: RaceTableItem) => {
    if (!token) {
      return
    }

    try {
      setIsPreparingEdit(true)
      setError(null)
      setReturnToDetailsAfterEditClose(false)
      const details = await fetchRaceDetail(race.id, token)
      setEditingRace(details)
      setIsEditDrawerOpen(true)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this race for editing right now.')
    } finally {
      setIsPreparingEdit(false)
    }
  }

  const handleOpenDetails = async (race: RaceTableItem) => {
    if (!token) {
      return
    }

    try {
      setIsDetailsOpen(true)
      setIsDetailsLoading(true)
      setDetailsError(null)
      setSelectedDetailsRace(race)
      const details = await fetchRaceDetail(race.id, token)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setDetailsError(loadError instanceof Error ? loadError.message : 'Could not load this race right now.')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleRequestDelete = (race: RaceTableItem) => {
    setRacePendingDelete(race)
  }

  const handleConfirmDelete = async () => {
    if (!token || !racePendingDelete) {
      return
    }

    try {
      setIsDeletingRace(true)
      setError(null)
      await deleteRace(racePendingDelete.id, token)
      setRacePendingDelete(null)
      setIsDetailsOpen(false)
      setRaceDetails(null)
      setSelectedDetailsRace(null)
      setDetailsError(null)
      await loadTableData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this race right now.')
    } finally {
      setIsDeletingRace(false)
    }
  }

  const getRaceActionsMenu = (race: RaceTableItem) => ({
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
  })

  return (
    <Card className={styles.pageCard} variant="borderless" style={hideContent ? { display: 'none' } : undefined}>
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

      {!isLoading && regularYears.length === 0 && filteredInListRaces.length === 0 && (visibleYears.length > 0 || visibleInListYears.length > 0 || undatedRaces.length > 0) ? (
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
                  return (
                    <article
                      key={race.id}
                      className={`${styles.raceRow} ${styles.raceRowComingUp}`.trim()}
                      onClick={() => void handleOpenDetails(race)}
                    >
                      <div className={styles.dateBadge}>
                        <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                        <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                      </div>

                        <div className={styles.raceContent}>
                          <div className={styles.raceTopRow}>
                            <div className={styles.raceTitleBlock}>
                              <OverflowTooltip title={race.name} className={styles.raceCardTitle}>
                                {race.name}
                              </OverflowTooltip>
                            </div>

                          <div className={styles.raceTopMeta}>
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

                        <div className={styles.raceBottomRow}>
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

                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Official time</span>
                              {renderMetricValueWithTooltip(
                                formatDuration(race.officialTimeSeconds),
                                formatDurationText(race.officialTimeSeconds),
                              )}
                            </div>

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
                          </div>

                        </div>
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

                    return (
                      <article
                        key={race.id}
                        className={isTodayRace ? `${styles.raceRow} ${styles.raceRowToday}` : styles.raceRow}
                        onClick={() => void handleOpenDetails(race)}
                      >
                        <div className={styles.dateBadge}>
                          <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                          <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                        </div>

                        <div className={styles.raceContent}>
                          <div className={styles.raceTopRow}>
                            <div className={styles.raceTitleBlock}>
                              <OverflowTooltip title={race.name} className={styles.raceCardTitle}>
                                {race.name}
                              </OverflowTooltip>
                            </div>

                            <div className={styles.raceTopMeta}>
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

                          <div className={styles.raceBottomRow}>
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

                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Official time</span>
                                {renderMetricValueWithTooltip(
                                  formatDuration(race.officialTimeSeconds),
                                  formatDurationText(race.officialTimeSeconds),
                                )}
                              </div>

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
                            </div>

                          </div>
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

      <AddRaceDrawer
        mode="edit"
        open={isEditDrawerOpen}
        raceId={editingRace?.id ?? null}
        initialRace={editingRace}
        createOptions={createOptions}
        onCreateOptionsChange={onCreateOptionsChange}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          if (returnToDetailsAfterEditClose) {
            setIsDetailsOpen(true)
            setReturnToDetailsAfterEditClose(false)
          }
        }}
        onCreated={async () => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          setReturnToDetailsAfterEditClose(false)
          await loadTableData()
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
            <span className={styles.bucketListModalTitle}>Bucket List</span>
            <Select
              allowClear
              showSearch
              className={styles.bucketListFilter}
              placeholder="Filter race type"
              optionFilterProp="label"
              value={selectedBucketListRaceType}
              onChange={(value) => setSelectedBucketListRaceType(value)}
              options={bucketListGroups.map((group) => ({
                value: group.raceTypeName,
                label: group.raceTypeName,
              }))}
            />
          </div>
        )}
        footer={null}
        onCancel={() => {
          setIsInListModalOpen(false)
          setSelectedBucketListRaceType(undefined)
        }}
        width={860}
      >
        <div className={styles.inListModalList}>
          {visibleBucketListGroups.map((group) => {
            const isOpen = openBucketListSections[group.raceTypeName] ?? false

            return (
              <div key={group.raceTypeName} className={styles.bucketListGroup}>
                <button
                  type="button"
                  className={styles.bucketListGroupHeader}
                  onClick={() => setOpenBucketListSections((current) => ({
                    ...current,
                    [group.raceTypeName]: !(current[group.raceTypeName] ?? false),
                  }))}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? `Collapse ${group.raceTypeName}` : `Expand ${group.raceTypeName}`}
                >
                  <span className={styles.bucketListGroupTitle}>{group.raceTypeName}</span>
                  <span className={styles.bucketListGroupMeta}>
                    <span className={styles.bucketListGroupCount}>
                      {group.races.length} race{group.races.length === 1 ? '' : 's'}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className={isOpen ? styles.collapseIconOpen : styles.collapseIcon} />
                  </span>
                </button>

                {isOpen ? (
                  <div className={styles.bucketListGroupBody}>
                    {group.races.map((race) => (
                      <div
                        key={race.id}
                        className={`${styles.bucketListRow} ${styles.clickableBucketListRow}`.trim()}
                        onClick={() => {
                          setIsInListModalOpen(false)
                          void handleOpenDetails(race)
                        }}
                      >
                        <div className={styles.inListModalHeader}>
                          <div className={styles.inListModalMain}>
                            <div className={styles.inListModalTitleBlock}>
                              <OverflowTooltip title={race.name} className={styles.inListModalTitle}>
                                {race.name}
                              </OverflowTooltip>
                              <div className={styles.inListModalSubtitle}>
                                {race.raceDate ? <span>{getShortDateWithYear(race.raceDate)}</span> : null}
                                {race.location ? <span>{race.location}</span> : null}
                              </div>
                            </div>
                          </div>

                          <span className={`${styles.raceStatusBadge} ${getRaceStatusClassName(race.raceStatus)}`.trim()}>
                            {race.raceTypeName ?? '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}

          {visibleBucketListGroups.length === 0 ? (
            <Empty description="No bucket-list races found for the current filters." />
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
        }}
      />

    </Card>
  )
}
