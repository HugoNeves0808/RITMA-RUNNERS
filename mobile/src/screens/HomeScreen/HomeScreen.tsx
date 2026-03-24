import { useEffect, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  AddRaceModal,
  EMPTY_RACE_FILTERS,
  RACE_STATUS_OPTIONS,
  RacesCalendarView,
  RacesTableView,
  RacesViewSwitcher,
  countActiveRaceFilters,
  getRaceStatusBackgroundColor,
  getRaceStatusColor,
  type RaceFilterOptions,
  type RaceFilters,
  type RaceCreateOptions,
  type RacesCalendarMode,
  type RacesViewMode,
} from '../../features/races'
import { colors } from '../../theme/colors'
import { fetchRaceCreateOptions, fetchRaceTable } from '../../features/races/services/racesTableService'

type HomeScreenProps = {
  token: string
}

export function HomeScreen({ token }: HomeScreenProps) {
  const [selectedView, setSelectedView] = useState<RacesViewMode>('table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')
  const [showAllTableYears, setShowAllTableYears] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<RaceFilters>(EMPTY_RACE_FILTERS)
  const [filterOptions, setFilterOptions] = useState<RaceFilterOptions>({ years: [], raceTypes: [] })
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({
    raceTypes: [],
    teams: [],
    circuits: [],
    shoes: [],
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [openFilterDropdown, setOpenFilterDropdown] = useState<'statuses' | 'raceTypes' | null>(null)

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [tablePayload, nextCreateOptions] = await Promise.all([
          fetchRaceTable(token),
          fetchRaceCreateOptions(token),
        ])

        setFilterOptions({
          years: tablePayload.years.map((yearGroup) => yearGroup.year),
          raceTypes: nextCreateOptions.raceTypes,
        })
        setCreateOptions(nextCreateOptions)
      } catch {
        setFilterOptions({ years: [], raceTypes: [] })
        setCreateOptions({ raceTypes: [], teams: [], circuits: [], shoes: [] })
      }
    }

    void loadFilterOptions()
  }, [refreshKey, token])

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Races</Text>
          <AddRaceModal
            token={token}
            createOptions={createOptions}
            onCreateOptionsChange={(nextOptions) => {
              setCreateOptions(nextOptions)
              setFilterOptions((current) => ({
                ...current,
                raceTypes: nextOptions.raceTypes,
              }))
            }}
            onCreated={() => setRefreshKey((current) => current + 1)}
          />
        </View>
        <View style={styles.headerControls}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setIsFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={selectedView === 'calendar' ? 'Open calendar filters' : 'Open table filters'}
          >
            <FontAwesome6 name="sliders" size={16} color={colors.textPrimary} />
            {countActiveRaceFilters(filters) > 0 ? <View style={styles.filterBadge} /> : null}
          </Pressable>
          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
        </View>
      </View>

      {selectedView === 'table' ? (
        <TextInput
          value={filters.search}
          onChangeText={(value) => setFilters((current) => ({ ...current, search: value }))}
          placeholder="Search race"
          placeholderTextColor="#98a2b3"
          style={styles.searchInput}
        />
      ) : null}

      {selectedView === 'calendar'
        ? <RacesCalendarView token={token} selectedMode={selectedCalendarMode} filters={filters} refreshKey={refreshKey} />
        : <RacesTableView token={token} showAllYears={showAllTableYears} filters={filters} refreshKey={refreshKey} />}

      <Modal
        visible={isFiltersOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsFiltersOpen(false)
          setOpenFilterDropdown(null)
        }}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => {
          setIsFiltersOpen(false)
          setOpenFilterDropdown(null)
        }}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedView === 'calendar' ? 'Races calendar filters' : 'Races table filters'}</Text>
              {(filters.statuses.length > 0 || filters.raceTypeIds.length > 0) ? (
                <Pressable
                  style={styles.resetButton}
                  onPress={() => setFilters((current) => ({ ...EMPTY_RACE_FILTERS, search: current.search }))}
                >
                  <FontAwesome6 name="rotate-left" size={14} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.modalDivider} />

            {selectedView === 'calendar' ? (
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>View mode</Text>

                <View style={styles.inlineSwitcher}>
                  <Pressable
                    style={[styles.switchOption, selectedCalendarMode === 'monthly' ? styles.switchOptionActive : null]}
                    onPress={() => {
                      setSelectedCalendarMode('monthly')
                      setIsFiltersOpen(false)
                    }}
                  >
                    <Text style={[styles.switchOptionLabel, selectedCalendarMode === 'monthly' ? styles.switchOptionLabelActive : null]}>
                      Monthly
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.switchOption, selectedCalendarMode === 'yearly' ? styles.switchOptionActive : null]}
                    onPress={() => {
                      setSelectedCalendarMode('yearly')
                      setIsFiltersOpen(false)
                    }}
                  >
                    <Text style={[styles.switchOptionLabel, selectedCalendarMode === 'yearly' ? styles.switchOptionLabelActive : null]}>
                      Yearly
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {selectedView === 'table' ? (
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Scope</Text>

                <View style={styles.inlineSwitcher}>
                  <Pressable
                    style={[styles.switchOption, !showAllTableYears ? styles.switchOptionActive : null]}
                    onPress={() => {
                      setShowAllTableYears(false)
                      setIsFiltersOpen(false)
                    }}
                  >
                    <Text style={[styles.switchOptionLabel, !showAllTableYears ? styles.switchOptionLabelActive : null]}>
                      Current year
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.switchOption, showAllTableYears ? styles.switchOptionActive : null]}
                    onPress={() => {
                      setShowAllTableYears(true)
                      setIsFiltersOpen(false)
                    }}
                  >
                    <Text style={[styles.switchOptionLabel, showAllTableYears ? styles.switchOptionLabelActive : null]}>
                      All years
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Race status</Text>
              <View style={styles.dropdownWrap}>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setOpenFilterDropdown((current) => (current === 'statuses' ? null : 'statuses'))}
                >
                  <View style={styles.dropdownTriggerContent}>
                    {filters.statuses[0] ? (
                      <View style={[styles.filterOptionDot, { backgroundColor: getRaceStatusColor(filters.statuses[0]) }]} />
                    ) : null}
                    <Text style={[styles.dropdownTriggerLabel, filters.statuses.length === 0 ? styles.dropdownTriggerPlaceholder : null]}>
                      {filters.statuses.length === 1
                        ? (RACE_STATUS_OPTIONS.find((option) => option.value === filters.statuses[0])?.label ?? 'Race status')
                        : filters.statuses.length > 1
                          ? `${filters.statuses.length} statuses`
                        : 'All statuses'}
                    </Text>
                  </View>
                  <FontAwesome6 name={openFilterDropdown === 'statuses' ? 'angle-up' : 'angle-down'} size={16} color={colors.textSecondary} />
                </Pressable>

                {openFilterDropdown === 'statuses' ? (
                  <View style={styles.dropdownMenu}>
                    <Pressable
                      style={[styles.dropdownOption, filters.statuses.length === 0 ? styles.dropdownOptionActive : null]}
                      onPress={() => {
                        setFilters((current) => ({ ...current, statuses: [] }))
                        setOpenFilterDropdown(null)
                      }}
                    >
                      <Text style={[styles.dropdownOptionLabel, filters.statuses.length === 0 ? styles.dropdownOptionLabelActive : null]}>
                        All statuses
                      </Text>
                    </Pressable>
                    {RACE_STATUS_OPTIONS.map((statusOption) => {
                      const isActive = filters.statuses.includes(statusOption.value)
                      const color = getRaceStatusColor(statusOption.value)

                      return (
                        <Pressable
                          key={statusOption.value}
                          style={[styles.dropdownOption, isActive ? styles.dropdownOptionActive : null]}
                          onPress={() => {
                            setFilters((current) => ({
                              ...current,
                              statuses: current.statuses.includes(statusOption.value)
                                ? current.statuses.filter((value) => value !== statusOption.value)
                                : [...current.statuses, statusOption.value],
                            }))
                          }}
                        >
                          <View style={styles.dropdownOptionContent}>
                            <View style={[styles.filterOptionDot, { backgroundColor: color }]} />
                            <Text style={[styles.dropdownOptionLabel, isActive ? styles.dropdownOptionLabelActive : null]}>
                              {statusOption.label}
                            </Text>
                            {isActive ? (
                              <FontAwesome6 name="check" size={12} color={colors.textPrimary} style={styles.dropdownOptionCheck} />
                            ) : null}
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Race types</Text>
              <View style={styles.dropdownWrap}>
                <Pressable
                  style={styles.dropdownTrigger}
                  onPress={() => setOpenFilterDropdown((current) => (current === 'raceTypes' ? null : 'raceTypes'))}
                >
                  <Text style={[styles.dropdownTriggerLabel, filters.raceTypeIds.length === 0 ? styles.dropdownTriggerPlaceholder : null]}>
                    {filters.raceTypeIds.length === 1
                      ? (filterOptions.raceTypes.find((raceType) => raceType.id === filters.raceTypeIds[0])?.name ?? 'Race type')
                      : filters.raceTypeIds.length > 1
                        ? `${filters.raceTypeIds.length} race types`
                      : 'All race types'}
                  </Text>
                  <FontAwesome6 name={openFilterDropdown === 'raceTypes' ? 'angle-up' : 'angle-down'} size={16} color={colors.textSecondary} />
                </Pressable>

                {openFilterDropdown === 'raceTypes' ? (
                  <View style={styles.dropdownMenu}>
                    <Pressable
                      style={[styles.dropdownOption, filters.raceTypeIds.length === 0 ? styles.dropdownOptionActive : null]}
                      onPress={() => {
                        setFilters((current) => ({ ...current, raceTypeIds: [] }))
                        setOpenFilterDropdown(null)
                      }}
                    >
                      <Text style={[styles.dropdownOptionLabel, filters.raceTypeIds.length === 0 ? styles.dropdownOptionLabelActive : null]}>
                        All race types
                      </Text>
                    </Pressable>
                    {filterOptions.raceTypes.map((raceType) => {
                      const isActive = filters.raceTypeIds.includes(raceType.id)

                      return (
                        <Pressable
                          key={raceType.id}
                          style={[styles.dropdownOption, isActive ? styles.dropdownOptionActive : null]}
                          onPress={() => {
                            setFilters((current) => ({
                              ...current,
                              raceTypeIds: current.raceTypeIds.includes(raceType.id)
                                ? current.raceTypeIds.filter((value) => value !== raceType.id)
                                : [...current.raceTypeIds, raceType.id],
                            }))
                          }}
                        >
                          <View style={styles.dropdownOptionContent}>
                            <Text style={[styles.dropdownOptionLabel, isActive ? styles.dropdownOptionLabelActive : null]}>
                              {raceType.name}
                            </Text>
                            {isActive ? (
                              <FontAwesome6 name="check" size={12} color={colors.textPrimary} style={styles.dropdownOptionCheck} />
                            ) : null}
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: colors.cardBackground,
  },
  filterBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.warning,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(16, 24, 40, 0.18)',
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 18,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.08)',
  },
  filterGroup: {
    gap: 10,
  },
  filterLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inlineSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 24, 40, 0.04)',
  },
  switchOption: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  switchOptionActive: {
    backgroundColor: colors.textPrimary,
  },
  switchOptionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  switchOptionLabelActive: {
    color: colors.primaryButtonText,
  },
  filterOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownWrap: {
    gap: 8,
  },
  dropdownTrigger: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
  },
  dropdownTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  dropdownTriggerLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownTriggerPlaceholder: {
    color: '#98a2b3',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    padding: 6,
    gap: 2,
  },
  dropdownOption: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(16, 24, 40, 0.06)',
  },
  dropdownOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownOptionCheck: {
    marginLeft: 'auto',
  },
  dropdownOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownOptionLabelActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  filterOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    borderRadius: 999,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  filterOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  raceTypeChipActive: {
    borderColor: 'rgba(30, 64, 175, 0.10)',
    backgroundColor: 'rgba(30, 64, 175, 0.10)',
  },
  raceTypeChipLabelActive: {
    color: '#1e40af',
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: colors.cardBackground,
  },
})
