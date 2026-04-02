import { faAngleDown, faAngleUp, faBroom, faMagnifyingGlass, faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, Input, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import {
  AddRaceDrawer,
  RacesCalendarView,
  RacesCalendarModeSwitcher,
  getRaceStatusColor,
  IN_LIST_WITHOUT_DATE_STATUS,
  RACE_STATUS_OPTIONS,
  RacesTableView,
  RacesViewSwitcher,
  EMPTY_RACE_FILTERS,
  fetchRaceCreateOptions,
  fetchRaceTable,
  type RaceFilterOptions,
  type RaceCreateOptions,
  type RaceFilters,
  type RacesCalendarMode,
  type RacesViewMode,
  type TableYearSelection,
} from '../../features/races'
import { STORAGE_KEYS } from '../../constants/storage'
import styles from './HomePage.module.css'

const { Title } = Typography
const DEFAULT_FILTER_PANEL_STATE = {
  isYearsOpen: true,
  isStatusesOpen: true,
  isRaceTypesOpen: true,
} as const

function getStatusesFromTablePayload(payload: Awaited<ReturnType<typeof fetchRaceTable>>) {
  const collectedStatuses = new Set<string>()

  payload.years.forEach((yearGroup) => {
    yearGroup.races.forEach((race) => {
      if (!race.raceStatus) {
        return
      }

      collectedStatuses.add(race.raceStatus)
    })
  })

  payload.undatedRaces.forEach((race) => {
    if (race.raceStatus === 'IN_LIST') {
      collectedStatuses.add(IN_LIST_WITHOUT_DATE_STATUS)
    }
  })

  return RACE_STATUS_OPTIONS
    .map((option) => option.value)
    .filter((status) => collectedStatuses.has(status))
}

function getDefaultTableYearSelection(): TableYearSelection {
  return {
    allRaces: true,
    selectedYears: [],
  }
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
          ? parsed.filters.statuses.filter((status): status is string => typeof status === 'string')
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
  titleAction?: React.ReactNode
  children: React.ReactNode
}

function CheckboxFilterSection({
  title,
  count,
  isOpen,
  onToggle,
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
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} className={styles.checkboxSectionIcon} />
        </button>
      </div>

      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

export function HomePage() {
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
  const [allYearsAvailableStatuses, setAllYearsAvailableStatuses] = useState<string[]>([])
  const [isYearsOpen, setIsYearsOpen] = useState(persistedState?.isYearsOpen ?? DEFAULT_FILTER_PANEL_STATE.isYearsOpen)
  const [isStatusesOpen, setIsStatusesOpen] = useState(persistedState?.isStatusesOpen ?? DEFAULT_FILTER_PANEL_STATE.isStatusesOpen)
  const [isRaceTypesOpen, setIsRaceTypesOpen] = useState(persistedState?.isRaceTypesOpen ?? DEFAULT_FILTER_PANEL_STATE.isRaceTypesOpen)
  const [managedOptionModalType, setManagedOptionModalType] = useState<'race-types' | null>(null)
  const [isFilterOptionsLoading, setIsFilterOptionsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [hasAnyRaces, setHasAnyRaces] = useState(false)

  const raceTypeOptions = useMemo(
    () => filterOptions.raceTypes.map((raceType) => ({ value: raceType.id, label: raceType.name })),
    [filterOptions.raceTypes],
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

  const hasOtherActiveFilters = useMemo(
    () => filters.search.trim().length > 0 || filters.statuses.length > 0 || filters.raceTypeIds.length > 0,
    [filters.raceTypeIds, filters.search, filters.statuses],
  )

  useEffect(() => {
    if (selectedView !== 'calendar') {
      return
    }

    setFilters((current) => (
      current.statuses.includes(IN_LIST_WITHOUT_DATE_STATUS)
        ? {
          ...current,
          statuses: current.statuses.filter((status) => status !== IN_LIST_WITHOUT_DATE_STATUS),
        }
        : current
    ))
  }, [selectedView])

  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!token) {
        setFilterOptions({ years: [], raceTypes: [] })
        setCreateOptions({ raceTypes: [], teams: [], circuits: [], shoes: [] })
        setHasAnyRaces(false)
        setIsFilterOptionsLoading(false)
        return
      }

      try {
        setIsFilterOptionsLoading(true)
        const [tablePayload, createOptionsPayload] = await Promise.all([
          fetchRaceTable(token),
          fetchRaceCreateOptions(token),
        ])

        const years = tablePayload.years.map((yearGroup) => yearGroup.year)
        const hasRaces = years.length > 0 || (tablePayload.undatedRaces?.length ?? 0) > 0
        setFilterOptions({
          years,
          raceTypes: createOptionsPayload.raceTypes,
        })
        setAllYearsAvailableStatuses(getStatusesFromTablePayload(tablePayload))
        setHasAnyRaces(hasRaces)
        setCreateOptions(createOptionsPayload)
      } finally {
        setIsFilterOptionsLoading(false)
      }
    }

    void loadFilterOptions()
  }, [refreshKey, token])

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
    if (selectedView !== 'table' || !tableYearSelection.allRaces || filters.statuses.length > 0) {
      return
    }

    setFilters((current) => {
      const nextStatuses = allYearsAvailableStatuses
      if (
        current.statuses.length === nextStatuses.length
        && current.statuses.every((status, index) => status === nextStatuses[index])
      ) {
        return current
      }

      return {
        ...current,
        statuses: nextStatuses,
      }
    })
  }, [allYearsAvailableStatuses, selectedView, tableYearSelection.allRaces])

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
    if (filters.statuses.length === 0) {
      setIsStatusesOpen(false)
    }
  }, [filters.statuses.length])

  useEffect(() => {
    if (filters.statuses.length > 0) {
      setIsStatusesOpen(true)
    }
  }, [filters.statuses.length])

  useEffect(() => {
    if (filters.raceTypeIds.length === 0) {
      setIsRaceTypesOpen(false)
    }
  }, [filters.raceTypeIds.length])

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
    setSelectedView('table')
    setSelectedCalendarMode('monthly')
    setFilters(EMPTY_RACE_FILTERS)
    setTableYearSelection(defaultTableYearSelection)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <Title level={1} className={styles.pageTitle}>Races</Title>
          </div>
        </div>

        <div className={styles.headerActions}>
          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />

          <AddRaceDrawer
            createOptions={createOptions}
            triggerLabel="Add Race"
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
            onCreated={() => setRefreshKey((current) => current + 1)}
          />
        </div>
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.mainSection}>
          {selectedView === 'calendar'
            ? <RacesCalendarView selectedMode={selectedCalendarMode} onModeChange={setSelectedCalendarMode} filters={filters} refreshKey={refreshKey} />
            : (
              <RacesTableView
                tableYearSelection={tableYearSelection}
                filters={filters}
                refreshKey={refreshKey}
                createOptions={createOptions}
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
            )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Filters</h3>
              <Button
                type="text"
                className={styles.clearButton}
                icon={<FontAwesomeIcon icon={faBroom} />}
                title="Clear filters"
                aria-label="Clear filters"
                onClick={clearSidebarFilters}
              />
            </div>

            <div className={styles.sidebarDivider} />

            {selectedView === 'calendar' ? (
              <div className={styles.filterField}>
                <span className={styles.filterLabel}>Calendar mode</span>
                <RacesCalendarModeSwitcher
                  selectedMode={selectedCalendarMode}
                  onModeChange={setSelectedCalendarMode}
                />
              </div>
            ) : null}

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Race search</span>
              <Input
                allowClear
                className={styles.searchInput}
                value={filters.search}
                placeholder="Search race"
                suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>

            {selectedView === 'table' ? (
              <CheckboxFilterSection
                title="Years"
                count={tableYearSelection.allRaces ? 1 : tableYearSelection.selectedYears.length}
                isOpen={isYearsOpen}
                onToggle={() => setIsYearsOpen((current) => !current)}
              >
                <div className={styles.checkboxList}>
                  <label className={styles.checkboxOption}>
                    <Checkbox
                      checked={tableYearSelection.allRaces}
                      onChange={(event) => handleYearToggle('all-years', event.target.checked)}
                    />
                    <span className={styles.checkboxOptionLabel}>All years</span>
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
              title="Race status"
              count={filters.statuses.length}
              isOpen={isStatusesOpen}
              onToggle={() => setIsStatusesOpen((current) => !current)}
            >
              <div className={styles.checkboxList}>
                {RACE_STATUS_OPTIONS.map((status) => {
                  const disabled = selectedView === 'calendar' && status.value === IN_LIST_WITHOUT_DATE_STATUS

                  return (
                    <label
                      key={status.value}
                      className={`${styles.checkboxOption} ${disabled ? styles.checkboxOptionDisabled : ''}`.trim()}
                    >
                      <Checkbox
                        checked={filters.statuses.includes(status.value)}
                        disabled={disabled}
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
                        <span className={styles.checkboxOptionLabel}>{status.label}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </CheckboxFilterSection>

            <CheckboxFilterSection
              title="Race types"
              count={filters.raceTypeIds.length}
              isOpen={isRaceTypesOpen}
              onToggle={() => setIsRaceTypesOpen((current) => !current)}
              titleAction={(
                <button
                  type="button"
                  className={styles.filterManageButton}
                  onClick={() => setManagedOptionModalType('race-types')}
                  aria-label="Create or manage race types"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              )}
            >
              <div className={styles.checkboxList}>
                {isFilterOptionsLoading ? <span className={styles.checkboxListHint}>Loading race types</span> : null}
                {!isFilterOptionsLoading && raceTypeOptions.length === 0 ? (
                  <span className={styles.checkboxListHint}>No race types available</span>
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
          </div>
        </aside>
      </div>
    </div>
  )
}
