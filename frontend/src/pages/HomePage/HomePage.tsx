import { faAngleDown, faAngleUp, faBroom, faBucket, faMagnifyingGlass, faPenToSquare, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, Input, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../features/auth'
import {
  AddRaceDrawer,
  RacesCalendarView,
  RacesCalendarModeSwitcher,
  getRaceStatusColor,
  RACE_STATUS_OPTIONS,
  RacesTableView,
  RacesViewSwitcher,
  EMPTY_RACE_FILTERS,
  fetchRaceCreateOptions,
  fetchRaceFilterOptions,
  getRaceStatusLabel,
  type RaceFilterOptions,
  type RaceCreateOptions,
  type RaceFilters,
  type RacesCalendarMode,
  type RacesViewMode,
  type TableYearSelection,
  type CreateRacePayload,
} from '../../features/races'
import { STORAGE_KEYS } from '../../constants/storage'
import { translateRaceTypeName } from '../../utils/raceTypeLocalization'
import styles from './HomePage.module.css'

const { Title } = Typography
const DEFAULT_FILTER_PANEL_STATE = {
  isYearsOpen: true,
  isStatusesOpen: true,
  isRaceTypesOpen: true,
} as const

const VISIBLE_RACE_STATUS_OPTIONS = RACE_STATUS_OPTIONS.filter((option) => (
  option.value !== 'IN_LIST' && option.value !== 'IN_LIST_WITHOUT_DATE'
))

function getDefaultTableYearSelection(): TableYearSelection {
  return {
    allRaces: true,
    selectedYears: [],
  }
}

function isDefaultTableYearSelection(selection: TableYearSelection) {
  return selection.allRaces && selection.selectedYears.length === 0
}

type PersistedRacesFiltersState = {
  selectedView: RacesViewMode
  selectedCalendarMode: RacesCalendarMode
  tableYearSelection: TableYearSelection
  filters: RaceFilters
  isYearsOpen: boolean
  isStatusesOpen: boolean
  isRaceTypesOpen: boolean
}

function readPersistedRacesFilters(): PersistedRacesFiltersState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.racesFilters)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedRacesFiltersState>
    const selectedView = parsed.selectedView === 'calendar' ? 'calendar' : 'table'
    const selectedCalendarMode = parsed.selectedCalendarMode === 'yearly' ? 'yearly' : 'monthly'
    const tableYearSelection = parsed.tableYearSelection && typeof parsed.tableYearSelection === 'object'
      ? {
        allRaces: parsed.tableYearSelection.allRaces !== false,
        selectedYears: Array.isArray(parsed.tableYearSelection.selectedYears)
          ? parsed.tableYearSelection.selectedYears.filter((year): year is number => Number.isInteger(year))
          : [],
      }
      : getDefaultTableYearSelection()
    const filters = parsed.filters && typeof parsed.filters === 'object'
      ? {
        search: typeof parsed.filters.search === 'string' ? parsed.filters.search : '',
        statuses: Array.isArray(parsed.filters.statuses)
          ? parsed.filters.statuses.filter((status): status is string => (
            typeof status === 'string' && status !== 'IN_LIST' && status !== 'IN_LIST_WITHOUT_DATE'
          ))
          : [],
        year: null,
        raceTypeIds: Array.isArray(parsed.filters.raceTypeIds)
          ? parsed.filters.raceTypeIds.filter((raceTypeId): raceTypeId is string => typeof raceTypeId === 'string')
          : [],
      }
      : EMPTY_RACE_FILTERS

    return {
      selectedView,
      selectedCalendarMode,
      tableYearSelection,
      filters,
      isYearsOpen: parsed.isYearsOpen ?? DEFAULT_FILTER_PANEL_STATE.isYearsOpen,
      isStatusesOpen: parsed.isStatusesOpen ?? DEFAULT_FILTER_PANEL_STATE.isStatusesOpen,
      isRaceTypesOpen: parsed.isRaceTypesOpen ?? DEFAULT_FILTER_PANEL_STATE.isRaceTypesOpen,
    }
  } catch {
    return null
  }
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
          {titleAction ? <span className={styles.checkboxSectionTitleAction}>{titleAction}</span> : null}
        </span>
        <button
          type="button"
          className={styles.checkboxSectionToggle}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={toggleLabel}
        >
          <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} className={styles.checkboxSectionIcon} />
        </button>
      </div>

      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const currentYear = new Date().getFullYear()
  const persistedState = useMemo(() => readPersistedRacesFilters(), [])
  const isPageRefreshRef = useRef(false)
  const [selectedView, setSelectedView] = useState<RacesViewMode>(persistedState?.selectedView ?? 'table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>(persistedState?.selectedCalendarMode ?? 'monthly')
  const [tableYearSelection, setTableYearSelection] = useState<TableYearSelection>(() => (
    persistedState?.tableYearSelection ?? getDefaultTableYearSelection()
  ))
  const [filters, setFilters] = useState<RaceFilters>(persistedState?.filters ?? EMPTY_RACE_FILTERS)
  const [filterOptions, setFilterOptions] = useState<RaceFilterOptions>({ years: [], raceTypes: [] })
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({ raceTypes: [], teams: [], circuits: [], shoes: [] })
  const [isYearsOpen, setIsYearsOpen] = useState(persistedState?.isYearsOpen ?? DEFAULT_FILTER_PANEL_STATE.isYearsOpen)
  const [isStatusesOpen, setIsStatusesOpen] = useState(persistedState?.isStatusesOpen ?? DEFAULT_FILTER_PANEL_STATE.isStatusesOpen)
  const [isRaceTypesOpen, setIsRaceTypesOpen] = useState(persistedState?.isRaceTypesOpen ?? DEFAULT_FILTER_PANEL_STATE.isRaceTypesOpen)
  const [managedOptionModalType, setManagedOptionModalType] = useState<'race-types' | null>(null)
  const [isFilterOptionsLoading, setIsFilterOptionsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hasAnyRaces, setHasAnyRaces] = useState(false)
  const [isBucketListModalOpen, setIsBucketListModalOpen] = useState(false)
  const [bucketListCount, setBucketListCount] = useState(0)
  const [isPendingUpdatesModalOpen, setIsPendingUpdatesModalOpen] = useState(false)
  const [pendingUpdatesCount, setPendingUpdatesCount] = useState(0)
  const deferredSearch = useDeferredValue(filters.search)

  const viewFilters = useMemo<RaceFilters>(() => ({
    ...filters,
    search: deferredSearch,
  }), [deferredSearch, filters])

  const raceTypeOptions = useMemo(
    () => filterOptions.raceTypes.map((raceType) => ({
      value: raceType.id,
      label: translateRaceTypeName(raceType.name, t) ?? raceType.name,
    })),
    [filterOptions.raceTypes, t],
  )

  const availableAdditionalYears = useMemo(
    () => filterOptions.years.filter((year) => year !== currentYear).sort((left, right) => right - left),
    [currentYear, filterOptions.years],
  )

  const availableYears = useMemo(
    () => (filterOptions.years.includes(currentYear)
      ? [currentYear, ...availableAdditionalYears]
      : availableAdditionalYears),
    [availableAdditionalYears, currentYear, filterOptions.years],
  )

  const defaultTableYearSelection = useMemo(
    () => getDefaultTableYearSelection(),
    [],
  )
  const shouldShowClearFiltersButton = useMemo(
    () => selectedView !== 'table'
      || selectedCalendarMode !== 'monthly'
      || filters.search.trim().length > 0
      || filters.statuses.length > 0
      || filters.raceTypeIds.length > 0
      || !isDefaultTableYearSelection(tableYearSelection),
    [
      filters.raceTypeIds,
      filters.search,
      filters.statuses,
      selectedCalendarMode,
      selectedView,
      tableYearSelection,
    ],
  )

  const hasOtherActiveFilters = useMemo(
    () => filters.search.trim().length > 0 || filters.statuses.length > 0 || filters.raceTypeIds.length > 0,
    [filters.raceTypeIds, filters.search, filters.statuses],
  )

  const reloadRacesPageData = async (options?: { refreshTable?: boolean }) => {
    const shouldRefreshTable = options?.refreshTable ?? false

    if (!token) {
      setFilterOptions({ years: [], raceTypes: [] })
      setCreateOptions({ raceTypes: [], teams: [], circuits: [], shoes: [] })
      setHasAnyRaces(false)
      if (shouldRefreshTable) {
        setRefreshKey((current) => current + 1)
      }
      setIsFilterOptionsLoading(false)
      return
    }

    try {
      setIsFilterOptionsLoading(true)
      const [filterOptionsPayload, createOptionsPayload] = await Promise.all([
        fetchRaceFilterOptions(token),
        fetchRaceCreateOptions(token),
      ])

      const years = filterOptionsPayload.years
      const hasRaces = years.length > 0
      setFilterOptions({
        years,
        raceTypes: createOptionsPayload.raceTypes,
      })
      setHasAnyRaces(hasRaces)
      setCreateOptions(createOptionsPayload)
      if (shouldRefreshTable) {
        setRefreshKey((current) => current + 1)
      }
    } finally {
      setIsFilterOptionsLoading(false)
    }
  }

  const applyCreatedRaceVisibility = (payload?: CreateRacePayload) => {
    if (!payload) {
      return
    }

    const { race } = payload

    setFilters((current) => ({
      ...current,
      search: '',
      statuses: current.statuses.length > 0
        && race.raceStatus
        && race.raceStatus !== 'IN_LIST'
        && !current.statuses.includes(race.raceStatus)
        ? [...current.statuses, race.raceStatus]
        : current.statuses,
      raceTypeIds: current.raceTypeIds.length > 0 && race.raceTypeId && !current.raceTypeIds.includes(race.raceTypeId)
        ? [...current.raceTypeIds, race.raceTypeId]
        : current.raceTypeIds,
    }))

    setTableYearSelection((current) => {
      if (!race.raceDate) {
        return defaultTableYearSelection
      }

      const createdYear = new Date(race.raceDate).getFullYear()
      if (!Number.isInteger(createdYear)) {
        return current
      }

      if (current.allRaces) {
        return current
      }

      if (current.selectedYears.includes(createdYear)) {
        return current
      }

      return {
        allRaces: false,
        selectedYears: [...current.selectedYears, createdYear].sort((left, right) => right - left),
      }
    })
  }

  useEffect(() => {
    void reloadRacesPageData()
  }, [token])

  useEffect(() => {
    if (isFilterOptionsLoading) {
      return
    }

    setTableYearSelection((current) => {
      if (current.allRaces) {
        if (!hasAnyRaces) {
          return defaultTableYearSelection
        }

        return current
      }

      const nextSelectedYears = current.selectedYears.filter((year) => filterOptions.years.includes(year))

      if (nextSelectedYears.length === 0) {
        return defaultTableYearSelection
      }

      if (nextSelectedYears.length === current.selectedYears.length) {
        return current
      }

      return {
        allRaces: false,
        selectedYears: nextSelectedYears,
      }
    })
  }, [currentYear, defaultTableYearSelection, filterOptions.years, hasAnyRaces, isFilterOptionsLoading])

  useEffect(() => {
    if (selectedView === 'table' && !tableYearSelection.allRaces && tableYearSelection.selectedYears.length === 0) {
      setIsYearsOpen(false)
    }
  }, [selectedView, tableYearSelection.allRaces, tableYearSelection.selectedYears.length])

  useEffect(() => {
    if (selectedView === 'table' && (tableYearSelection.allRaces || tableYearSelection.selectedYears.length > 0)) {
      setIsYearsOpen(true)
    }
  }, [selectedView, tableYearSelection.allRaces, tableYearSelection.selectedYears.length])

  useEffect(() => {
    if (filters.statuses.length > 0) {
      setIsStatusesOpen(true)
    }
  }, [filters.statuses.length])

  useEffect(() => {
    if (filters.raceTypeIds.length > 0) {
      setIsRaceTypesOpen(true)
    }
  }, [filters.raceTypeIds.length])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stateToPersist: PersistedRacesFiltersState = {
      selectedView,
      selectedCalendarMode,
      tableYearSelection,
      filters,
      isYearsOpen,
      isStatusesOpen,
      isRaceTypesOpen,
    }

    window.sessionStorage.setItem(STORAGE_KEYS.racesFilters, JSON.stringify(stateToPersist))
  }, [
    filters,
    isRaceTypesOpen,
    isStatusesOpen,
    isYearsOpen,
    selectedCalendarMode,
    selectedView,
    tableYearSelection,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      isPageRefreshRef.current = true
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (!isPageRefreshRef.current) {
        window.sessionStorage.removeItem(STORAGE_KEYS.racesFilters)
      }
    }
  }, [])

  const handleYearToggle = (value: number | 'all-years', checked: boolean) => {
    if (value === 'all-years') {
      setTableYearSelection({
        allRaces: true,
        selectedYears: [],
      })
      return
    }

    if (!Number.isInteger(value)) {
      return
    }

    if (checked) {
      setTableYearSelection({
        allRaces: false,
        selectedYears: Array.from(new Set([
          ...tableYearSelection.selectedYears.filter((year) => filterOptions.years.includes(year)),
          value,
        ])).sort((left, right) => right - left),
      })
      return
    }

    const nextSelectedYears = tableYearSelection.selectedYears.filter((year) => year !== value)
    setTableYearSelection(nextSelectedYears.length > 0
      ? {
        allRaces: false,
        selectedYears: nextSelectedYears,
      }
      : (hasOtherActiveFilters
        ? {
          allRaces: true,
          selectedYears: [],
        }
        : defaultTableYearSelection))
  }

  const clearSidebarFilters = () => {
    setSelectedCalendarMode('monthly')
    setFilters(EMPTY_RACE_FILTERS)
    setTableYearSelection(defaultTableYearSelection)
  }

  const pendingUpdatesLabel = pendingUpdatesCount === 1
    ? t('races.page.pendingUpdatesOne')
    : t('races.page.pendingUpdatesOther', { count: pendingUpdatesCount })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <Title level={1} className={styles.pageTitle}>{t('races.title')}</Title>
            {pendingUpdatesCount > 0 ? (
              <button
                type="button"
                className={styles.pendingUpdatesNotice}
                onClick={() => setIsPendingUpdatesModalOpen(true)}
              >
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <span>{pendingUpdatesLabel}</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button
            type="text"
            className={styles.bucketListButton}
            icon={<FontAwesomeIcon icon={faBucket} />}
            onClick={() => setIsBucketListModalOpen(true)}
            disabled={bucketListCount === 0}
          >
            {t('races.page.futureRaces')}
          </Button>

          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />

          <AddRaceDrawer
            createOptions={createOptions}
            triggerLabel={t('races.page.addRace')}
            onCreateOptionsChange={(nextOptions) => {
              setCreateOptions(nextOptions)
              setFilterOptions((current) => ({
                ...current,
                raceTypes: nextOptions.raceTypes,
              }))
              setFilters((current) => ({
                ...current,
                raceTypeIds: current.raceTypeIds.filter((raceTypeId) => (
                  nextOptions.raceTypes.some((raceType) => raceType.id === raceTypeId)
                )),
              }))
            }}
            onCreated={async (payload) => {
              applyCreatedRaceVisibility(payload)
              await reloadRacesPageData({ refreshTable: true })
            }}
          />
        </div>
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.mainSection}>
          {selectedView === 'calendar'
            ? <RacesCalendarView selectedMode={selectedCalendarMode} onModeChange={setSelectedCalendarMode} filters={viewFilters} refreshKey={refreshKey} />
            : null}

          {selectedView === 'table' || isBucketListModalOpen || isPendingUpdatesModalOpen ? (
            <RacesTableView
              tableYearSelection={tableYearSelection}
              filters={viewFilters}
              refreshKey={refreshKey}
              createOptions={createOptions}
              hideContent={selectedView !== 'table'}
              bucketListOpen={isBucketListModalOpen}
              onBucketListOpenChange={setIsBucketListModalOpen}
              onBucketListCountChange={setBucketListCount}
              pendingUpdatesOpen={isPendingUpdatesModalOpen}
              onPendingUpdatesOpenChange={setIsPendingUpdatesModalOpen}
              onPendingUpdatesCountChange={setPendingUpdatesCount}
              onCreateOptionsChange={(nextOptions) => {
                setCreateOptions(nextOptions)
                setFilterOptions((current) => ({
                  ...current,
                  raceTypes: nextOptions.raceTypes,
                }))
                setFilters((current) => ({
                  ...current,
                  raceTypeIds: current.raceTypeIds.filter((raceTypeId) => (
                    nextOptions.raceTypes.some((raceType) => raceType.id === raceTypeId)
                  )),
                }))
              }}
            />
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>{t('races.page.filtersTitle')}</h3>
              {shouldShowClearFiltersButton ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  title={t('races.page.clearFilters')}
                  aria-label={t('races.page.clearFilters')}
                  onClick={clearSidebarFilters}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            {selectedView === 'calendar' ? (
              <div className={styles.filterField}>
                <span className={styles.filterLabel}>{t('races.page.calendarModeLabel')}</span>
                <RacesCalendarModeSwitcher
                  selectedMode={selectedCalendarMode}
                  onModeChange={setSelectedCalendarMode}
                />
              </div>
            ) : null}

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('races.page.raceSearchLabel')}</span>
              <Input
                allowClear
                className={styles.searchInput}
                value={filters.search}
                placeholder={t('races.page.raceSearchPlaceholder')}
                suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>

            {selectedView === 'table' ? (
              <CheckboxFilterSection
                title={t('races.page.yearsTitle')}
                count={tableYearSelection.allRaces ? 0 : tableYearSelection.selectedYears.length}
                isOpen={isYearsOpen}
                onToggle={() => setIsYearsOpen((current) => !current)}
                toggleLabel={t(isYearsOpen ? 'races.page.toggle.collapse' : 'races.page.toggle.expand', { section: t('races.page.yearsTitle') })}
              >
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxOption}>
                    <Checkbox
                      checked={tableYearSelection.allRaces}
                      onChange={(event) => handleYearToggle('all-years', event.target.checked)}
                    />
                    <span className={styles.checkboxOptionLabel}>{t('races.page.allYears')}</span>
                  </label>

                  {availableYears.map((year) => (
                    <label key={year} className={styles.checkboxOption}>
                      <Checkbox
                        checked={!tableYearSelection.allRaces && tableYearSelection.selectedYears.includes(year)}
                        onChange={(event) => handleYearToggle(year, event.target.checked)}
                      />
                      <span className={styles.checkboxOptionLabel}>{year}</span>
                    </label>
                  ))}
                </div>
              </CheckboxFilterSection>
            ) : null}

            <CheckboxFilterSection
              title={t('races.page.statusTitle')}
              count={filters.statuses.length}
              isOpen={isStatusesOpen}
              onToggle={() => setIsStatusesOpen((current) => !current)}
              toggleLabel={t(isStatusesOpen ? 'races.page.toggle.collapse' : 'races.page.toggle.expand', { section: t('races.page.statusTitle') })}
            >
              <div className={styles.checkboxList}>
                {VISIBLE_RACE_STATUS_OPTIONS.map((status) => (
                  <label
                    key={status.value}
                    className={styles.checkboxOption}
                  >
                      <Checkbox
                        checked={filters.statuses.includes(status.value)}
                        onChange={(event) => setFilters((current) => ({
                          ...current,
                          statuses: event.target.checked
                            ? [...current.statuses, status.value]
                            : current.statuses.filter((value) => value !== status.value),
                        }))}
                      />
                      <span className={styles.statusOption}>
                        <span
                          className={styles.statusDot}
                          style={{ backgroundColor: getRaceStatusColor(status.value) }}
                        />
                        <span className={styles.checkboxOptionLabel}>{getRaceStatusLabel(status.value, t)}</span>
                      </span>
                  </label>
                ))}
              </div>
            </CheckboxFilterSection>

            <CheckboxFilterSection
              title={t('races.page.typesTitle')}
              count={filters.raceTypeIds.length}
              isOpen={isRaceTypesOpen}
              onToggle={() => setIsRaceTypesOpen((current) => !current)}
              toggleLabel={t(isRaceTypesOpen ? 'races.page.toggle.collapse' : 'races.page.toggle.expand', { section: t('races.page.typesTitle') })}
              titleAction={(
                <button
                  type="button"
                  className={styles.filterManageButton}
                  onClick={() => setManagedOptionModalType('race-types')}
                  aria-label={t('races.page.manageRaceTypesAria')}
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              )}
            >
              <div className={styles.checkboxList}>
                {isFilterOptionsLoading ? <span className={styles.checkboxListHint}>{t('races.page.loadingRaceTypes')}</span> : null}
                {!isFilterOptionsLoading && raceTypeOptions.length === 0 ? (
                  <span className={styles.checkboxListHint}>{t('races.page.noRaceTypes')}</span>
                ) : null}

                {!isFilterOptionsLoading ? raceTypeOptions.map((raceType) => (
                  <label key={raceType.value} className={styles.checkboxOption}>
                    <Checkbox
                      checked={filters.raceTypeIds.includes(raceType.value)}
                      onChange={(event) => setFilters((current) => ({
                        ...current,
                        raceTypeIds: event.target.checked
                          ? [...current.raceTypeIds, raceType.value]
                          : current.raceTypeIds.filter((value) => value !== raceType.value),
                      }))}
                    />
                    <span className={styles.checkboxOptionLabel}>{raceType.label}</span>
                  </label>
                )) : null}
              </div>
            </CheckboxFilterSection>

            {managedOptionModalType ? (
              <AddRaceDrawer
                createOptions={createOptions}
                onCreated={() => Promise.resolve()}
                onCreateOptionsChange={(nextOptions) => {
                  setCreateOptions(nextOptions)
                  setFilterOptions((current) => ({
                    ...current,
                    raceTypes: nextOptions.raceTypes,
                  }))
                  setFilters((current) => ({
                    ...current,
                    raceTypeIds: current.raceTypeIds.filter((raceTypeId) => (
                      nextOptions.raceTypes.some((raceType) => raceType.id === raceTypeId)
                    )),
                  }))
                }}
                hideTrigger
                forceManageOptionType={managedOptionModalType}
                onManageOptionModalClose={() => setManagedOptionModalType(null)}
                onClose={() => setManagedOptionModalType(null)}
              />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
