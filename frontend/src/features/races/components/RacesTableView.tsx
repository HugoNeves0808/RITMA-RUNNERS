import { faEllipsisVertical, faEye, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
} from 'antd'
import { useAuth } from '../../auth'
import {
  deleteRaceTableItems,
  fetchRaceTable,
  fetchRaceTypes,
  updateRaceTableItem,
} from '../services/racesTableService'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceTableItem, RaceTableYearGroup, RaceTypeOption } from '../types/racesTable'
import styles from './RacesTableView.module.css'

type EditRaceFormValues = {
  raceDate?: dayjs.Dayjs
  name: string
  location?: string
  raceTypeId?: string
  officialTime?: string
  chipTime?: string
  pacePerKm?: string
}

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
      return 'DNS'
    case 'DID_NOT_FINISH':
      return 'DNF'
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

function formatDurationInput(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return ''
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPaceInput(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return ''
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function parseTimeToSeconds(value: string | undefined, mode: 'duration' | 'pace') {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (mode === 'duration' && parts.length === 3) {
    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Chip time must use HH:MM:SS.')
    }

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error(mode === 'duration' ? 'Chip time must use HH:MM:SS.' : 'Pace must use MM:SS.')
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration' ? 'Chip time must use HH:MM:SS.' : 'Pace must use MM:SS.')
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
  if (!isRegisteredRace(race)) {
    return false
  }

  const raceDateTime = getRaceDateTime(race)
  const startOfToday = now.startOf('day')
  const daysSinceMonday = (startOfToday.day() + 6) % 7
  const startOfWeek = startOfToday.subtract(daysSinceMonday, 'day')
  const endOfWeek = startOfWeek.add(7, 'day')

  return raceDateTime.isSame(startOfToday, 'day')
    || (raceDateTime.isAfter(now) && raceDateTime.isBefore(endOfWeek))
}

function formatCountdown(race: RaceTableItem, now: dayjs.Dayjs) {
  const raceDateTime = getRaceDateTime(race)
  if (!raceDateTime.isAfter(now)) {
    return null
  }

  const diffMinutes = Math.max(raceDateTime.diff(now, 'minute'), 0)
  const days = Math.floor(diffMinutes / (60 * 24))
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60)
  const minutes = diffMinutes % 60

  return `starts in ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
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

type RacesTableViewProps = {
  showAllYears: boolean
  filters: RaceFilters
  refreshKey?: number
}

export function RacesTableView({ showAllYears, filters, refreshKey = 0 }: RacesTableViewProps) {
  const { token } = useAuth()
  const currentYear = dayjs().year()
  const [now, setNow] = useState(() => dayjs())
  const [years, setYears] = useState<RaceTableYearGroup[]>([])
  const [undatedRaces, setUndatedRaces] = useState<RaceTableItem[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceTypeOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceTableItem | null>(null)
  const [form] = Form.useForm<EditRaceFormValues>()

  const visibleYears = showAllYears
    ? years
    : years.filter((yearGroup) => yearGroup.year === currentYear)
  const filteredVisibleYears = filterYearsByRaceName(visibleYears, filters.search)
  const normalizedSearch = filters.search.trim().toLowerCase()
  const filteredUndatedRaces = !filters.statuses.includes('IN_LIST')
    ? []
    : normalizedSearch
      ? undatedRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
      : undatedRaces
  const visibleRaces = filteredVisibleYears.flatMap((yearGroup) => yearGroup.races)
  const weekUpcomingRaces = visibleRaces
    .filter((race) => isUpcomingRace(race, now))
    .sort((left, right) => getRaceDateTime(left).diff(getRaceDateTime(right)))
  const upcomingRaces = weekUpcomingRaces.length > 0
    ? weekUpcomingRaces
    : getFallbackUpcomingRaces(visibleRaces, now)
  const regularYears = removeUpcomingRaces(filteredVisibleYears, new Set(upcomingRaces.map((race) => race.id)))

  const loadTableData = async () => {
    if (!token) {
      setYears([])
      setUndatedRaces([])
      setRaceTypes([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const [tablePayload, raceTypePayload] = await Promise.all([
        fetchRaceTable(token, filters),
        fetchRaceTypes(token),
      ])

      setYears(tablePayload.years ?? [])
      setUndatedRaces(tablePayload.undatedRaces ?? [])
      setRaceTypes(raceTypePayload)
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

  const handleOpenEdit = (race: RaceTableItem) => {
    setEditingRace(race)
    form.setFieldsValue({
      raceDate: race.raceDate ? dayjs(race.raceDate) : undefined,
      name: race.name,
      location: race.location ?? '',
      raceTypeId: race.raceTypeId ?? undefined,
      officialTime: formatDurationInput(race.officialTimeSeconds),
      chipTime: formatDurationInput(race.chipTimeSeconds),
      pacePerKm: formatPaceInput(race.pacePerKmSeconds),
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = (race: RaceTableItem) => {
    if (!token) {
      return
    }

    Modal.confirm({
      title: 'Delete race?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRaceTableItems([race.id], token)
          await loadTableData()
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Unknown error')
        }
      },
    })
  }

  const handleSubmitEdit = async () => {
    if (!token || !editingRace) {
      return
    }

    try {
      const values = await form.validateFields()
      setIsSavingEdit(true)

      await updateRaceTableItem(
        editingRace.id,
        {
          raceDate: values.raceDate!.format('YYYY-MM-DD'),
          name: values.name.trim(),
          location: values.location?.trim() ? values.location.trim() : null,
          raceTypeId: values.raceTypeId ?? null,
          officialTimeSeconds: parseTimeToSeconds(values.officialTime, 'duration'),
          chipTimeSeconds: parseTimeToSeconds(values.chipTime, 'duration'),
          pacePerKmSeconds: parseTimeToSeconds(values.pacePerKm, 'pace'),
        },
        token,
      )

      setIsEditModalOpen(false)
      setEditingRace(null)
      await loadTableData()
    } catch (submitError) {
      if (submitError instanceof Error && !('errorFields' in submitError)) {
        setError(submitError.message)
      }
    } finally {
      setIsSavingEdit(false)
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
    onClick: ({ key }: { key: string }) => {
      if (key === 'edit') {
        handleOpenEdit(race)
      }

      if (key === 'delete') {
        handleDelete(race)
      }
    },
  })

  return (
    <Card className={styles.pageCard} variant="borderless">
      {isLoading ? (
        <Space>
          <Spin size="small" />
          <span>Loading races</span>
        </Space>
      ) : null}

      {error ? (
        <Alert type="error" showIcon message="Could not load the race table" description={error} />
      ) : null}

      {!isLoading && years.length === 0 && undatedRaces.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races available." />
        </div>
      ) : null}

      {!isLoading && years.length > 0 && visibleYears.length === 0 && filteredUndatedRaces.length === 0 ? (
        <div className={styles.emptyWrap}>
          <Empty description={`No races available for ${currentYear}.`} />
        </div>
      ) : null}

      {!isLoading && filteredVisibleYears.length === 0 && filteredUndatedRaces.length === 0 && (visibleYears.length > 0 || undatedRaces.length > 0) ? (
        <div className={styles.emptyWrap}>
          <Empty description="No races match the current filters." />
        </div>
      ) : null}

      {!isLoading && filteredVisibleYears.length > 0 && upcomingRaces.length > 0 ? (
        <section className={styles.yearSection}>
          <div className={styles.yearHeader}>
            <h3 className={styles.yearTitle}>Coming Up</h3>
          </div>

          <div className={styles.yearCard}>
            <div className={styles.monthSection}>
              <div className={styles.raceList}>
                {upcomingRaces.map((race) => {
                  const countdown = formatCountdown(race, now)

                  return (
                    <article
                      key={race.id}
                      className={`${styles.raceRow} ${styles.raceRowToday}`.trim()}
                    >
                      <div className={styles.dateBadge}>
                        <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                        <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                      </div>

                        <div className={styles.raceContent}>
                          <div className={styles.raceTopRow}>
                            <div className={styles.raceTitleBlock}>
                              <h4 className={styles.raceCardTitle}>{race.name}</h4>
                            </div>

                          <div className={styles.raceTopMeta}>
                            {countdown ? <span className={styles.countdownBadge}>{countdown}</span> : null}
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
                              />
                            </Dropdown>
                          </div>
                        </div>

                        <div className={styles.raceBottomRow}>
                          <div className={styles.metricsGrid}>
                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Location</span>
                              <span className={styles.metricValue}>
                                {race.location ?? <span className={styles.emptyValue}>-</span>}
                              </span>
                            </div>

                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Race type</span>
                              <span className={styles.metricValue}>
                                {race.raceTypeName ?? <span className={styles.emptyValue}>-</span>}
                              </span>
                            </div>

                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Official time</span>
                              <span className={styles.metricValue}>{formatDuration(race.officialTimeSeconds)}</span>
                            </div>

                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Chip time</span>
                              <span className={styles.metricValue}>{formatDuration(race.chipTimeSeconds)}</span>
                            </div>

                            <div className={styles.metricItem}>
                              <span className={styles.metricLabel}>Pace per km</span>
                              <span className={styles.metricValue}>{formatPace(race.pacePerKmSeconds)}</span>
                            </div>
                          </div>

                          <div className={styles.cardActions}>
                            <Button
                              type="text"
                              className={styles.iconAction}
                              title="View details"
                              aria-label="View details"
                              icon={<FontAwesomeIcon icon={faEye} />}
                            />
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
          <div className={styles.yearHeader}>
            <h3 className={styles.yearTitle}>{yearGroup.year}</h3>
          </div>

          <div className={styles.yearCard}>
            {groupRacesByMonth(yearGroup.races).map((monthGroup) => (
              <div key={monthGroup.key} className={styles.monthSection}>
                <div className={styles.raceList}>
                  {monthGroup.races.map((race) => {
                    const isTodayRace = race.raceDate === now.format('YYYY-MM-DD')
                    const countdown = formatCountdown(race, now)

                    return (
                      <article
                        key={race.id}
                        className={isTodayRace ? `${styles.raceRow} ${styles.raceRowToday}` : styles.raceRow}
                      >
                        <div className={styles.dateBadge}>
                          <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                          <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                        </div>

                        <div className={styles.raceContent}>
                          <div className={styles.raceTopRow}>
                            <div className={styles.raceTitleBlock}>
                              <h4 className={styles.raceCardTitle}>{race.name}</h4>
                            </div>

                            <div className={styles.raceTopMeta}>
                              {isUpcomingRace(race, now) && countdown ? <span className={styles.countdownBadge}>{countdown}</span> : null}
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
                                />
                              </Dropdown>
                            </div>
                          </div>

                          <div className={styles.raceBottomRow}>
                            <div className={styles.metricsGrid}>
                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Location</span>
                                <span className={styles.metricValue}>
                                  {race.location ?? <span className={styles.emptyValue}>-</span>}
                                </span>
                              </div>

                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Race type</span>
                                <span className={styles.metricValue}>
                                  {race.raceTypeName ?? <span className={styles.emptyValue}>-</span>}
                                </span>
                              </div>

                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Official time</span>
                                <span className={styles.metricValue}>{formatDuration(race.officialTimeSeconds)}</span>
                              </div>

                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Chip time</span>
                                <span className={styles.metricValue}>{formatDuration(race.chipTimeSeconds)}</span>
                              </div>

                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Pace per km</span>
                                <span className={styles.metricValue}>{formatPace(race.pacePerKmSeconds)}</span>
                              </div>
                            </div>

                            <div className={styles.cardActions}>
                              <Button
                                type="text"
                                className={styles.iconAction}
                                title="View details"
                                aria-label="View details"
                                icon={<FontAwesomeIcon icon={faEye} />}
                              />
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
        </section>
      )) : null}

      {!isLoading && filteredUndatedRaces.length > 0 ? (
        <section className={styles.yearSection}>
          <div className={styles.yearHeader}>
            <h3 className={styles.yearTitle}>In List</h3>
          </div>

          <div className={styles.yearCard}>
            <div className={styles.monthSection}>
              <div className={styles.raceList}>
                {filteredUndatedRaces.map((race) => (
                  <article key={race.id} className={styles.raceRow}>
                    <div className={styles.dateBadge}>
                      <span className={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</span>
                      <span className={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</span>
                    </div>

                    <div className={styles.raceContent}>
                      <div className={styles.raceTopRow}>
                        <div className={styles.raceTitleBlock}>
                          <h4 className={styles.raceCardTitle}>{race.name}</h4>
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
                            />
                          </Dropdown>
                        </div>
                      </div>

                      <div className={styles.raceBottomRow}>
                        <div className={styles.metricsGrid}>
                          <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>Location</span>
                            <span className={styles.metricValue}>
                              {race.location ?? <span className={styles.emptyValue}>-</span>}
                            </span>
                          </div>

                          <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>Race type</span>
                            <span className={styles.metricValue}>
                              {race.raceTypeName ?? <span className={styles.emptyValue}>-</span>}
                            </span>
                          </div>

                          <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>Official time</span>
                            <span className={styles.metricValue}>{formatDuration(race.officialTimeSeconds)}</span>
                          </div>

                          <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>Chip time</span>
                            <span className={styles.metricValue}>{formatDuration(race.chipTimeSeconds)}</span>
                          </div>

                          <div className={styles.metricItem}>
                            <span className={styles.metricLabel}>Pace per km</span>
                            <span className={styles.metricValue}>{formatPace(race.pacePerKmSeconds)}</span>
                          </div>
                        </div>

                        <div className={styles.cardActions}>
                          <Button
                            type="text"
                            className={styles.iconAction}
                            title="View details"
                            aria-label="View details"
                            icon={<FontAwesomeIcon icon={faEye} />}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        title="Edit race"
        open={isEditModalOpen}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={isSavingEdit}
        onOk={() => void handleSubmitEdit()}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingRace(null)
          form.resetFields()
        }}
      >
        <p className={styles.modalHint}>Only one selected race can be edited at a time.</p>

        <Form form={form} layout="vertical">
          <Form.Item<EditRaceFormValues>
            label="race_date"
            name="raceDate"
            rules={[{ required: true, message: 'Race date is required.' }]}
          >
            <DatePicker format="YYYY-MM-DD" className={styles.datePicker} />
          </Form.Item>

          <Form.Item<EditRaceFormValues>
            label="name"
            name="name"
            rules={[{ required: true, message: 'Race name is required.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<EditRaceFormValues> label="location" name="location">
            <Input placeholder="Race location" />
          </Form.Item>

          <Form.Item<EditRaceFormValues> label="race_type" name="raceTypeId">
            <Select
              allowClear
              options={raceTypes.map((raceType) => ({ value: raceType.id, label: raceType.name }))}
              placeholder="Select a race type"
            />
          </Form.Item>

          <Form.Item<EditRaceFormValues> label="official_time" name="officialTime">
            <Input placeholder="HH:MM:SS" />
          </Form.Item>

          <Form.Item<EditRaceFormValues> label="chip_time" name="chipTime">
            <Input placeholder="HH:MM:SS" />
          </Form.Item>

          <Form.Item<EditRaceFormValues> label="pace_per_km" name="pacePerKm">
            <Input placeholder="MM:SS" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
