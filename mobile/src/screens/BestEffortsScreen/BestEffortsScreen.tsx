import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

export function BestEffortsScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Best Efforts</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: colors.pageBackground,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
})
