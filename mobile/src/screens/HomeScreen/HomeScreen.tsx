import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  RacesCalendarView,
  RacesTableView,
  RacesViewSwitcher,
  type RacesViewMode,
} from '../../features/races'
import { colors } from '../../theme/colors'

export function HomeScreen() {
  const [selectedView, setSelectedView] = useState<RacesViewMode>('calendar')

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Races</Text>
        <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
      </View>

      {selectedView === 'calendar' ? <RacesCalendarView /> : <RacesTableView />}
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
    gap: 16,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
})
