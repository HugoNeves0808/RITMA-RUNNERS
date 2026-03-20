import { useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  RacesCalendarView,
  RacesTableView,
  RacesViewSwitcher,
  type RacesCalendarMode,
  type RacesViewMode,
} from '../../features/races'
import { colors } from '../../theme/colors'

type HomeScreenProps = {
  token: string
}

export function HomeScreen({ token }: HomeScreenProps) {
  const [selectedView, setSelectedView] = useState<RacesViewMode>('table')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')
  const [showAllTableYears, setShowAllTableYears] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Races</Text>
        <View style={styles.headerControls}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setIsFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={selectedView === 'calendar' ? 'Open calendar filters' : 'Open table filters'}
          >
            <FontAwesome6 name="sliders" size={16} color={colors.textPrimary} />
          </Pressable>
          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
        </View>
      </View>

      {selectedView === 'calendar'
        ? <RacesCalendarView token={token} selectedMode={selectedCalendarMode} />
        : <RacesTableView token={token} showAllYears={showAllTableYears} />}

      <Modal
        visible={isFiltersOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFiltersOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsFiltersOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedView === 'calendar' ? 'Races calendar filters' : 'Races table filters'}</Text>
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
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
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
  modalTitle: {
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
})
