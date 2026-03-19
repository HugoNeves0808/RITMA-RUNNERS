import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchAdminOverview, type AdminOverviewPayload } from '../../features/admin/overview/services/adminOverviewService'
import {
  approvePendingApproval,
  fetchPendingApprovals,
  rejectPendingApproval,
} from '../../features/admin/pendingApprovals/services/pendingApprovalService'
import type { PendingApproval } from '../../features/admin/pendingApprovals/types/pendingApproval'
import { colors } from '../../theme/colors'

type AdminRitmaOverviewScreenProps = {
  token: string
  onOpenPendingApprovals: () => void
}

function formatRequestedAt(value: string) {
  const requestedAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - requestedAt.getTime()

  if (Number.isNaN(requestedAt.getTime()) || diffMs < 0) {
    return '-'
  }

  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    const minutes = Math.floor((diffMs % hourMs) / minuteMs)

    if (hours <= 0) {
      return `${Math.max(minutes, 1)} min ago`
    }

    return `${hours}h ${minutes}min ago`
  }

  const days = Math.floor(diffMs / dayMs)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function AdminRitmaOverviewScreen({ token, onOpenPendingApprovals }: AdminRitmaOverviewScreenProps) {
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    async function loadOverview() {
      try {
        setIsLoading(true)
        const [overviewPayload, pendingPayload] = await Promise.all([
          fetchAdminOverview(token),
          fetchPendingApprovals(token),
        ])
        setOverview(overviewPayload)
        setPendingApprovals(pendingPayload)
        setError(null)
        setPendingError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load overview right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOverview()
  }, [token])

  const refreshOverview = async () => {
    try {
      setIsRefreshing(true)
      const [overviewPayload, pendingPayload] = await Promise.all([
        fetchAdminOverview(token),
        fetchPendingApprovals(token),
      ])
      setOverview(overviewPayload)
      setPendingApprovals(pendingPayload)
      setError(null)
      setPendingError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to load overview right now.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const statCards = overview ? [
    { label: 'Pending approvals', value: String(pendingApprovals.length), hint: 'Accounts waiting for review', highlighted: true },
    { label: 'Total users', value: String(overview.totalUsers), hint: 'Active accounts' },
    { label: 'Total admins', value: String(overview.totalAdmins), hint: 'Admin accounts' },
    { label: 'Active users today', value: String(overview.activeUsersToday), hint: 'Unique website users today' },
    { label: 'New registrations', value: String(overview.newRegistrationsLast7Days), hint: 'Created in the last 7 days' },
  ] : []

  const previewApprovals = useMemo(() => pendingApprovals.slice(0, 5), [pendingApprovals])

  const handleApprove = async (userId: string) => {
    try {
      setProcessingId(userId)
      setPendingError(null)
      await approvePendingApproval(userId, token)
      await refreshOverview()
    } catch (actionError) {
      setPendingError(actionError instanceof Error ? actionError.message : 'Unable to approve account.')
    } finally {
      setProcessingId(null)
    }
  }

  const confirmReject = (userId: string) => {
    Alert.alert(
      'Reject request',
      'This will delete the pending account request.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(userId)
              setPendingError(null)
              await rejectPendingApproval(userId, token)
              await refreshOverview()
            } catch (actionError) {
              setPendingError(actionError instanceof Error ? actionError.message : 'Unable to reject account.')
            } finally {
              setProcessingId(null)
            }
          },
        },
      ],
    )
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshOverview()} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Overview</Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => void refreshOverview()}
            accessibilityRole="button"
            accessibilityLabel="Refresh overview"
          >
            <FontAwesome6 name="rotate-left" size={16} color={colors.textPrimary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={styles.loadingText}>Loading overview</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load overview</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={[styles.statCard, card.highlighted ? styles.highlightCard : null]}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statHint}>{card.hint}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.pendingCard}>
        <View style={styles.pendingHeader}>
          <Text style={styles.pendingTitle}>Pending approvals</Text>
          <Pressable style={styles.viewAllButton} onPress={onOpenPendingApprovals}>
            <Text style={styles.viewAllButtonText}>View all</Text>
          </Pressable>
        </View>

        {pendingError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load pending approvals</Text>
            <Text style={styles.errorText}>{pendingError}</Text>
          </View>
        ) : null}

        {!pendingError && previewApprovals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>There are no pending approvals right now.</Text>
          </View>
        ) : null}

        {!pendingError && previewApprovals.length > 0 ? (
          <View style={styles.pendingList}>
            {previewApprovals.map((approval) => {
              const isProcessing = processingId === approval.id

              return (
                <View key={approval.id} style={styles.pendingItem}>
                  <View style={styles.pendingMeta}>
                    <Text style={styles.pendingEmail}>{approval.email}</Text>
                    <Text style={styles.pendingDate}>{formatRequestedAt(approval.requestedAt)}</Text>
                  </View>

                  <View style={styles.pendingActions}>
                    <Pressable
                      style={[styles.approveButton, isProcessing ? styles.buttonDisabled : null]}
                      onPress={() => void handleApprove(approval.id)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.approveButtonText}>{isProcessing ? 'Working...' : 'Approve'}</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.rejectButton, isProcessing ? styles.buttonDisabled : null]}
                      onPress={() => confirmReject(approval.id)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.cardBackground,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 30,
    elevation: 4,
  },
  pendingCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.cardBackground,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 30,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  errorBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 45, 32, 0.18)',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(254, 243, 242, 0.96)',
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    gap: 12,
    marginTop: 18,
  },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  highlightCard: {
    backgroundColor: '#fff7ed',
    borderColor: 'rgba(217, 119, 6, 0.18)',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    marginTop: 10,
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  statHint: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  pendingTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  viewAllButton: {
    borderRadius: 14,
    backgroundColor: colors.primaryButton,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  viewAllButtonText: {
    color: colors.primaryButtonText,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  pendingList: {
    gap: 12,
  },
  pendingItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 14,
  },
  pendingMeta: {
    gap: 6,
  },
  pendingEmail: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  pendingDate: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    minWidth: 102,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primaryButton,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  approveButtonText: {
    color: colors.primaryButtonText,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ff5a52',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rejectButtonText: {
    color: '#ff5a52',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
