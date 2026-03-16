import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useMemo, useState } from 'react'
import { FontAwesome6 } from '@expo/vector-icons'
import { FeatureRow } from '../../components/FeatureRow'
import { colors } from '../../theme/colors'

type FutureGoalsScreenProps = {
  onBack: () => void
}

type TabKey = 'whatIsRitma' | 'futurePlans'

export function FutureGoalsScreen({ onBack }: FutureGoalsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('whatIsRitma')
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 72) {
            onBack()
          }
        },
      }),
    [onBack],
  )

  return (
    <View style={styles.page} {...panResponder.panHandlers}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <FontAwesome6 name="chevron-left" size={18} color={colors.primaryButtonText} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../../assets/images/ritma-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.tabRow}>
          <Pressable onPress={() => setActiveTab('whatIsRitma')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, activeTab === 'whatIsRitma' ? styles.tabLabelActive : null]}>
              What is RITMA?
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('futurePlans')} style={styles.tabButton}>
            <Text style={[styles.tabLabel, activeTab === 'futurePlans' ? styles.tabLabelActive : null]}>
              Future Plans
            </Text>
          </Pressable>
        </View>

        {activeTab === 'whatIsRitma' ? (
          <View style={styles.panel}>
            <Text style={styles.paragraph}>
              RITMA RUNNERS is a web application built to help runners organize races in a clear and
              structured way.
            </Text>
            <Text style={styles.paragraph}>
              It is still intentionally minimalist, but the direction is clear: a practical digital
              companion for runners who want better structure, continuity, and clarity around their
              racing journey.
            </Text>

            <View style={styles.cards}>
              <FeatureRow
                icon="flag-checkered"
                iconColor={colors.purple}
                title="Race-focused organization"
                description="Keep track of races with a clearer workflow."
              />
              <FeatureRow
                icon="chart-line"
                iconColor={colors.purple}
                title="Clear performance history"
                description="Build a consistent record of results and progress."
              />
              <FeatureRow
                icon="compass-drafting"
                iconColor={colors.purple}
                title="Structured runner journey"
                description="Create a stronger long-term view of your journey."
              />
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.paragraph}>
              RITMA will expand step by step into a more complete platform for planning, analysis,
              and long-term runner support.
            </Text>

            <View style={styles.cards}>
              <FeatureRow
                icon="bolt"
                iconColor={colors.purple}
                title="Training planning"
                description="Plan training with more structure around your race calendar."
              />
              <FeatureRow
                icon="link"
                iconColor={colors.purple}
                title="Platform sync"
                description="Connect RITMA with Strava, Garmin, and other running tools."
              />
              <FeatureRow
                icon="robot"
                iconColor={colors.purple}
                title="Smarter support"
                description="Use AI-assisted guidance and stronger decision support over time."
              />
              <FeatureRow
                icon="chart-line"
                iconColor={colors.purple}
                title="Advanced statistics"
                description="Expand race and training analysis with deeper performance insights."
              />
              <FeatureRow
                icon="flag-checkered"
                iconColor={colors.purple}
                title="Progression analysis"
                description="Understand consistency, progression, and preparation over longer cycles."
              />
              <FeatureRow
                icon="compass-drafting"
                iconColor={colors.purple}
                title="Preparation tools"
                description="Support better planning and decision-making before key races."
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 10,
    backgroundColor: colors.textPrimary,
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 18,
  },
  logoWrap: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: -24,
    marginBottom: 0,
  },
  logo: {
    width: 190,
    height: 72,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 118, 110, 0.12)',
    paddingBottom: 10,
  },
  tabButton: {
    paddingBottom: 6,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.teal,
  },
  panel: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 18,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  cards: {
    gap: 14,
  },
})
