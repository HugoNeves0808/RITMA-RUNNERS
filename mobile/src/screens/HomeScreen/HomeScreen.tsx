import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FontAwesome6 } from '@expo/vector-icons'
import type { AuthenticatedUser } from '../../features/auth/types/auth'
import { colors } from '../../theme/colors'

type HomeScreenProps = {
  user: AuthenticatedUser
  onLogout: () => void
}

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobile session</Text>
        <Text style={styles.title}>Welcome to RITMA</Text>
        <Text style={styles.subtitle}>
          {user.forcePasswordChange
            ? 'Update your password to continue.'
            : 'Your mobile session is active.'}
        </Text>
      </View>

      <View style={styles.placeholderCard}>
        <FontAwesome6 name="mobile-screen-button" size={22} color={colors.purple} />
        <View style={styles.placeholderCopy}>
          <Text style={styles.placeholderTitle}>Mobile area ready</Text>
          <Text style={styles.placeholderText}>
            Authentication is now connected. The authenticated app flow can build on top of this screen next.
          </Text>
        </View>
      </View>

      <Pressable style={styles.logoutLink} onPress={onLogout}>
        <FontAwesome6 name="right-from-bracket" size={15} color={colors.warning} />
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
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
    paddingTop: 28,
    paddingBottom: 32,
    gap: 24,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f7f1',
    color: colors.teal,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  placeholderCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  placeholderCopy: {
    flex: 1,
    gap: 6,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  logoutLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})
