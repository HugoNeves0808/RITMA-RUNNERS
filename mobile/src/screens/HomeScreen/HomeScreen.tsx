import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  RacesCalendarView,
  RacesCalendarModeSwitcher,
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
  const [selectedView, setSelectedView] = useState<RacesViewMode>('calendar')
  const [selectedCalendarMode, setSelectedCalendarMode] = useState<RacesCalendarMode>('monthly')

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Races</Text>
        <View style={styles.headerControls}>
          {selectedView === 'calendar' ? (
            <RacesCalendarModeSwitcher selectedMode={selectedCalendarMode} onModeChange={setSelectedCalendarMode} />
          ) : null}
          <RacesViewSwitcher selectedView={selectedView} onViewChange={setSelectedView} />
        </View>
      </View>

      {selectedView === 'calendar'
        ? <RacesCalendarView token={token} selectedMode={selectedCalendarMode} />
        : <RacesTableView />}
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
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
})
