import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

export function AdminRitmaOverviewScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Overview</Text>
      <Text style={styles.description}>This placeholder screen is ready for the future admin overview of the platform.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: colors.pageBackground,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  description: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
})
