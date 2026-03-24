import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { colors } from '../../../theme/colors'
import { fetchRaceTable, fetchRaceTypes, updateRaceTableItem, deleteRaceTableItems } from '../services/racesTableService'
import type { RaceFilters } from '../types/raceFilters'
import type { RaceTableItem, RaceTableYearGroup, RaceTypeOption } from '../types/racesTable'

type RacesTableViewProps = {
  token: string
  showAllYears: boolean
  filters: RaceFilters
  refreshKey?: number
}

type EditFormState = {
  raceDate: string
  name: string
  location: string
  raceTypeId: string
  officialTime: string
  chipTime: string
  pacePerKm: string
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
    case 'DID_NOT_FINISH':
      return 'DNF'
    case 'DID_NOT_START':
      return 'DNS'
    default:
      return status.replaceAll('_', ' ').toLowerCase()
  }
}

function getStatusPalette(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return { backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8' }
    case 'COMPLETED':
      return { backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#15803d' }
    case 'IN_LIST':
      return { backgroundColor: 'rgba(245, 158, 11, 0.14)', color: '#b45309' }
    case 'NOT_REGISTERED':
      return { backgroundColor: 'rgba(107, 114, 128, 0.14)', color: '#4b5563' }
    case 'CANCELLED':
      return { backgroundColor: 'rgba(220, 38, 38, 0.12)', color: '#b91c1c' }
    case 'DID_NOT_FINISH':
      return { backgroundColor: 'rgba(124, 58, 237, 0.12)', color: '#6d28d9' }
    case 'DID_NOT_START':
      return { backgroundColor: 'rgba(190, 24, 93, 0.12)', color: '#be185d' }
    default:
      return { backgroundColor: 'rgba(16, 24, 40, 0.06)', color: '#475467' }
  }
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`
}

function formatDurationInput(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return ''
  }

  return formatDuration(totalSeconds)
}

function formatPaceInput(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return ''
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function parseRaceDateTime(raceDate: string, raceTime: string | null) {
  return new Date(`${raceDate}T${raceTime ?? '23:59:59'}`)
}

function parseTimeToSeconds(value: string, mode: 'duration' | 'pace') {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (mode === 'duration' && parts.length === 3) {
    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Duration must use HH:MM:SS.')
    }

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error(mode === 'duration' ? 'Duration must use HH:MM:SS.' : 'Pace must use MM:SS.')
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration' ? 'Duration must use HH:MM:SS.' : 'Pace must use MM:SS.')
}

function getRaceDateTime(race: RaceTableItem) {
  return parseRaceDateTime(race.raceDate ?? '9999-12-31', race.raceTime)
}

function isRegisteredRace(race: RaceTableItem) {
  return race.raceStatus === 'REGISTERED'
}

function isUpcomingRace(race: RaceTableItem, now: Date) {
  if (!isRegisteredRace(race)) {
    return false
  }

  const raceDateTime = getRaceDateTime(race)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysSinceMonday = (startOfToday.getDay() + 6) % 7
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  return raceDateTime.toDateString() === startOfToday.toDateString()
    || (raceDateTime.getTime() > now.getTime() && raceDateTime.getTime() < endOfWeek.getTime())
}

function formatCountdown(race: RaceTableItem, now: Date) {
  const raceDateTime = getRaceDateTime(race)
  if (raceDateTime.getTime() <= now.getTime()) {
    return null
  }

  const diffMinutes = Math.max(Math.floor((raceDateTime.getTime() - now.getTime()) / 60000), 0)
  const days = Math.floor(diffMinutes / (60 * 24))
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60)
  const minutes = diffMinutes % 60

  return `starts in ${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}

function getFallbackUpcomingRaces(races: RaceTableItem[], now: Date) {
  const nextRace = races
    .filter((race) => isRegisteredRace(race) && getRaceDateTime(race).getTime() > now.getTime())
    .sort((left, right) => getRaceDateTime(left).getTime() - getRaceDateTime(right).getTime())[0]

  return nextRace ? [nextRace] : []
}

function removeUpcomingRaces(years: RaceTableYearGroup[], upcomingRaceIds: Set<string>) {
  return years
    .map((yearGroup) => ({
      ...yearGroup,
      races: yearGroup.races.filter((race) => !upcomingRaceIds.has(race.id)),
    }))
    .filter((yearGroup) => yearGroup.races.length > 0)
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

function createEditFormState(race: RaceTableItem): EditFormState {
  return {
    raceDate: race.raceDate ?? '',
    name: race.name,
    location: race.location ?? '',
    raceTypeId: race.raceTypeId ?? '',
    officialTime: formatDurationInput(race.officialTimeSeconds),
    chipTime: formatDurationInput(race.chipTimeSeconds),
    pacePerKm: formatPaceInput(race.pacePerKmSeconds),
  }
}

export function RacesTableView({ token, showAllYears, filters, refreshKey = 0 }: RacesTableViewProps) {
  const currentYear = new Date().getFullYear()
  const [now, setNow] = useState(() => new Date())
  const [years, setYears] = useState<RaceTableYearGroup[]>([])
  const [undatedRaces, setUndatedRaces] = useState<RaceTableItem[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceTypeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingRace, setEditingRace] = useState<RaceTableItem | null>(null)
  const [formState, setFormState] = useState<EditFormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRaceTypeSelectorOpen, setIsRaceTypeSelectorOpen] = useState(false)
  const [actionRace, setActionRace] = useState<RaceTableItem | null>(null)

  const visibleYears = useMemo(
    () => (showAllYears ? years : years.filter((yearGroup) => yearGroup.year === currentYear)),
    [currentYear, showAllYears, years],
  )

  const filteredVisibleYears = useMemo(
    () => filterYearsByRaceName(visibleYears, filters.search),
    [filters.search, visibleYears],
  )

  const filteredUndatedRaces = useMemo(() => {
    if (!filters.statuses.includes('IN_LIST')) {
      return []
    }

    const normalizedSearch = filters.search.trim().toLowerCase()
    return normalizedSearch
      ? undatedRaces.filter((race) => race.name.toLowerCase().includes(normalizedSearch))
      : undatedRaces
  }, [filters.search, filters.statuses, undatedRaces])

  const visibleRaces = useMemo(
    () => filteredVisibleYears.flatMap((yearGroup) => yearGroup.races),
    [filteredVisibleYears],
  )

  const upcomingRaces = useMemo(() => {
    const weekUpcomingRaces = visibleRaces
      .filter((race) => isUpcomingRace(race, now))
      .sort((left, right) => getRaceDateTime(left).getTime() - getRaceDateTime(right).getTime())

    return weekUpcomingRaces.length > 0
      ? weekUpcomingRaces
      : getFallbackUpcomingRaces(visibleRaces, now)
  }, [now, visibleRaces])

  const regularYears = useMemo(
    () => removeUpcomingRaces(filteredVisibleYears, new Set(upcomingRaces.map((race) => race.id))),
    [filteredVisibleYears, upcomingRaces],
  )

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const loadTableData = async () => {
      try {
        setIsLoading(true)
        const [tablePayload, raceTypesPayload] = await Promise.all([
          fetchRaceTable(token, filters),
          fetchRaceTypes(token),
        ])

        setYears(tablePayload.years ?? [])
        setUndatedRaces(tablePayload.undatedRaces ?? [])
        setRaceTypes(raceTypesPayload)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load races right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTableData()
  }, [filters, refreshKey, token])

  const reloadTableData = async () => {
    try {
      setIsLoading(true)
      const tablePayload = await fetchRaceTable(token, filters)
      setYears(tablePayload.years ?? [])
      setUndatedRaces(tablePayload.undatedRaces ?? [])
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load races right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenEdit = (race: RaceTableItem) => {
    setEditingRace(race)
    setFormState(createEditFormState(race))
  }

  const handleDelete = (race: RaceTableItem) => {
    Alert.alert(
      'Delete race?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteRaceTableItems([race.id], token)
                await reloadTableData()
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Unable to delete this race right now.')
              }
            })()
          },
        },
      ],
    )
  }

  const handleSaveEdit = async () => {
    if (!editingRace || !formState) {
      return
    }

    try {
      setIsSaving(true)
      await updateRaceTableItem(
        editingRace.id,
        {
          raceDate: formState.raceDate.trim(),
          name: formState.name.trim(),
          location: formState.location.trim() ? formState.location.trim() : null,
          raceTypeId: formState.raceTypeId || null,
          officialTimeSeconds: parseTimeToSeconds(formState.officialTime, 'duration'),
          chipTimeSeconds: parseTimeToSeconds(formState.chipTime, 'duration'),
          pacePerKmSeconds: parseTimeToSeconds(formState.pacePerKm, 'pace'),
        },
        token,
      )

      setEditingRace(null)
      setFormState(null)
      await reloadTableData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save this race right now.')
    } finally {
      setIsSaving(false)
    }
  }

  const renderRaceCard = (race: RaceTableItem, highlighted = false) => {
    const statusPalette = getStatusPalette(race.raceStatus)

    return (
      <View key={race.id} style={[styles.raceCard, highlighted ? styles.raceCardHighlighted : null]}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{getDayLabel(race.raceDate)}</Text>
          <Text style={styles.dateBadgeMonth}>{getCompactMonthLabel(race.raceDate)}</Text>
        </View>

        <View style={styles.raceMain}>
          <View style={styles.raceHeaderRow}>
            <View style={styles.raceTitleBlock}>
              <Text style={styles.raceTitle} numberOfLines={1} ellipsizeMode="tail">{race.name}</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{race.raceTypeName ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.statusActionsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.statusBadge, { backgroundColor: statusPalette.backgroundColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusPalette.color }]}>
                  {getRaceStatusLabel(race.raceStatus)}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={styles.moreAction}
                accessibilityRole="button"
                accessibilityLabel="More actions"
                onPress={() => setActionRace(race)}
              >
                <FontAwesome6 name="ellipsis-vertical" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.stateText}>Loading races</Text>
      </View>
    )
  }

  if (errorMessage) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.errorTitle}>Could not load races</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    )
  }

  if (years.length === 0 && undatedRaces.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>No races available.</Text>
      </View>
    )
  }

  if (visibleYears.length === 0 && filteredUndatedRaces.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>No races available for {currentYear}.</Text>
      </View>
    )
  }

  if (filteredVisibleYears.length === 0 && filteredUndatedRaces.length === 0) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateText}>No races match the current filters.</Text>
      </View>
    )
  }

  return (
    <View style={styles.content}>
      {upcomingRaces.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coming Up</Text>
            <View style={styles.sectionRule} />
            {formatCountdown(upcomingRaces[0], now) ? (
              <Text style={styles.sectionCountdown}>
                {formatCountdown(upcomingRaces[0], now)}
              </Text>
            ) : null}
          </View>

          <View style={styles.sectionBody}>
            {upcomingRaces.map((race) => renderRaceCard(race, true))}
          </View>
        </View>
      ) : null}

      {regularYears.map((yearGroup) => (
        <View key={yearGroup.year} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{yearGroup.year}</Text>
            <View style={styles.sectionRule} />
          </View>

          <View style={styles.sectionBody}>
            {yearGroup.races.map((race) => renderRaceCard(race))}
          </View>
        </View>
      ))}

      {filteredUndatedRaces.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In List</Text>
            <View style={styles.sectionRule} />
          </View>

          <View style={styles.sectionBody}>
            {filteredUndatedRaces.map((race) => renderRaceCard(race))}
          </View>
        </View>
      ) : null}

      <Modal
        visible={actionRace != null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionRace(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActionRace(null)}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>{actionRace?.name ?? 'Race actions'}</Text>
            <Pressable
              style={styles.actionSheetButton}
              onPress={() => {
                if (actionRace) {
                  handleOpenEdit(actionRace)
                }
                setActionRace(null)
              }}
            >
              <FontAwesome6 name="pen-to-square" size={16} color={colors.textPrimary} />
              <Text style={styles.actionSheetButtonLabel}>Edit race</Text>
            </Pressable>
            <Pressable
              style={styles.actionSheetButton}
              onPress={() => {
                if (actionRace) {
                  handleDelete(actionRace)
                }
                setActionRace(null)
              }}
            >
              <FontAwesome6 name="trash-can" size={16} color={colors.error} />
              <Text style={[styles.actionSheetButtonLabel, styles.actionSheetButtonLabelDanger]}>Delete race</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={editingRace != null && formState != null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setEditingRace(null)
          setFormState(null)
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setEditingRace(null)
            setFormState(null)
          }}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Edit race</Text>

            {formState ? (
              <View style={styles.formFields}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Race date</Text>
                  <TextInput
                    value={formState.raceDate}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, raceDate: value } : current))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    value={formState.name}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, name: value } : current))}
                    placeholder="Race name"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <TextInput
                    value={formState.location}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, location: value } : current))}
                    placeholder="Race location"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Race type</Text>
                  <Pressable style={styles.selectTrigger} onPress={() => setIsRaceTypeSelectorOpen(true)}>
                    <Text style={styles.selectTriggerLabel}>
                      {raceTypes.find((raceType) => raceType.id === formState.raceTypeId)?.name ?? 'Select a race type'}
                    </Text>
                    <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Official time</Text>
                  <TextInput
                    value={formState.officialTime}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, officialTime: value } : current))}
                    placeholder="HH:MM:SS"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Chip time</Text>
                  <TextInput
                    value={formState.chipTime}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, chipTime: value } : current))}
                    placeholder="HH:MM:SS"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Pace per km</Text>
                  <TextInput
                    value={formState.pacePerKm}
                    onChangeText={(value) => setFormState((current) => (current ? { ...current, pacePerKm: value } : current))}
                    placeholder="MM:SS"
                    placeholderTextColor="#98a2b3"
                    style={styles.fieldInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryAction}
                onPress={() => {
                  setEditingRace(null)
                  setFormState(null)
                }}
              >
                <Text style={styles.secondaryActionLabel}>Cancel</Text>
              </Pressable>

              <Pressable style={[styles.primaryAction, isSaving ? styles.primaryActionDisabled : null]} onPress={() => void handleSaveEdit()}>
                <Text style={styles.primaryActionLabel}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isRaceTypeSelectorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRaceTypeSelectorOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsRaceTypeSelectorOpen(false)}>
          <View style={styles.selectorCard}>
            {raceTypes.map((raceType) => {
              const isActive = raceType.id === formState?.raceTypeId

              return (
                <Pressable
                  key={raceType.id}
                  style={[styles.selectorOption, isActive ? styles.selectorOptionActive : null]}
                  onPress={() => {
                    setFormState((current) => (current ? { ...current, raceTypeId: raceType.id } : current))
                    setIsRaceTypeSelectorOpen(false)
                  }}
                >
                  <Text style={[styles.selectorOptionLabel, isActive ? styles.selectorOptionLabelActive : null]}>
                    {raceType.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCountdown: {
    marginLeft: 'auto',
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.12)',
  },
  sectionBody: {
    gap: 12,
  },
  stateCard: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.06)',
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  raceCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: colors.cardBackground,
  },
  raceCardHighlighted: {
    borderColor: 'rgba(249, 115, 22, 0.22)',
    backgroundColor: 'rgba(255, 249, 244, 0.98)',
  },
  dateBadge: {
    width: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: 'rgba(248, 250, 252, 0.98)',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  dateBadgeDay: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 30,
  },
  dateBadgeMonth: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  raceMain: {
    flex: 1,
    gap: 6,
  },
  raceHeaderRow: {
    gap: 6,
  },
  raceTitleBlock: {
    gap: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  raceTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  metricsGrid: {
    gap: 4,
  },
  statusActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    gap: 4,
  },
  metricLabel: {
    color: '#98a2b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moreAction: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(16, 24, 40, 0.22)',
  },
  modalCard: {
    maxHeight: '88%',
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  actionSheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: colors.cardBackground,
    padding: 18,
    gap: 8,
  },
  actionSheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(16, 24, 40, 0.04)',
  },
  actionSheetButtonLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSheetButtonLabelDanger: {
    color: colors.error,
  },
  formFields: {
    gap: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectTrigger: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
  },
  selectTriggerLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryAction: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryActionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryAction: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primaryButton,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryActionDisabled: {
    opacity: 0.7,
  },
  primaryActionLabel: {
    color: colors.primaryButtonText,
    fontSize: 15,
    fontWeight: '700',
  },
  selectorCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 10,
  },
  selectorOption: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorOptionActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  selectorOptionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectorOptionLabelActive: {
    color: colors.warning,
  },
})
