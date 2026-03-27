import { faBroom, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Select, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import {
  AddRaceDrawer,
  RacesCalendarView,
  RacesCalendarModeSwitcher,
  getRaceStatusBackgroundColor,
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
import styles from './HomePage.module.css'

const { Title } = Typography
const ALL_RACES_VALUE = '__ALL_RACES__'

type ActiveFilterChip = {
  key: string
  label: string
  color?: string
  backgroundColor?: string
  onRemove: () => void
}

function getDefaultTableYearSelection(): TableYearSelection {
  return {
    allRaces: true,
    selectedYears: [],
  }
}

export function HomePage() {
  const { token } = useAuth()
  const currentYear = new Date().getFullYear()
  const [selectedView, setSelectedView] = useState<RacesViewMode>('table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')
  const [tableYearSelection, setTableYearSelection] = useState<TableYearSelection>(() => (
    getDefaultTableYearSelection()
  ))
  const [filters, setFilters] = useState<RaceFilters>(EMPTY_RACE_FILTERS)
  const [filterOptions, setFilterOptions] = useState<RaceFilterOptions>({ years: [], raceTypes: [] })
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({ raceTypes: [], teams: [], circuits: [], shoes: [] })
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

  const yearSelectOptions = useMemo(
    () => [
      { value: ALL_RACES_VALUE, label: 'All years' },
      ...availableYears.map((year) => ({ value: String(year), label: String(year) })),
    ],
    [availableYears],
  )

  const yearSelectValue = useMemo(
    () => (tableYearSelection.allRaces ? [ALL_RACES_VALUE] : tableYearSelection.selectedYears.map(String)),
    [tableYearSelection],
  )

  const hasOtherActiveFilters = useMemo(
    () => filters.search.trim().length > 0 || filters.statuses.length > 0 || filters.raceTypeIds.length > 0,
    [filters.raceTypeIds, filters.search, filters.statuses],
  )

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []

    if (filters.search.trim()) {
      chips.push({
        key: 'search',
        label: filters.search.trim(),
        onRemove: () => setFilters((current) => ({ ...current, search: '' })),
      })
    }

    filters.statuses.forEach((status) => {
      const label = RACE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
      chips.push({
        key: `status-${status}`,
        label,
        color: getRaceStatusColor(status),
        backgroundColor: getRaceStatusBackgroundColor(status),
        onRemove: () => setFilters((current) => ({
          ...current,
          statuses: current.statuses.filter((value) => value !== status),
        })),
      })
    })

    if (selectedView === 'table') {
      if (tableYearSelection.allRaces && hasAnyRaces) {
        chips.push({
          key: 'years-all-races',
          label: 'All years',
          onRemove: () => setTableYearSelection(defaultTableYearSelection),
        })
      } else if (tableYearSelection.selectedYears.length > 0) {
        tableYearSelection.selectedYears.forEach((year) => {
          chips.push({
            key: `year-${year}`,
            label: String(year),
            onRemove: () => setTableYearSelection((current) => {
              const nextSelectedYears = current.selectedYears.filter((value) => value !== year)

              return nextSelectedYears.length > 0
                ? {
                  allRaces: false,
                  selectedYears: nextSelectedYears,
                }
                : (hasOtherActiveFilters
                  ? {
                    allRaces: true,
                    selectedYears: [],
                  }
                  : defaultTableYearSelection)
            }),
          })
        })
      }
    }

    filters.raceTypeIds.forEach((raceTypeId) => {
      const raceTypeName = filterOptions.raceTypes.find((raceType) => raceType.id === raceTypeId)?.name ?? raceTypeId
      chips.push({
        key: `race-type-${raceTypeId}`,
        label: raceTypeName,
        onRemove: () => setFilters((current) => ({
          ...current,
          raceTypeIds: current.raceTypeIds.filter((value) => value !== raceTypeId),
        })),
      })
    })

    const isSingleDefaultTableFilter = selectedView === 'table'
      && chips.length === 1
      && (
        (tableYearSelection.allRaces && chips[0]?.label === 'All years')
        || (
          !tableYearSelection.allRaces
          && tableYearSelection.selectedYears.length === 1
          && tableYearSelection.selectedYears[0] === currentYear
          && chips[0]?.label === String(currentYear)
        )
      )

    return isSingleDefaultTableFilter ? [] : chips
  }, [
    currentYear,
    defaultTableYearSelection,
    filterOptions.raceTypes,
    filters.raceTypeIds,
    filters.search,
    hasAnyRaces,
    hasOtherActiveFilters,
    filters.statuses,
    selectedView,
    tableYearSelection,
  ])

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
        setHasAnyRaces(hasRaces)
        setCreateOptions(createOptionsPayload)
      } finally {
        setIsFilterOptionsLoading(false)
      }
    }

    void loadFilterOptions()
  }, [refreshKey, token])

  useEffect(() => {
    setTableYearSelection((current) => {
      if (current.allRaces) {
        if (!hasAnyRaces) {
          return defaultTableYearSelection
        }

        return current
      }

      const nextSelectedYears = current.selectedYears.filter((year) => filterOptions.years.includes(year))

      if (nextSelectedYears.length === 0 || (!current.selectedYears.includes(currentYear) && filterOptions.years.includes(currentYear))) {
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
  }, [currentYear, defaultTableYearSelection, filterOptions.years, hasAnyRaces])

  const handleYearSelect = (value: string) => {
    if (value === ALL_RACES_VALUE) {
      setTableYearSelection({
        allRaces: true,
        selectedYears: [],
      })
      return
    }

    const selectedYear = Number(value)
    if (!Number.isInteger(selectedYear)) {
      return
    }

    setTableYearSelection({
      allRaces: false,
      selectedYears: Array.from(new Set([
        ...tableYearSelection.selectedYears.filter((year) => filterOptions.years.includes(year)),
        selectedYear,
      ])).sort((left, right) => right - left),
    })
  }

  const handleYearDeselect = (value: string) => {
    if (value === ALL_RACES_VALUE) {
      setTableYearSelection(defaultTableYearSelection)
      return
    }

    const deselectedYear = Number(value)
    if (!Number.isInteger(deselectedYear)) {
      return
    }

    const nextSelectedYears = tableYearSelection.selectedYears.filter((year) => year !== deselectedYear)
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

  const handleYearsClear = () => {
    setTableYearSelection(defaultTableYearSelection)
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

      {activeFilterChips.length > 0 ? (
        <div className={styles.activeFiltersRow}>
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={`${styles.filterChip} ${chip.color ? styles.filterChipStatus : ''}`.trim()}
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label}`}
              style={chip.color && chip.backgroundColor ? {
                color: chip.color,
                backgroundColor: chip.backgroundColor,
                borderColor: chip.backgroundColor,
              } : undefined}
            >
              <span className={styles.filterChipLabel}>{chip.label}</span>
              <span className={styles.filterChipIcon}>
                <FontAwesomeIcon icon={faXmark} />
              </span>
            </button>
          ))}
        </div>
      ) : null}

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

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>View</span>
              <div className={styles.fullWidthControl}>
                <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
              </div>
            </div>

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
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </label>

            {selectedView === 'table' ? (
              <div className={styles.filterField}>
                <span className={styles.filterLabel}>Years</span>
                <Select
                  mode="multiple"
                  allowClear
                  value={yearSelectValue}
                  options={yearSelectOptions}
                  onSelect={handleYearSelect}
                  onDeselect={handleYearDeselect}
                  onClear={handleYearsClear}
                  maxTagCount="responsive"
                  placeholder="Select years"
                />
              </div>
            ) : null}

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Race status</span>
              <Select
                mode="multiple"
                allowClear
                value={filters.statuses}
                options={RACE_STATUS_OPTIONS.map((status) => ({
                  value: status.value,
                  disabled: selectedView === 'calendar' && status.value === IN_LIST_WITHOUT_DATE_STATUS,
                  label: (
                    <span className={styles.statusOption}>
                      <span
                        className={styles.statusDot}
                        style={{ backgroundColor: getRaceStatusColor(status.value) }}
                      />
                      <span>{status.label}</span>
                    </span>
                  ),
                }))}
                placeholder="Select statuses"
                onChange={(value) => setFilters((current) => ({ ...current, statuses: value }))}
              />
            </label>

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Race types</span>
              <Select
                mode="multiple"
                allowClear
                loading={isFilterOptionsLoading}
                value={filters.raceTypeIds}
                options={raceTypeOptions}
                placeholder="Select race types"
                onChange={(value) => setFilters((current) => ({ ...current, raceTypeIds: value }))}
              />
            </label>
          </div>
        </aside>
      </div>
    </div>
  )
}
