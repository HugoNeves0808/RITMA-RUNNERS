import { StyleSheet, Text, View } from 'react-native'
import type { ComponentProps } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { colors } from '../theme/colors'

type IconName = ComponentProps<typeof FontAwesome6>['name']

type FeatureRowProps = {
  icon: IconName
  iconColor: string
  title: string
  description?: string
}

export function FeatureRow({ icon, iconColor, title, description }: FeatureRowProps) {
  return (
    <View style={styles.card}>
      <FontAwesome6 name={icon} size={20} color={iconColor} style={styles.icon} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: colors.panelBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
  },
  icon: {
    marginTop: 2,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
})
