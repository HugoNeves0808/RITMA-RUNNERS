import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './src/navigation/AppNavigator'
import { colors } from './src/theme/colors'

export default function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  )
}

function AppShell() {
  return (
    <View style={styles.appShell}>
      <StatusBar style="dark" backgroundColor={colors.pageBackground} translucent={false} />
      <AppNavigator />
    </View>
  )
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
})
