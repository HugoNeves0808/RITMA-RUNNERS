import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import { Input, Select, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import {
  AddRaceDrawer,
  RacesCalendarView,
  RacesCalendarModeSwitcher,
  RacesFiltersButton,
  getRaceStatusBackgroundColor,
  getRaceStatusColor,
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
} from '../../features/races'
import styles from './HomePage.module.css'

const { Title } = Typography

type ActiveFilterChip = {
  key: string
  label: string
  color?: string
  backgroundColor?: string
  onRemove: () => void
}

export function HomePage() {
  const { token } = useAuth()
  const [selectedView, setSelectedView] = useState<RacesViewMode>('table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')
  const [showAllTableYears, setShowAllTableYears] = useState(false)
  const [filters, setFilters] = useState<RaceFilters>(EMPTY_RACE_FILTERS)
  const [filterOptions, setFilterOptions] = useState<RaceFilterOptions>({ years: [], raceTypes: [] })
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({ raceTypes: [], teams: [], circuits: [], shoes: [] })
  const [isFilterOptionsLoading, setIsFilterOptionsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []

    if (filters.search.trim()) {
      chips.push({
        key: 'search',
        label: `Name: ${filters.search.trim()}`,
        onRemove: () => setFilters((current) => ({ ...current, search: '' })),
      })
    }

    filters.statuses.forEach((status) => {
      const label = RACE_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
      chips.push({
        key: `status-${status}`,
        label: `Status: ${label}`,
        color: getRaceStatusColor(status),
        backgroundColor: getRaceStatusBackgroundColor(status),
        onRemove: () => setFilters((current) => ({
          ...current,
          statuses: current.statuses.filter((value) => value !== status),
        })),
      })
    })

    filters.raceTypeIds.forEach((raceTypeId) => {
      const raceTypeName = filterOptions.raceTypes.find((raceType) => raceType.id === raceTypeId)?.name ?? raceTypeId
      chips.push({
        key: `race-type-${raceTypeId}`,
        label: `Race type: ${raceTypeName}`,
        onRemove: () => setFilters((current) => ({
          ...current,
          raceTypeIds: current.raceTypeIds.filter((value) => value !== raceTypeId),
        })),
      })
    })

    return chips
  }, [filterOptions.raceTypes, filters.raceTypeIds, filters.search, filters.statuses])

  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!token) {
        setFilterOptions({ years: [], raceTypes: [] })
        setCreateOptions({ raceTypes: [], teams: [], circuits: [], shoes: [] })
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
        setFilterOptions({
          years,
          raceTypes: createOptionsPayload.raceTypes,
        })
        setCreateOptions(createOptionsPayload)
      } finally {
        setIsFilterOptionsLoading(false)
      }
    }

    void loadFilterOptions()
  }, [token])

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <Title level={1} className={styles.pageTitle}>Races</Title>
            <AddRaceDrawer
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
              onCreated={() => setRefreshKey((current) => current + 1)}
            />
          </div>
        </div>

        <div className={styles.headerControls}>
          {selectedView === 'calendar' ? (
            <RacesCalendarModeSwitcher
              selectedMode={selectedCalendarMode}
              onModeChange={setSelectedCalendarMode}
            />
          ) : null}

          {selectedView === 'table' ? (
            <>
              <Input
                allowClear
                className={styles.searchInput}
                value={filters.search}
                placeholder="Search race"
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
              <Select
                className={styles.tableYearsSelect}
                value={showAllTableYears ? 'all' : 'current'}
                onChange={(value) => setShowAllTableYears(value === 'all')}
                options={[
                  { value: 'current', label: 'Current year' },
                  { value: 'all', label: 'All years' },
                ]}
                popupMatchSelectWidth={false}
              />
            </>
          ) : null}

          <RacesFiltersButton
            filters={filters}
            options={filterOptions}
            isLoading={isFilterOptionsLoading}
            onChange={setFilters}
          />

          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
        </div>
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
              {chip.color ? (
                <span
                  className={styles.filterChipDot}
                  style={{ backgroundColor: chip.color }}
                />
              ) : null}
              <span className={styles.filterChipLabel}>{chip.label}</span>
              <span className={styles.filterChipIcon}>
                <FontAwesomeIcon icon={faXmark} />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedView === 'calendar'
        ? <RacesCalendarView selectedMode={selectedCalendarMode} onModeChange={setSelectedCalendarMode} filters={filters} refreshKey={refreshKey} />
        : <RacesTableView showAllYears={showAllTableYears} filters={filters} refreshKey={refreshKey} />}
    </div>
  )
}
