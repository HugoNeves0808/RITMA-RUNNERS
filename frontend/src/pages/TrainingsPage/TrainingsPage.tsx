import { faAngleDown, faAngleUp, faBroom, faCalendarDays, faCheck, faClock, faMagnifyingGlass, faPenToSquare, faPlus, faTrashCan, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, Checkbox, Collapse, DatePicker, Drawer, Empty, Input, InputNumber, Modal, Segmented, Select, Space, Spin, TimePicker, Tooltip, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import { EMPTY_RACE_FILTERS, fetchRaceTable, getRaceStatusColor, getRaceStatusLabel } from '../../features/races'
import {
  createTraining,
  createTrainingType,
  deleteTraining,
  deleteTrainingType,
  EMPTY_TRAINING_FILTERS,
  fetchTrainingCreateOptions,
  fetchTrainingFilterOptions,
  fetchTrainingTable,
  TrainingDetailsDrawer,
  TrainingsCalendarView,
  updateTraining,
  updateTrainingCompletion,
  updateTrainingType,
  type TrainingsCalendarMode,
  type TrainingsCalendarViewMode,
  type TrainingCreateOptions,
  type TrainingFilters,
  type TrainingRequest,
  type TrainingStatus,
  type TrainingTableItem,
  type TrainingTypeOption,
} from '../../features/trainings'
import { STORAGE_KEYS } from '../../constants/storage'
import styles from './TrainingsPage.module.css'
import viewSwitcherStyles from '../../features/races/components/RacesViewSwitcher.module.css'
import calendarModeSwitcherStyles from '../../features/races/components/RacesCalendarModeSwitcher.module.css'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_OPTIONS: Array<{ value: TrainingStatus; labelKey: string }> = [
  { value: 'AGENDADO', labelKey: 'trainings.status.scheduled' },
  { value: 'PLANEADO', labelKey: 'trainings.status.planned' },
  { value: 'REALIZADO', labelKey: 'trainings.status.done' },
]

const WEEKDAY_OPTIONS = [
  { value: 1, labelKey: 'trainings.weekdays.mon' },
  { value: 2, labelKey: 'trainings.weekdays.tue' },
  { value: 3, labelKey: 'trainings.weekdays.wed' },
  { value: 4, labelKey: 'trainings.weekdays.thu' },
  { value: 5, labelKey: 'trainings.weekdays.fri' },
  { value: 6, labelKey: 'trainings.weekdays.sat' },
  { value: 7, labelKey: 'trainings.weekdays.sun' },
] as const

type TrainingDraft = {
  trainingDate: string
  trainingTime: string | null
  name: string
  trainingTypeId: string | null
  notes: string
  recurrenceEnabled: boolean
  recurrenceIntervalWeeks: number
  recurrenceUntilDate: string | null
  recurrenceDaysOfWeek: number[]
}

type CheckboxFilterSectionProps = {
  title: string
  count: number
  isOpen: boolean
  onToggle: () => void
  toggleLabel: string
  titleAction?: React.ReactNode
  children: React.ReactNode
}

type TimelineItem = {
  key: string
  kind: 'training'
  sortValue: number
  training: TrainingTableItem
}

type RaceSection = {
  key: string
  raceName: string
  raceDate: string
  raceStatus: string | null
  items: TrainingTableItem[]
}

type TrainingsListEntry =
  | {
    key: string
    year: number
    sortValue: number
    kind: 'training'
    training: TrainingTableItem
  }
  | {
    key: string
    year: number
    sortValue: number
    kind: 'raceSection'
    group: RaceSection
  }

type TrainingsListYearSection = {
  year: number
  entries: TrainingsListEntry[]
}

type PersistedTrainingsFiltersState = {
  selectedView: TrainingsCalendarViewMode
  selectedCalendarMode: TrainingsCalendarMode
}

function readPersistedTrainingsFilters(): PersistedTrainingsFiltersState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.trainingsFilters)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedTrainingsFiltersState>

    return {
      selectedView: parsed.selectedView === 'calendar' ? 'calendar' : 'table',
      selectedCalendarMode: parsed.selectedCalendarMode === 'yearly' ? 'yearly' : 'monthly',
    }
  } catch {
    return null
  }
}

