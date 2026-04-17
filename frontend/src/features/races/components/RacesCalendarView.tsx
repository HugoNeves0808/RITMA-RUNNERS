import { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, Modal, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../auth'
import { fetchRaceCalendarMonth, fetchRaceCalendarYear } from '../services/racesCalendarService'
import { deleteRace, fetchRaceCreateOptions, fetchRaceDetail } from '../services/racesTableService'
import type { RaceFilters } from '../types/raceFilters'
import { getRaceStatusLabel as getRaceStatusLabelFromOptions } from '../types/raceFilters'
import type { RaceCalendarItem, RaceCalendarMonthPayload, RaceCalendarYearPayload } from '../types/racesCalendar'
import type { RaceCreateOptions, RaceDetailResponse } from '../types/racesTable'
import type { RacesCalendarMode } from '../types/racesCalendarMode'
import { AddRaceDrawer } from './AddRaceDrawer'
import { RaceDetailsDrawer } from './RaceDetailsDrawer'
import { RacesCalendarMonthlyView } from './RacesCalendarMonthlyView'
import { RacesCalendarYearlyView } from './RacesCalendarYearlyView'
import { translateRaceTypeName } from '../../../utils/raceTypeLocalization'
import styles from './RacesCalendarView.module.css'
import { useLanguage } from '../../../contexts/LanguageContext'

type RacesCalendarViewProps = {
  selectedMode: RacesCalendarMode
  onModeChange: (mode: RacesCalendarMode) => void
  filters: RaceFilters
  refreshKey?: number
}

function buildCalendarFiltersKey(filters: RaceFilters) {
  const normalizedStatuses = [...filters.statuses].sort()
  const normalizedRaceTypeIds = [...filters.raceTypeIds].sort()

  return JSON.stringify({
    year: filters.year,
    statuses: normalizedStatuses,
    raceTypeIds: normalizedRaceTypeIds,
  })
}

function formatDayDrawerDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatDisplayTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const parts = value.split(':')
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  }

  return value
}

function formatStatusLabel(
  status: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!status) {
    return t('common.unknown')
  }

  return getRaceStatusLabelFromOptions(status, t)
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

function isTerminalRaceStatus(status: string | null | undefined) {
  return status === 'COMPLETED'
    || status === 'DID_NOT_START'
    || status === 'DID_NOT_FINISH'
    || status === 'CANCELLED'
}

function shouldWarnAboutPastRaceStatus(race: RaceCalendarItem, now: dayjs.Dayjs) {
  if (!race.raceDate || isTerminalRaceStatus(race.raceStatus)) {
    return false
  }

  return now.startOf('day').isAfter(dayjs(race.raceDate).startOf('day'))
}

function filterCalendarMonthPayload(payload: RaceCalendarMonthPayload, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return payload
  }

  return {
    ...payload,
    days: payload.days
      .map((day) => ({
        ...day,
        races: day.races.filter((race) => race.name.toLowerCase().includes(normalizedSearch)),
      }))
      .filter((day) => day.races.length > 0),
  }
}

function filterCalendarYearPayload(payload: RaceCalendarYearPayload, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return payload
  }

  return {
    ...payload,
    months: payload.months.map((month) => ({
      ...month,
      days: month.days
        .map((day) => ({
          ...day,
          races: day.races.filter((race) => race.name.toLowerCase().includes(normalizedSearch)),
        }))
        .filter((day) => day.races.length > 0),
    })),
  }
}

