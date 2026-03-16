import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

export function ProfileScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Profile</Text>
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
})
