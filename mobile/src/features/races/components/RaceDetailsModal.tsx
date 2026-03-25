import { useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RaceDetailResponse } from '../types/racesTable'

type RaceDetailsModalProps = {
  visible: boolean
  race: RaceDetailResponse | null
  isLoading: boolean
  error: string | null
  activeTab: 'race' | 'results' | 'analysis'
  onTabChange: (tab: 'race' | 'results' | 'analysis') => void
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const TAB_OPTIONS = [
  { key: 'race', label: 'Race data' },
  { key: 'results', label: 'Results' },
  { key: 'analysis', label: 'Analysis' },
] as const

function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDisplayTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const [hoursText = '0', minutesText = '0'] = value.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value
  }

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12
  return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function formatBoolean(value: boolean | null | undefined) {
  if (value == null) {
    return '-'
  }

  return value ? 'Yes' : 'No'
}

function formatStatusLabel(status: string | null | undefined) {
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

function getStatusPalette(status: string | null | undefined) {
  switch (status) {
    case 'REGISTERED':
      return { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }
    case 'COMPLETED':
      return { backgroundColor: 'rgba(22, 163, 74, 0.16)', color: '#15803d' }
    case 'IN_LIST':
      return { backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#b45309' }
    case 'NOT_REGISTERED':
      return { backgroundColor: 'rgba(107, 114, 128, 0.16)', color: '#475467' }
    case 'CANCELLED':
      return { backgroundColor: 'rgba(220, 38, 38, 0.14)', color: '#dc2626' }
    case 'DID_NOT_START':
      return { backgroundColor: 'rgba(190, 24, 93, 0.14)', color: '#be185d' }
    case 'DID_NOT_FINISH':
      return { backgroundColor: 'rgba(124, 58, 237, 0.14)', color: '#7c3aed' }
    default:
      return { backgroundColor: 'rgba(16, 24, 40, 0.08)', color: '#475467' }
  }
}

function renderField(label: string, value: string | number | null | undefined) {
  return (
    <View key={label} style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value == null || value === '' ? '-' : String(value)}</Text>
    </View>
  )
}

export function RaceDetailsModal({
  visible,
  race,
  isLoading,
  error,
  activeTab,
  onTabChange,
  onClose,
  onEdit,
  onDelete,
}: RaceDetailsModalProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const statusPalette = getStatusPalette(race?.race.raceStatus)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setIsActionsOpen(false)
        onClose()
      }}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (isActionsOpen) {
              setIsActionsOpen(false)
              return
            }

            onClose()
          }}
        />
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerMain}>
              <Text style={styles.eyebrow}>Race overview</Text>
              <Text style={styles.title} numberOfLines={1}>{race?.race.name ?? 'Race details'}</Text>
            </View>

            <View style={styles.headerButtons}>
              <View style={styles.dropdownAnchor}>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setIsActionsOpen((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel="Race actions"
                >
                  <FontAwesome6 name="ellipsis-vertical" size={16} color={colors.textPrimary} />
                </Pressable>

                {isActionsOpen ? (
                  <View style={styles.actionsDropdown}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        setIsActionsOpen(false)
                        onEdit()
                      }}
                    >
                      <FontAwesome6 name="pen-to-square" size={14} color={colors.textPrimary} />
                      <Text style={styles.actionButtonLabel}>Edit race</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        setIsActionsOpen(false)
                        onDelete()
                      }}
                    >
                      <FontAwesome6 name="trash-can" size={14} color={colors.error} />
                      <Text style={[styles.actionButtonLabel, styles.actionButtonDanger]}>Delete race</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setIsActionsOpen(false)
                  onClose()
                }}
                accessibilityRole="button"
                accessibilityLabel="Close race details"
              >
                <FontAwesome6 name="xmark" size={16} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.statusRow}>
            {race ? (
              <View style={[styles.statusBadge, { backgroundColor: statusPalette.backgroundColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusPalette.color }]}>{formatStatusLabel(race.race.raceStatus)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tabs}>
            {TAB_OPTIONS.map((tab) => {
              const isActive = activeTab === tab.key

              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
                  onPress={() => onTabChange(tab.key)}
                >
                  <Text style={[styles.tabButtonLabel, isActive ? styles.tabButtonLabelActive : null]}>{tab.label}</Text>
                </Pressable>
              )
            })}
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {isLoading ? <Text style={styles.stateText}>Loading race details...</Text> : null}
            {!isLoading && error ? <Text style={styles.stateText}>{error}</Text> : null}
            {!isLoading && !error && !race ? <Text style={styles.stateText}>Could not load this race.</Text> : null}

            {!isLoading && !error && race && activeTab === 'race' ? (
              <>
                <View style={styles.overviewCard}>
                  <View style={styles.summaryGrid}>
                    {renderField('Date', race.race.raceDate)}
                    {renderField('Time', formatDisplayTime(race.race.raceTime))}
                    {renderField('Type', race.race.raceTypeName)}
                  </View>
                </View>

                <View style={styles.fieldsGrid}>
                  {renderField('Location', race.race.location)}
                  {renderField('Team', race.race.teamName)}
                  {renderField('Circuit', race.race.circuitName)}
                  {renderField('Real KM', race.race.realKm)}
                  {renderField('Elevation', race.race.elevation)}
                  {renderField('Valid for category ranking', formatBoolean(race.race.isValidForCategoryRanking))}
                </View>
              </>
            ) : null}

            {!isLoading && !error && race && activeTab === 'results' ? (
              <>
                <View style={styles.metricsGrid}>
                  {renderField('Official time', formatDuration(race.results.officialTimeSeconds))}
                  {renderField('Chip time', formatDuration(race.results.chipTimeSeconds))}
                  {renderField('Pace per KM', formatPace(race.results.pacePerKmSeconds))}
                </View>

                <View style={styles.fieldsGrid}>
                  {renderField('Shoe', race.results.shoeName)}
                  {renderField('General classification', race.results.generalClassification)}
                  {renderField('General classification podium', formatBoolean(race.results.isGeneralClassificationPodium))}
                  {renderField('Age group classification', race.results.ageGroupClassification)}
                  {renderField('Age group podium', formatBoolean(race.results.isAgeGroupClassificationPodium))}
                  {renderField('Team classification', race.results.teamClassification)}
                  {renderField('Team podium', formatBoolean(race.results.isTeamClassificationPodium))}
                </View>
              </>
            ) : null}

            {!isLoading && !error && race && activeTab === 'analysis' ? (
              <>
                <View style={styles.fieldsGrid}>
                  {renderField('Pre-race confidence', race.analysis.preRaceConfidence)}
                  {renderField('Race difficulty', race.analysis.raceDifficulty)}
                  {renderField('Final satisfaction', race.analysis.finalSatisfaction)}
                  {renderField('Would repeat this race', formatBoolean(race.analysis.wouldRepeatThisRace))}
                </View>

                <View style={styles.noteCard}>
                  <Text style={styles.fieldLabel}>Pain / injuries</Text>
                  <Text style={styles.noteValue}>{race.analysis.painInjuries ?? '-'}</Text>
                </View>

                <View style={styles.noteCard}>
                  <Text style={styles.fieldLabel}>Analysis notes</Text>
                  <Text style={styles.noteValue}>{race.analysis.analysisNotes ?? '-'}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(16, 24, 40, 0.26)',
  },
  modalCard: {
    maxHeight: '88%',
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  dropdownAnchor: {
    position: 'relative',
  },
  eyebrow: {
    color: '#9a3412',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(16, 24, 40, 0.04)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionsDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 164,
    gap: 6,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 24, 40, 0.04)',
  },
  actionButtonLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonDanger: {
    color: colors.error,
  },
  statusBadge: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 24, 40, 0.04)',
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  tabButtonLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonLabelActive: {
    color: colors.primaryButtonText,
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    gap: 14,
    paddingBottom: 6,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 28,
  },
  overviewCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#fffaf5',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.18)',
  },
  summaryGrid: {
    gap: 12,
  },
  fieldsGrid: {
    gap: 12,
  },
  fieldCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  fieldLabel: {
    color: '#98a2b3',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  metricsGrid: {
    gap: 12,
  },
  noteCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  noteValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
})