function CheckboxFilterSection({
  title,
  count,
  isOpen,
  onToggle,
  toggleLabel,
  titleAction,
  children,
}: CheckboxFilterSectionProps) {
  return (
    <div className={styles.filterField}>
      <div className={styles.checkboxSectionHeader}>
        <span className={styles.checkboxSectionTitleRow}>
          <span className={styles.filterLabel}>{title}</span>
          {count > 0 ? <span className={styles.filterCount}>{count}</span> : null}
          {titleAction}
        </span>
        <button
          type="button"
          className={styles.checkboxSectionToggle}
          onClick={onToggle}
          aria-label={toggleLabel}
          aria-expanded={isOpen}
        >
          <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} />
        </button>
      </div>
      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

function getEmptyDraft(): TrainingDraft {
  const today = dayjs().format('YYYY-MM-DD')
  return {
    trainingDate: today,
    trainingTime: null,
    name: '',
    trainingTypeId: null,
    notes: '',
    recurrenceEnabled: false,
    recurrenceIntervalWeeks: 1,
    recurrenceUntilDate: today,
    recurrenceDaysOfWeek: [],
  }
}

function buildTrainingRequest(draft: TrainingDraft): TrainingRequest {
  return {
    trainingDate: draft.trainingDate,
    trainingTime: draft.trainingTime,
    name: draft.name.trim(),
    trainingTypeId: draft.trainingTypeId,
    notes: draft.notes.trim() || null,
    associatedRaceId: null,
    recurrence: draft.recurrenceEnabled
      ? {
        enabled: true,
        intervalWeeks: draft.recurrenceIntervalWeeks,
        untilDate: draft.recurrenceUntilDate,
        daysOfWeek: draft.recurrenceDaysOfWeek,
      }
      : null,
  }
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

function getStatusClass(status: TrainingStatus) {
  if (status === 'REALIZADO') {
    return styles.statusDone
  }

  if (status === 'PLANEADO') {
    return styles.statusPlanned
  }

  return styles.statusScheduled
}

function getTimelineStatusIcon(status: TrainingStatus) {
  if (status === 'REALIZADO') {
    return faCheck
  }

  if (status === 'PLANEADO') {
    return faCalendarDays
  }

  return faClock
}

function getTrainingStatusLabelKey(status: TrainingStatus) {
  if (status === 'REALIZADO') {
    return 'trainings.status.done'
  }

  if (status === 'PLANEADO') {
    return 'trainings.status.planned'
  }

  return 'trainings.status.scheduled'
}

function isPastPlannedTraining(training: TrainingTableItem) {
  return training.trainingStatus === 'PLANEADO' && dayjs(training.trainingDate).isBefore(dayjs(), 'day')
}

function isFutureTraining(training: Pick<TrainingTableItem, 'trainingDate'>) {
  return dayjs(training.trainingDate).isAfter(dayjs(), 'day')
}

function getTrainingSortValue(training: TrainingTableItem) {
  return dayjs(`${training.trainingDate}T${training.trainingTime ?? '00:00:00'}`).valueOf()
}

function getResolvedRaceStatus(raceDate: string, raceStatus: string | null) {
  if (dayjs(raceDate).isBefore(dayjs(), 'day')) {
    return 'COMPLETED'
  }

  return raceStatus
}

function getEligibleTrainingRaces(races: TrainingCreateOptions['races']) {
  return [...races]
    .filter((race) => Boolean(race.raceDate) && race.raceStatus !== 'IN_LIST')
    .sort((left, right) => dayjs(right.raceDate).valueOf() - dayjs(left.raceDate).valueOf())
}

export function TrainingsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'pt' ? 'pt-PT' : 'en-GB'
  const persistedState = useMemo(() => readPersistedTrainingsFilters(), [])
  const [selectedView, setSelectedView] = useState<TrainingsCalendarViewMode>(persistedState?.selectedView ?? 'table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<TrainingsCalendarMode>(persistedState?.selectedCalendarMode ?? 'monthly')
  const [filters, setFilters] = useState<TrainingFilters>(EMPTY_TRAINING_FILTERS)
  const deferredSearch = useDeferredValue(filters.search)
  const [isStatusesOpen, setIsStatusesOpen] = useState(true)
  const [isTypesOpen, setIsTypesOpen] = useState(true)
  const [trainings, setTrainings] = useState<TrainingTableItem[]>([])
  const [createOptions, setCreateOptions] = useState<TrainingCreateOptions>({ trainingTypes: [], races: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [draft, setDraft] = useState<TrainingDraft>(getEmptyDraft)
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null)
  const [selectedTraining, setSelectedTraining] = useState<TrainingTableItem | null>(null)
  const [typeEditorValue, setTypeEditorValue] = useState('')
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TrainingTableItem | null>(null)
  const [isStaleTrainingsModalOpen, setIsStaleTrainingsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const [isBulkUpdatingStaleTrainings, setIsBulkUpdatingStaleTrainings] = useState(false)
  const viewFilters = useMemo<TrainingFilters>(() => ({
    ...filters,
    search: deferredSearch,
  }), [deferredSearch, filters])
  const calendarServerFilters = useMemo<TrainingFilters>(() => ({
    ...filters,
    search: '',
  }), [filters])

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setTrainings([])
        setCreateOptions({ trainingTypes: [], races: [] })
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const [tablePayload, createOptionsPayload, filterOptionsPayload, raceTablePayload] = await Promise.all([
          fetchTrainingTable(token, selectedView === 'calendar' ? calendarServerFilters : viewFilters),
          fetchTrainingCreateOptions(token),
          fetchTrainingFilterOptions(token),
          fetchRaceTable(token, EMPTY_RACE_FILTERS),
        ])
        const raceStatusById = new Map(
          [...raceTablePayload.years.flatMap((year) => year.races), ...raceTablePayload.undatedRaces].map((race) => [race.id, race.raceStatus ?? null]),
        )

        setTrainings(tablePayload.trainings)
        setCreateOptions({
          trainingTypes: filterOptionsPayload.trainingTypes.length > 0
            ? filterOptionsPayload.trainingTypes
            : createOptionsPayload.trainingTypes,
          races: createOptionsPayload.races.map((race) => ({
            ...race,
            raceStatus: raceStatusById.get(race.id) ?? race.raceStatus,
          })),
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('trainings.errors.load'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [calendarServerFilters, selectedView, t, token, viewFilters])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stateToPersist: PersistedTrainingsFiltersState = {
      selectedView,
      selectedCalendarMode,
    }

    window.sessionStorage.setItem(STORAGE_KEYS.trainingsFilters, JSON.stringify(stateToPersist))
  }, [selectedCalendarMode, selectedView])

  const raceSections = useMemo(() => {
    const datedRaces = getEligibleTrainingRaces(createOptions.races)

    if (datedRaces.length === 0) {
      return []
    }

    const sections: RaceSection[] = datedRaces.map((race) => ({
      key: race.id,
      raceName: race.name,
      raceDate: race.raceDate!,
      raceStatus: race.raceStatus,
      items: [] as TrainingTableItem[],
    }))

    const sortedTrainings = [...trainings]
      .sort((left, right) => getTrainingSortValue(right) - getTrainingSortValue(left))

    sortedTrainings.forEach((training) => {
      if (training.associatedRaceId) {
        const explicitlyAssociatedSection = sections.find((section) => section.key === training.associatedRaceId)
        if (explicitlyAssociatedSection) {
          explicitlyAssociatedSection.items.push(training)
          return
        }
      }

      const trainingDate = dayjs(training.trainingDate)
      const sectionIndex = datedRaces.findIndex((race, index) => {
        if (trainingDate.isAfter(dayjs(race.raceDate), 'day')) {
          return false
        }
        const nextRace = datedRaces[index + 1]
        if (!nextRace?.raceDate) {
          return true
        }

        return trainingDate.isAfter(dayjs(nextRace.raceDate), 'day')
      })

      if (sectionIndex >= 0) {
        sections[sectionIndex].items.push(training)
      }
    })

    return sections
  }, [createOptions.races, trainings])

  const timelineItems = useMemo(() => {
    const datedRaces = getEligibleTrainingRaces(createOptions.races)

    const latestRaceDate = datedRaces.length > 0 ? dayjs(datedRaces[0].raceDate) : null

    const trainingItems: TimelineItem[] = trainings
      .filter((training) => (
        !training.associatedRaceId
        && (latestRaceDate == null || dayjs(training.trainingDate).isAfter(latestRaceDate, 'day'))
      ))
      .map((training) => ({
        key: `training-${training.id}`,
        kind: 'training',
        sortValue: getTrainingSortValue(training),
        training,
      }))

    return trainingItems.sort((left, right) => right.sortValue - left.sortValue)
  }, [createOptions.races, trainings])

  const defaultOpenRaceSectionKeys = useMemo(() => {
    const today = dayjs().startOf('day')
    const currentRaceSection = [...raceSections]
      .filter((section) => !dayjs(section.raceDate).isBefore(today, 'day'))
      .sort((left, right) => dayjs(left.raceDate).valueOf() - dayjs(right.raceDate).valueOf())[0]

    return currentRaceSection ? [currentRaceSection.key] : []
  }, [raceSections])

  const trainingsListYearSections = useMemo<TrainingsListYearSection[]>(() => {
    const entries: TrainingsListEntry[] = [
      ...timelineItems.map((item) => ({
        key: item.key,
        year: dayjs(item.training.trainingDate).year(),
        sortValue: item.sortValue,
        kind: 'training' as const,
        training: item.training,
      })),
      ...raceSections.map((group) => ({
        key: group.key,
        year: dayjs(group.raceDate).year(),
        sortValue: dayjs(group.raceDate).valueOf(),
        kind: 'raceSection' as const,
        group,
      })),
    ].sort((left, right) => right.sortValue - left.sortValue)

    const sectionsByYear = new Map<number, TrainingsListEntry[]>()
    entries.forEach((entry) => {
      const current = sectionsByYear.get(entry.year) ?? []
      current.push(entry)
      sectionsByYear.set(entry.year, current)
    })

    return [...sectionsByYear.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([year, yearEntries]) => ({
        year,
        entries: yearEntries,
      }))
  }, [raceSections, timelineItems])

  const trainingTypeOptions = useMemo(
    () => createOptions.trainingTypes.filter((option) => !option.archived),
    [createOptions.trainingTypes],
  )

  const deleteSeriesPreview = useMemo(() => {
    if (!deleteTarget?.seriesId) {
      return []
    }

    return trainings
      .filter((training) => training.seriesId === deleteTarget.seriesId)
      .sort((left, right) => {
        const leftValue = dayjs(`${left.trainingDate}T${left.trainingTime ?? '00:00:00'}`).valueOf()
        const rightValue = dayjs(`${right.trainingDate}T${right.trainingTime ?? '00:00:00'}`).valueOf()
        return leftValue - rightValue
      })
  }, [deleteTarget?.seriesId, trainings])

  const stalePlannedTrainings = useMemo(
    () => trainings.filter((training) => isPastPlannedTraining(training)),
    [trainings],
  )

  const hasActiveFilters = filters.search.trim().length > 0
    || filters.statuses.length > 0
    || filters.trainingTypeIds.length > 0
  const isTypeSaveDisabled = !typeEditorValue.trim()
  const isTrainingSaveDisabled = !draft.trainingDate
    || !draft.name.trim()
    || (draft.recurrenceEnabled && (
      !draft.recurrenceUntilDate
      || draft.recurrenceDaysOfWeek.length === 0
      || draft.recurrenceIntervalWeeks < 1
      || dayjs(draft.recurrenceUntilDate).isBefore(dayjs(draft.trainingDate), 'day')
    ))

  const handleToggleCompleted = async (training: TrainingTableItem, completed: boolean) => {
    if (!token) {
      return
    }

    try {
      const updatedTraining = await updateTrainingCompletion(training.id, completed, token)
      setTrainings((current) => current.map((item) => (item.id === updatedTraining.id ? updatedTraining : item)))
      setSelectedTraining((current) => (current?.id === updatedTraining.id ? updatedTraining : current))
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : t('trainings.errors.update'))
    }
  }

  const handleEdit = (training: TrainingTableItem) => {
    setSelectedTraining(null)
    setEditingTrainingId(training.id)
    setDraft({
      trainingDate: training.trainingDate,
      trainingTime: training.trainingTime,
      name: training.name,
      trainingTypeId: training.trainingTypeId,
      notes: training.notes ?? '',
      recurrenceEnabled: Boolean(training.seriesId && training.seriesDaysOfWeek.length > 0),
      recurrenceIntervalWeeks: training.seriesIntervalWeeks ?? 1,
      recurrenceUntilDate: training.seriesUntilDate,
      recurrenceDaysOfWeek: training.seriesDaysOfWeek,
    })
    setIsDrawerOpen(true)
  }

  const handleSave = async () => {
    if (!token || !draft.name.trim() || !draft.trainingDate) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const payload = buildTrainingRequest(draft)

      if (editingTrainingId) {
        const updatedTraining = await updateTraining(editingTrainingId, payload, token)
        setTrainings((current) => current.map((item) => (item.id === updatedTraining.id ? updatedTraining : item)))
        setSelectedTraining((current) => (current?.id === updatedTraining.id ? updatedTraining : current))
      } else {
        const createdTrainings = await createTraining(payload, token)
        setTrainings((current) => [...current, ...createdTrainings])
      }

      setIsDrawerOpen(false)
      setEditingTrainingId(null)
      setDraft(getEmptyDraft())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('trainings.errors.save'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkUpdateStaleTrainings = async () => {
    if (!token || stalePlannedTrainings.length === 0) {
      return
    }

    try {
      setIsBulkUpdatingStaleTrainings(true)
      setError(null)
      const updatedTrainings = await Promise.all(
        stalePlannedTrainings.map((training) => updateTrainingCompletion(training.id, true, token)),
      )

      setTrainings((current) => current.map((training) => {
        const updatedTraining = updatedTrainings.find((item) => item.id === training.id)
        return updatedTraining ?? training
      }))
      setIsStaleTrainingsModalOpen(false)
    } catch (bulkUpdateError) {
      setError(bulkUpdateError instanceof Error ? bulkUpdateError.message : t('trainings.errors.update'))
    } finally {
      setIsBulkUpdatingStaleTrainings(false)
    }
  }

  const handleDelete = async (scope: 'single' | 'series' = 'single') => {
    if (!token || !deleteTarget) {
      return
    }

    try {
      await deleteTraining(deleteTarget.id, token, scope)
      setTrainings((current) => current.filter((item) => (
        scope === 'series' && deleteTarget.seriesId
          ? item.seriesId !== deleteTarget.seriesId
          : item.id !== deleteTarget.id
      )))
      setSelectedTraining((current) => {
        if (!current) {
          return current
        }

        if (scope === 'series' && deleteTarget.seriesId) {
          return current.seriesId === deleteTarget.seriesId ? null : current
        }

        return current.id === deleteTarget.id ? null : current
      })
      setDeleteTarget(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('trainings.errors.delete'))
    }
  }

  const handleSaveType = async () => {
    if (!token || !typeEditorValue.trim()) {
      return
    }

    try {
      setTypeError(null)
      let nextType: TrainingTypeOption

      if (editingTypeId) {
        nextType = await updateTrainingType(editingTypeId, typeEditorValue.trim(), token)
        setCreateOptions((current) => ({
          ...current,
          trainingTypes: current.trainingTypes.map((type) => (type.id === nextType.id ? nextType : type)),
        }))
      } else {
        nextType = await createTrainingType(typeEditorValue.trim(), token)
        setCreateOptions((current) => ({
          ...current,
          trainingTypes: [...current.trainingTypes, nextType].sort((left, right) => left.name.localeCompare(right.name)),
        }))
        setDraft((current) => ({
          ...current,
          trainingTypeId: nextType.id,
        }))
      }

      setTypeEditorValue('')
      setEditingTypeId(null)
      setIsTypeModalOpen(false)
    } catch (saveError) {
      setTypeError(saveError instanceof Error ? saveError.message : t('trainings.errors.typeSave'))
    }
  }

  const handleDeleteType = async (trainingTypeId: string) => {
    if (!token) {
      return
    }

    try {
      setTypeError(null)
      await deleteTrainingType(trainingTypeId, token)
      setCreateOptions((current) => ({
        ...current,
        trainingTypes: current.trainingTypes.filter((type) => type.id !== trainingTypeId),
      }))
      setFilters((current) => ({
        ...current,
        trainingTypeIds: current.trainingTypeIds.filter((id) => id !== trainingTypeId),
      }))
      if (draft.trainingTypeId === trainingTypeId) {
        setDraft((current) => ({ ...current, trainingTypeId: null }))
      }
    } catch (deleteError) {
      setTypeError(deleteError instanceof Error ? deleteError.message : t('trainings.errors.typeDelete'))
    }
  }

  const renderTrainingStatus = (training: TrainingTableItem) => {
    const statusLabel = t(getTrainingStatusLabelKey(training.trainingStatus))
    const isStaleTraining = isPastPlannedTraining(training)

    return (
      <span className={styles.statusCell}>
        <Tooltip title={statusLabel}>
          <span
            className={`${styles.timelineStatusIcon} ${styles[getStatusClass(training.trainingStatus)]}`}
            aria-label={statusLabel}
          >
            <FontAwesomeIcon icon={getTimelineStatusIcon(training.trainingStatus)} />
          </span>
        </Tooltip>
        {isStaleTraining ? (
          <Tooltip title={t('trainings.stale.rowHint')}>
            <span className={styles.trainingRowWarningIcon} aria-label={t('trainings.stale.rowHint')}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </span>
          </Tooltip>
        ) : null}
      </span>
    )
  }

  const renderTrainingRow = (training: TrainingTableItem, key: string) => (
    <div
      key={key}
      className={`${styles.timelineRow} ${styles.timelineRowInteractive}`}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedTraining(training)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelectedTraining(training)
        }
      }}
    >
      <div className={styles.timelineTrainingGrid}>
        <div className={styles.timelineTrainingCellDone}>
          <label className={`${styles.completeCheckbox} ${isPastPlannedTraining(training) ? styles.staleCompleteCheckbox : ''}`}>
            <Checkbox
              checked={training.completed}
              disabled={isFutureTraining(training) && !training.completed}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => void handleToggleCompleted(training, event.target.checked)}
            />
          </label>
        </div>
        <div className={styles.timelineTrainingCellDate}>
          <div>{formatDate(training.trainingDate, locale)}</div>
          <Text type="secondary">{formatTime(training.trainingTime)}</Text>
        </div>
        <div className={styles.timelineTrainingCellName}>
          <span className={styles.timelineRowName}>{training.name}</span>
        </div>
        <div className={styles.timelineTrainingCellType}>
          {training.trainingTypeName ?? '-'}
        </div>
        <div className={styles.timelineTrainingCellStatus}>
          {renderTrainingStatus(training)}
        </div>
        <div className={styles.timelineTrainingCellActions}>
          <Space>
            <Button
              type="link"
              icon={<FontAwesomeIcon icon={faPenToSquare} />}
              aria-label={t('trainings.actions.edit')}
              onClick={(event) => {
                event.stopPropagation()
                handleEdit(training)
              }}
            />
            <Button
              type="link"
              danger
              icon={<FontAwesomeIcon icon={faTrashCan} />}
              aria-label={t('trainings.actions.delete')}
              onClick={(event) => {
                event.stopPropagation()
                setSelectedTraining(null)
                setDeleteTarget(training)
              }}
            />
          </Space>
        </div>
      </div>
    </div>
  )

  const renderRaceSection = (group: RaceSection, isLastInSection = false) => (
    <Collapse
      key={group.key}
      className={`${styles.yearSectionCollapse} ${isLastInSection ? styles.yearSectionCollapseLast : ''}`.trim()}
      defaultActiveKey={defaultOpenRaceSectionKeys.includes(group.key) ? [group.key] : []}
      items={[{
        key: group.key,
        showArrow: group.items.length > 0,
        collapsible: group.items.length > 0 ? undefined : 'disabled',
        className: [
          styles.raceCollapseItem,
          styles[`raceCollapseItem${getResolvedRaceStatus(group.raceDate, group.raceStatus) ?? 'Default'}`],
          group.items.length === 0 ? styles.raceCollapseItemNoArrow : '',
        ].filter(Boolean).join(' '),
        label: (
          <div className={`${styles.timelineRow} ${styles.timelineRaceRow} ${styles.raceCollapseHeader}`}>
            <div className={`${styles.timelineRowMain} ${styles.timelineRaceHeaderMain}`}>
              <span className={styles.timelineRowName}>{group.raceName}</span>
              {group.items.length > 0 ? (
                <span className={styles.timelineTrainingCountText}>
                  {group.items.length} {t('trainings.list.trainingsCount')}
                </span>
              ) : null}
            </div>
            <div className={styles.timelineRowMeta}>
              {getResolvedRaceStatus(group.raceDate, group.raceStatus) ? (
                <span
                  className={styles.timelineRaceStatusWrap}
                >
                  {dayjs(group.raceDate).isBefore(dayjs(), 'day') || getResolvedRaceStatus(group.raceDate, group.raceStatus) === 'COMPLETED' ? (
                    <span className={styles.racePanelStatusIcon} aria-label={t('races.status.completed')}>
                      <FontAwesomeIcon icon={faCheck} />
                    </span>
                  ) : (
                    <span
                      className={styles.timelineRaceStatus}
                      style={{
                        color: getRaceStatusColor(getResolvedRaceStatus(group.raceDate, group.raceStatus) ?? ''),
                      }}
                    >
                      {getRaceStatusLabel(getResolvedRaceStatus(group.raceDate, group.raceStatus) ?? '', t)}
                    </span>
                  )}
                </span>
              ) : null}
              <span>{formatDate(group.raceDate, locale)}</span>
            </div>
          </div>
        ),
        children: group.items.length > 0 ? (
          <div className={`${styles.timelineList} ${styles.collapseTrainingList}`}>
            {group.items.map((training) => renderTrainingRow(training, `${group.key}-${training.id}`))}
          </div>
        ) : null,
      }]}
    />
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.pageTitleRow}>
            <Title level={1} className={styles.pageTitle}>{t('trainings.title')}</Title>
            {stalePlannedTrainings.length > 0 ? (
              <Tooltip title={t('trainings.stale.headerHint')}>
                <button
                  type="button"
                  className={styles.staleAlertBadge}
                  onClick={() => setIsStaleTrainingsModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faTriangleExclamation} className={styles.staleAlertBadgeIcon} />
                  <span>{t('trainings.stale.headerCta', { count: stalePlannedTrainings.length })}</span>
                </button>
              </Tooltip>
            ) : null}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Segmented<TrainingsCalendarViewMode>
            value={selectedView}
            onChange={setSelectedView}
            options={[
              { value: 'table', label: t('trainings.view.list') },
              { value: 'calendar', label: t('trainings.view.calendar') },
            ]}
            className={viewSwitcherStyles.segmented}
            aria-label={t('trainings.view.selectorAria')}
          />
          <Button
            type="primary"
            className={styles.addButton}
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => {
              setEditingTrainingId(null)
              setDraft(getEmptyDraft())
              setIsDrawerOpen(true)
            }}
          >
            {t('trainings.actions.add')}
          </Button>
        </div>
      </div>

      <div className={styles.contentLayout}>
        <section className={styles.mainSection}>
          {error ? (
            <Alert
              type="error"
              showIcon
              message={t('trainings.errors.loadTitle')}
              description={error}
              style={{ marginBottom: 18 }}
            />
          ) : null}

          {selectedView === 'calendar' ? (
            isLoading ? (
              <Card className={styles.tableCard} variant="borderless">
                <div className={styles.loadingState}>
                  <Space size="middle">
                    <Spin />
                    <span>{t('trainings.loading')}</span>
                  </Space>
                </div>
              </Card>
            ) : (
              <TrainingsCalendarView
                selectedMode={selectedCalendarMode}
                trainings={trainings}
                filters={filters}
                onEditTraining={handleEdit}
                onDeleteTraining={(training) => setDeleteTarget(training)}
              />
            )
          ) : (
            <Card className={styles.tableCard} variant="borderless">
              {isLoading ? (
                <div className={styles.loadingState}>
                  <Space size="middle">
                    <Spin />
                    <span>{t('trainings.loading')}</span>
                  </Space>
                </div>
              ) : trainings.length === 0 && raceSections.length === 0 && timelineItems.length === 0 ? (
                <div className={styles.emptyWrap}>
                  <Empty description={hasActiveFilters ? t('trainings.empty.filtered') : t('trainings.empty.none')} />
                </div>
              ) : (
                <>
                  <div className={styles.yearSections}>
                    {trainingsListYearSections.map((section) => (
                      <div key={section.year} className={styles.yearSection}>
                        <div className={styles.yearSectionContent}>
                          {section.entries.map((entry, index) => (
                            entry.kind === 'training'
                              ? renderTrainingRow(entry.training, entry.key)
                              : renderRaceSection(entry.group, index === section.entries.length - 1)
                          ))}
                        </div>
                        <div className={styles.yearDivider}>{section.year}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </section>

        <aside>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>{t('trainings.filters.title')}</h3>
              {hasActiveFilters ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  onClick={() => setFilters(EMPTY_TRAINING_FILTERS)}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            {selectedView === 'calendar' ? (
              <label className={styles.filterField}>
                <span className={styles.filterLabel}>{t('trainings.calendarMode.label')}</span>
                <Segmented<TrainingsCalendarMode>
                  value={selectedCalendarMode}
                  onChange={setSelectedCalendarMode}
                  options={[
                    { value: 'monthly', label: t('trainings.calendarMode.monthly') },
                    { value: 'yearly', label: t('trainings.calendarMode.yearly') },
                  ]}
                  className={calendarModeSwitcherStyles.segmented}
                  aria-label={t('trainings.calendarMode.selectorAria')}
                />
              </label>
            ) : null}

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('trainings.filters.search')}</span>
              <Input
                allowClear
                className={styles.searchInput}
                value={filters.search}
                placeholder={t('trainings.filters.searchPlaceholder')}
                suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>

            <CheckboxFilterSection
              title={t('trainings.filters.status')}
              count={filters.statuses.length}
              isOpen={isStatusesOpen}
              onToggle={() => setIsStatusesOpen((current) => !current)}
              toggleLabel={t(isStatusesOpen ? 'trainings.filters.collapse' : 'trainings.filters.expand', { section: t('trainings.filters.status') })}
            >
              <div className={styles.checkboxList}>
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className={styles.checkboxOption}>
                    <Checkbox
                      checked={filters.statuses.includes(option.value)}
                      onChange={(event) => setFilters((current) => ({
                        ...current,
                        statuses: event.target.checked
                          ? [...current.statuses, option.value]
                          : current.statuses.filter((status) => status !== option.value),
                      }))}
                    />
                    <span className={styles.checkboxOptionLabel}>{t(option.labelKey)}</span>
                  </label>
                ))}
              </div>
            </CheckboxFilterSection>

            <CheckboxFilterSection
              title={t('trainings.filters.types')}
              count={filters.trainingTypeIds.length}
              isOpen={isTypesOpen}
              onToggle={() => setIsTypesOpen((current) => !current)}
              toggleLabel={t(isTypesOpen ? 'trainings.filters.collapse' : 'trainings.filters.expand', { section: t('trainings.filters.types') })}
              titleAction={(
                <button
                  type="button"
                  className={styles.filterManageButton}
                  onClick={() => setIsTypeModalOpen(true)}
                  aria-label={t('trainings.actions.manageTypes')}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              )}
            >
              <div className={styles.checkboxList}>
                {trainingTypeOptions.map((option) => (
                  <label key={option.id} className={styles.checkboxOption}>
                    <Checkbox
                      checked={filters.trainingTypeIds.includes(option.id)}
                      onChange={(event) => setFilters((current) => ({
                        ...current,
                        trainingTypeIds: event.target.checked
                          ? [...current.trainingTypeIds, option.id]
                          : current.trainingTypeIds.filter((trainingTypeId) => trainingTypeId !== option.id),
                      }))}
                    />
                    <span className={styles.checkboxOptionLabel}>{option.name}</span>
                  </label>
                ))}
              </div>
            </CheckboxFilterSection>

          </div>
        </aside>
      </div>

      <Drawer
        title={editingTrainingId ? t('trainings.drawer.editTitle') : t('trainings.drawer.addTitle')}
        placement="right"
        width={560}
        open={isDrawerOpen}
        destroyOnHidden
        onClose={() => setIsDrawerOpen(false)}
        extra={(
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              className={styles.drawerSaveButton}
              loading={isSaving}
              disabled={isTrainingSaveDisabled}
              onClick={() => void handleSave()}
            >
              {editingTrainingId ? t('trainings.actions.save') : t('trainings.actions.addShort')}
            </Button>
          </Space>
        )}
      >
        <div className={styles.drawerForm}>
          <div className={styles.dateTimeRow}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <span className={styles.requiredMark}>*</span>
                <span>{t('trainings.fields.date')}</span>
              </span>
              <DatePicker
                value={draft.trainingDate ? dayjs(draft.trainingDate) : null}
                format="DD/MM/YYYY"
                onChange={(value) => setDraft((current) => ({
                  ...current,
                  trainingDate: value ? value.format('YYYY-MM-DD') : '',
                  recurrenceUntilDate: current.recurrenceEnabled
                    ? (
                      !current.recurrenceUntilDate || dayjs(current.recurrenceUntilDate).isBefore(value, 'day')
                        ? value?.format('YYYY-MM-DD') ?? null
                        : current.recurrenceUntilDate
                    )
                    : current.recurrenceUntilDate,
                }))}
              />
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>{t('trainings.fields.time')}</span>
              <TimePicker
                value={draft.trainingTime ? dayjs(draft.trainingTime, 'HH:mm:ss') : null}
                format="HH:mm"
                onChange={(value) => setDraft((current) => ({
                  ...current,
                  trainingTime: value ? value.format('HH:mm:ss') : null,
                }))}
              />
            </label>
          </div>

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>
              <span className={styles.requiredMark}>*</span>
              <span>{t('trainings.fields.name')}</span>
            </span>
            <Input
              value={draft.name}
              maxLength={50}
              placeholder={t('trainings.placeholders.name')}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <div className={styles.typeRow}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <span>{t('trainings.fields.type')}</span>
              </span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={draft.trainingTypeId ?? undefined}
                placeholder={t('trainings.placeholders.type')}
                options={trainingTypeOptions.map((option) => ({ value: option.id, label: option.name }))}
                onChange={(value) => setDraft((current) => ({ ...current, trainingTypeId: value ?? null }))}
              />
            </label>

            <Tooltip title={t('trainings.actions.manageTypes')}>
              <Button
                icon={<FontAwesomeIcon icon={faPenToSquare} />}
                onClick={() => setIsTypeModalOpen(true)}
              />
            </Tooltip>
          </div>

          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>{t('trainings.fields.notes')}</span>
            <TextArea
              rows={4}
              value={draft.notes}
              placeholder={t('trainings.placeholders.notes')}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <div className={styles.fieldGroup}>
            <label className={styles.recurrenceToggle}>
              <Checkbox
                checked={draft.recurrenceEnabled}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  recurrenceEnabled: event.target.checked,
                  recurrenceUntilDate: event.target.checked
                    ? (current.recurrenceUntilDate && !dayjs(current.recurrenceUntilDate).isBefore(dayjs(current.trainingDate), 'day')
                      ? current.recurrenceUntilDate
                      : current.trainingDate)
                    : current.trainingDate,
                  recurrenceDaysOfWeek: event.target.checked && current.recurrenceDaysOfWeek.length === 0
                    ? [dayjs(current.trainingDate).day() === 0 ? 7 : dayjs(current.trainingDate).day()]
                    : current.recurrenceDaysOfWeek,
                }))}
              />
              <span>{t('trainings.fields.recurrence')}</span>
            </label>

            {draft.recurrenceEnabled ? (
              <>
                <div className={styles.recurrenceRow}>
                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>{t('trainings.fields.recurrenceInterval')}</span>
                    <InputNumber
                      min={1}
                      max={52}
                      value={draft.recurrenceIntervalWeeks}
                      onChange={(value) => setDraft((current) => ({
                        ...current,
                        recurrenceIntervalWeeks: typeof value === 'number' ? value : 1,
                      }))}
                    />
                  </label>

                  <label className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>{t('trainings.fields.recurrenceUntil')}</span>
                    <DatePicker
                      value={draft.recurrenceUntilDate ? dayjs(draft.recurrenceUntilDate) : null}
                      format="DD/MM/YYYY"
                      onChange={(value) => setDraft((current) => ({
                        ...current,
                        recurrenceUntilDate: value ? value.format('YYYY-MM-DD') : null,
                      }))}
                    />
                  </label>
                </div>

                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>{t('trainings.fields.recurrenceDays')}</span>
                  <div className={styles.weekdayGrid}>
                    {WEEKDAY_OPTIONS.map((option) => (
                      <label key={option.value} className={styles.weekdayOption}>
                        <Checkbox
                          checked={draft.recurrenceDaysOfWeek.includes(option.value)}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            recurrenceDaysOfWeek: event.target.checked
                              ? [...current.recurrenceDaysOfWeek, option.value].sort((left, right) => left - right)
                              : current.recurrenceDaysOfWeek.filter((dayOfWeek) => dayOfWeek !== option.value),
                          }))}
                        />
                        <span>{t(option.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <span className={styles.drawerHint}>{t('trainings.drawer.recurrenceHint')}</span>
              </>
            ) : null}
          </div>
        </div>
      </Drawer>

      <TrainingDetailsDrawer
        open={selectedTraining != null}
        training={selectedTraining}
        locale={locale}
        onEdit={() => {
          if (selectedTraining) {
            handleEdit(selectedTraining)
          }
        }}
        onDelete={() => {
          if (selectedTraining) {
            setDeleteTarget(selectedTraining)
            setSelectedTraining(null)
          }
        }}
        onClose={() => setSelectedTraining(null)}
      />

      <Modal
        title={t('trainings.stale.modalTitle')}
        open={isStaleTrainingsModalOpen}
        onCancel={() => setIsStaleTrainingsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsStaleTrainingsModalOpen(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="update-all"
            type="primary"
            className={styles.bulkUpdateButton}
            loading={isBulkUpdatingStaleTrainings}
            onClick={() => void handleBulkUpdateStaleTrainings()}
          >
            {t('trainings.stale.updateAll', { count: stalePlannedTrainings.length })}
          </Button>,
        ]}
      >
        <div className={styles.staleModalBody}>
          <Alert
            type="warning"
            showIcon
            message={t('trainings.stale.modalMessage')}
            description={t('trainings.stale.modalDescription')}
            className={styles.staleModalAlert}
          />

          <div className={styles.staleTrainingList}>
            {stalePlannedTrainings.map((training) => (
              <div key={training.id} className={styles.staleTrainingRow}>
                <div className={styles.staleTrainingRowMain}>
                  <span className={styles.staleTrainingRowName}>{training.name}</span>
                  <span className={styles.staleTrainingRowMeta}>
                    {formatDate(training.trainingDate, locale)}
                    {training.trainingTime ? ` - ${formatTime(training.trainingTime)}` : ''}
                    {training.trainingTypeName ? ` - ${training.trainingTypeName}` : ''}
                  </span>
                </div>
                <span className={styles.staleTrainingRowStatus}>
                  {t('trainings.status.planned')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title={t('trainings.types.title')}
        open={isTypeModalOpen}
        footer={null}
        onCancel={() => {
          setIsTypeModalOpen(false)
          setTypeEditorValue('')
          setEditingTypeId(null)
          setTypeError(null)
        }}
      >
        {typeError ? (
          <Alert
            type="error"
            showIcon
            message={t('trainings.errors.typeSaveTitle')}
            description={typeError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <div className={styles.typeEditor} style={{ marginBottom: 16 }}>
          <Input
            value={typeEditorValue}
            placeholder={t('trainings.types.placeholder')}
            onChange={(event) => setTypeEditorValue(event.target.value)}
          />
          <Button
            type="primary"
            className={styles.typeSaveButton}
            disabled={isTypeSaveDisabled}
            onClick={() => void handleSaveType()}
          >
            {editingTypeId ? t('trainings.actions.save') : t('trainings.actions.addShort')}
          </Button>
        </div>

        <div className={styles.typeList}>
          {trainingTypeOptions.map((type) => (
            <div key={type.id} className={styles.typeItem}>
              <span className={styles.typeName}>{type.name}</span>
              <Space>
                <Button
                  type="text"
                  onClick={() => {
                    setEditingTypeId(type.id)
                    setTypeEditorValue(type.name)
                  }}
                >
                  {t('trainings.actions.edit')}
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<FontAwesomeIcon icon={faTrashCan} />}
                  onClick={() => void handleDeleteType(type.id)}
                >
                  {t('trainings.actions.delete')}
                </Button>
              </Space>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={t('trainings.delete.title')}
        open={deleteTarget != null}
        footer={deleteTarget?.seriesId ? [
          <Button key="cancel" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>,
          <Button key="single" danger onClick={() => void handleDelete('single')}>
            {t('trainings.delete.deleteOnlyThis')}
          </Button>,
          <Button key="series" type="primary" danger onClick={() => void handleDelete('series')}>
            {t('trainings.delete.deleteWholeSeries')}
          </Button>,
        ] : undefined}
        okText={t('trainings.actions.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        onOk={() => void handleDelete('single')}
        onCancel={() => setDeleteTarget(null)}
      >
        <p>
          {deleteTarget?.seriesId
            ? t('trainings.delete.bodySeries', { name: deleteTarget?.name ?? '' })
            : t('trainings.delete.body', { name: deleteTarget?.name ?? '' })}
        </p>
        {deleteTarget?.seriesId ? (
          <div className={styles.deleteSeriesPreview}>
            {deleteSeriesPreview.slice(0, 3).map((training) => (
              <div key={training.id} className={styles.deleteSeriesPreviewRow}>
                <span className={styles.deleteSeriesPreviewName}>{training.name}</span>
                <span className={styles.deleteSeriesPreviewMeta}>
                  {formatDate(training.trainingDate, locale)}
                  {training.trainingTime ? ` - ${formatTime(training.trainingTime)}` : ''}
                </span>
              </div>
            ))}
            {deleteSeriesPreview.length > 3 ? (
              <div className={styles.deleteSeriesPreviewMore}>...</div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