export function RacesCalendarView({ selectedMode, filters, refreshKey = 0 }: RacesCalendarViewProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { token } = useAuth()
  const raceDetailsCacheRef = useRef<Map<string, RaceDetailResponse>>(new Map())
  const monthlyCalendarCacheRef = useRef<Map<string, RaceCalendarMonthPayload>>(new Map())
  const yearlyCalendarCacheRef = useRef<Map<string, RaceCalendarYearPayload>>(new Map())
  const serverFilters = useMemo(() => ({
    ...filters,
    search: '',
  }), [filters.raceTypeIds, filters.statuses, filters.year])
  const serverFiltersKey = useMemo(() => buildCalendarFiltersKey(serverFilters), [serverFilters])
  const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [calendarData, setCalendarData] = useState<RaceCalendarMonthPayload | null>(null)
  const [rawCalendarData, setRawCalendarData] = useState<RaceCalendarMonthPayload | null>(null)
  const [yearCalendarData, setYearCalendarData] = useState<RaceCalendarYearPayload | null>(null)
  const [rawYearCalendarData, setRawYearCalendarData] = useState<RaceCalendarYearPayload | null>(null)
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true)
  const [isYearlyLoading, setIsYearlyLoading] = useState(false)
  const [monthlyErrorMessage, setMonthlyErrorMessage] = useState<string | null>(null)
  const [yearlyErrorMessage, setYearlyErrorMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ date: string; races: RaceCalendarItem[] } | null>(null)
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [raceDetails, setRaceDetails] = useState<RaceDetailResponse | null>(null)
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({
    raceTypes: [],
    teams: [],
    circuits: [],
    shoes: [],
  })
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceDetailResponse | null>(null)
  const [isPreparingEdit, setIsPreparingEdit] = useState(false)
  const [racePendingDelete, setRacePendingDelete] = useState<RaceDetailResponse | null>(null)
  const [isDeletingRace, setIsDeletingRace] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    monthlyCalendarCacheRef.current.clear()
    yearlyCalendarCacheRef.current.clear()
  }, [refreshKey, reloadNonce, token])

  useEffect(() => {
    if (!token) {
      setCreateOptions({
        raceTypes: [],
        teams: [],
        circuits: [],
        shoes: [],
      })
      return
    }

    const loadCreateOptions = async () => {
      try {
        setCreateOptions(await fetchRaceCreateOptions(token))
      } catch {
        setCreateOptions({
          raceTypes: [],
          teams: [],
          circuits: [],
          shoes: [],
        })
      }
    }

    void loadCreateOptions()
  }, [token])

  useEffect(() => {
    if (!token || selectedMode !== 'monthly') {
      return
    }

    const cacheKey = `${visibleMonth.year}-${visibleMonth.month}-${serverFiltersKey}`
    const cachedPayload = monthlyCalendarCacheRef.current.get(cacheKey)

    if (cachedPayload) {
      setRawCalendarData(cachedPayload)
      setMonthlyErrorMessage(null)
      setIsMonthlyLoading(false)
      return
    }

    const loadMonthlyCalendar = async () => {
      try {
        setIsMonthlyLoading(true)
        const response = await fetchRaceCalendarMonth(visibleMonth.year, visibleMonth.month, token, serverFilters)
        monthlyCalendarCacheRef.current.set(cacheKey, response)
        setRawCalendarData(response)
        setMonthlyErrorMessage(null)
      } catch (error) {
        setMonthlyErrorMessage(
          error instanceof Error
            ? 'Calendar data is temporarily unavailable.'
            : 'Calendar data is temporarily unavailable.',
        )
      } finally {
        setIsMonthlyLoading(false)
      }
    }

    void loadMonthlyCalendar()
  }, [reloadNonce, selectedMode, serverFilters, serverFiltersKey, token, visibleMonth.month, visibleMonth.year])

  useEffect(() => {
    if (!token || selectedMode !== 'yearly') {
      return
    }

    const cacheKey = `${visibleYear}-${serverFiltersKey}`
    const cachedPayload = yearlyCalendarCacheRef.current.get(cacheKey)

    if (cachedPayload) {
      setRawYearCalendarData(cachedPayload)
      setYearlyErrorMessage(null)
      setIsYearlyLoading(false)
      return
    }

    const loadYearlyCalendar = async () => {
      try {
        setIsYearlyLoading(true)
        const response = await fetchRaceCalendarYear(visibleYear, token, serverFilters)
        yearlyCalendarCacheRef.current.set(cacheKey, response)
        setRawYearCalendarData(response)
        setYearlyErrorMessage(null)
      } catch (error) {
        setYearlyErrorMessage(
          error instanceof Error
            ? 'Calendar data is temporarily unavailable.'
            : 'Calendar data is temporarily unavailable.',
        )
      } finally {
        setIsYearlyLoading(false)
      }
    }

    void loadYearlyCalendar()
  }, [reloadNonce, selectedMode, serverFilters, serverFiltersKey, token, visibleYear])

  useEffect(() => {
    setCalendarData(rawCalendarData ? filterCalendarMonthPayload(rawCalendarData, filters.search) : null)
  }, [filters.search, rawCalendarData])

  useEffect(() => {
    setYearCalendarData(rawYearCalendarData ? filterCalendarYearPayload(rawYearCalendarData, filters.search) : null)
  }, [filters.search, rawYearCalendarData])

  const moveMonth = (direction: -1 | 1) => {
    setVisibleMonth((currentValue) => {
      const nextDate = new Date(currentValue.year, currentValue.month - 1 + direction, 1)
      return {
        year: nextDate.getFullYear(),
        month: nextDate.getMonth() + 1,
      }
    })
  }

  const selectMonth = (year: number, month: number) => {
    setVisibleMonth({ year, month })
  }

  const moveYear = (direction: -1 | 1) => {
    setVisibleYear((currentValue) => currentValue + direction)
  }

  const openRaceDetails = async (race: RaceCalendarItem) => {
    if (!token) {
      return
    }

    try {
      const cachedDetails = raceDetailsCacheRef.current.get(race.id)
      setIsDayDrawerOpen(false)
      setIsDetailsOpen(true)
      setIsDetailsLoading(!cachedDetails)
      setDetailsError(null)
      setRaceDetails(cachedDetails ?? null)

      if (cachedDetails) {
        return
      }

      const details = await fetchRaceDetail(race.id, token)
      raceDetailsCacheRef.current.set(race.id, details)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setDetailsError(loadError instanceof Error ? loadError.message : t('races.calendar.loadRaceErrorFallback'))
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleOpenEdit = async () => {
    if (!raceDetails) {
      return
    }

    setIsPreparingEdit(false)
    setEditingRace(raceDetails)
    setIsDetailsOpen(false)
    setIsEditDrawerOpen(true)
  }

  const reloadVisibleCalendar = async () => {
    monthlyCalendarCacheRef.current.clear()
    yearlyCalendarCacheRef.current.clear()
    raceDetailsCacheRef.current.clear()
    setReloadNonce((current) => current + 1)
  }

  const handleDeleteRace = async () => {
    if (!token || !racePendingDelete) {
      return
    }

    try {
      setIsDeletingRace(true)
      await deleteRace(racePendingDelete.id, token)
      setRacePendingDelete(null)
      setIsDetailsOpen(false)
      setRaceDetails(null)
      setDetailsError(null)
      setIsDayDrawerOpen(false)
      setSelectedDay(null)
      await reloadVisibleCalendar()
    } catch (deleteError) {
      setDetailsError(deleteError instanceof Error ? deleteError.message : t('races.table.deleteErrorFallback'))
      setIsDetailsOpen(true)
    } finally {
      setIsDeletingRace(false)
    }
  }

  const handleDayClick = (races: RaceCalendarItem[]) => {
    if (races.length === 0) {
      return
    }

    if (races.length === 1) {
      void openRaceDetails(races[0])
      return
    }

    setSelectedDay({
      date: races[0].raceDate,
      races,
    })
    setIsDayDrawerOpen(true)
  }

  return (
    <>
      {selectedMode === 'monthly' ? (
        <RacesCalendarMonthlyView
          year={visibleMonth.year}
          month={visibleMonth.month}
          days={calendarData?.days ?? []}
          isLoading={isMonthlyLoading}
          errorMessage={monthlyErrorMessage}
          onPreviousMonth={() => moveMonth(-1)}
          onNextMonth={() => moveMonth(1)}
          onMonthSelect={selectMonth}
          onDayClick={handleDayClick}
        />
      ) : (
        <RacesCalendarYearlyView
          year={visibleYear}
          months={yearCalendarData?.months ?? []}
          isLoading={isYearlyLoading}
          errorMessage={yearlyErrorMessage}
          onPreviousYear={() => moveYear(-1)}
          onNextYear={() => moveYear(1)}
          onDayClick={handleDayClick}
        />
      )}

      <Drawer
        open={isDayDrawerOpen}
        placement="right"
        width={420}
        onClose={() => setIsDayDrawerOpen(false)}
        className={styles.dayDrawer}
        title={selectedDay ? (
          <div className={styles.dayDrawerTitle}>
            <span className={styles.dayDrawerEyebrow}>{t('races.calendar.raceDay')}</span>
            <span className={styles.dayDrawerDate}>{formatDayDrawerDate(selectedDay.date, language === 'pt' ? 'pt-PT' : 'en-GB')}</span>
          </div>
        ) : t('races.calendar.raceDay')}
      >
        {selectedDay ? (
          <>
            <div className={styles.dayRaceList}>
              {selectedDay.races.map((race) => {
                const needsUpdate = shouldWarnAboutPastRaceStatus(race, dayjs())

                return (
                <button
                  key={race.id}
                  type="button"
                  className={styles.dayRaceButton}
                  onClick={() => void openRaceDetails(race)}
                >
                  <div className={styles.dayRaceHeader}>
                    <Tooltip title={race.name}>
                      <span className={styles.dayRaceName}>{race.name}</span>
                    </Tooltip>
                    <span
                      className={`${styles.dayRaceStatus} ${getStatusClassName(race.raceStatus)}`.trim()}
                      title={needsUpdate ? t('races.calendar.needsUpdate') : undefined}
                    >
                      {needsUpdate ? <FontAwesomeIcon icon={faTriangleExclamation} className={styles.statusNeedsUpdateIcon} aria-hidden="true" /> : null}
                      {formatStatusLabel(race.raceStatus, t)}
                    </span>
                  </div>

                  <div className={styles.dayRaceMeta}>
                    <div className={styles.dayRaceMetaItem}>
                      <span className={styles.dayRaceMetaLabel}>{t('races.calendar.timeLabel')}</span>
                      <span className={styles.dayRaceMetaValue}>{formatDisplayTime(race.raceTime)}</span>
                    </div>
                    <div className={styles.dayRaceMetaItem}>
                      <span className={styles.dayRaceMetaLabel}>{t('races.calendar.raceTypeLabel')}</span>
                      <Tooltip title={translateRaceTypeName(race.raceTypeName, t) ?? '-'}>
                        <span className={styles.dayRaceMetaValue}>{translateRaceTypeName(race.raceTypeName, t) ?? '-'}</span>
                      </Tooltip>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          </>
        ) : null}
      </Drawer>

      <RaceDetailsDrawer
        open={isDetailsOpen}
        race={raceDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        onEdit={() => {
          void handleOpenEdit()
        }}
        onDelete={() => {
          if (!raceDetails) {
            return
          }

          setRacePendingDelete(raceDetails)
        }}
        isDeleting={isDeletingRace}
        onClose={() => {
          setIsDetailsOpen(false)
          setRaceDetails(null)
          setDetailsError(null)
          if (selectedDay && selectedDay.races.length > 1) {
            setIsDayDrawerOpen(true)
          }
        }}
      />

      <AddRaceDrawer
        mode="edit"
        open={isEditDrawerOpen}
        raceId={editingRace?.id ?? null}
        initialRace={editingRace}
        isLoadingInitialRace={isPreparingEdit}
        createOptions={createOptions}
        onCreateOptionsChange={setCreateOptions}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          if (raceDetails) {
            setIsDetailsOpen(true)
          }
        }}
        onCreated={async () => {
          const editedRaceId = editingRace?.id ?? raceDetails?.id ?? null

          setIsEditDrawerOpen(false)
          setEditingRace(null)
          await reloadVisibleCalendar()

          if (!editedRaceId || !token) {
            return
          }

          try {
            setIsDetailsOpen(true)
            setIsDetailsLoading(true)
            const updatedDetails = await fetchRaceDetail(editedRaceId, token)
            raceDetailsCacheRef.current.set(editedRaceId, updatedDetails)
            setRaceDetails(updatedDetails)
            setDetailsError(null)
          } catch (loadError) {
            setRaceDetails(null)
            setDetailsError(loadError instanceof Error ? loadError.message : t('races.table.loadErrorTitle'))
          } finally {
            setIsDetailsLoading(false)
          }
        }}
      />

      <Modal
        title={t('races.table.deleteRaceTitle')}
        open={racePendingDelete != null}
        okText={t('races.table.deleteOk')}
        okButtonProps={{ danger: true }}
        cancelText={t('races.table.deleteCancel')}
        confirmLoading={isDeletingRace}
        onOk={() => void handleDeleteRace()}
        onCancel={() => {
          if (isDeletingRace) {
            return
          }

          setRacePendingDelete(null)
        }}
      >
        <p>
          {racePendingDelete
            ? t('races.table.deleteHintWithName', { name: racePendingDelete.race.name })
            : t('races.table.deleteHintGeneric')}
        </p>
      </Modal>
    </>
  )
}
