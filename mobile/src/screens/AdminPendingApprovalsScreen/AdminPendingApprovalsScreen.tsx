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
import {
  approvePendingApproval,
  fetchPendingApprovals,
  rejectPendingApproval,
} from '../../features/admin/pendingApprovals/services/pendingApprovalService'
import type { PendingApproval } from '../../features/admin/pendingApprovals/types/pendingApproval'
import { colors } from '../../theme/colors'

type AdminPendingApprovalsScreenProps = {
  token: string
}

const PAGE_SIZE = 10

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
  const monthMs = 30 * dayMs
  const yearMs = 365 * dayMs

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    const minutes = Math.floor((diffMs % hourMs) / minuteMs)

    if (hours <= 0) {
      return `${Math.max(minutes, 1)} min ago`
    }

    return `${hours}h ${minutes}min ago`
  }

  if (diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  if (diffMs < yearMs) {
    const months = Math.floor(diffMs / monthMs)
    return `${months} month${months === 1 ? '' : 's'} ago`
  }

  const years = Math.floor(diffMs / yearMs)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function AdminPendingApprovalsScreen({ token }: AdminPendingApprovalsScreenProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(approvals.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleApprovals = useMemo(
    () => approvals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [approvals, currentPage],
  )

  useEffect(() => {
    setPage((currentValue) => Math.min(currentValue, Math.max(1, Math.ceil(approvals.length / PAGE_SIZE))))
  }, [approvals.length])

  useEffect(() => {
    async function loadPendingApprovals() {
      try {
        setIsLoading(true)
        const data = await fetchPendingApprovals(token)
        setApprovals(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadPendingApprovals()
  }, [token])

  const refreshPendingApprovals = async () => {
    try {
      setIsRefreshing(true)
      const data = await fetchPendingApprovals(token)
      setApprovals(data)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unknown error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      setProcessingId(userId)
      setError(null)
      await approvePendingApproval(userId, token)
      setApprovals((currentValue) => currentValue.filter((approval) => approval.id !== userId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unknown error')
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
              setError(null)
              await rejectPendingApproval(userId, token)
              setApprovals((currentValue) => currentValue.filter((approval) => approval.id !== userId))
            } catch (actionError) {
              setError(actionError instanceof Error ? actionError.message : 'Unknown error')
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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshPendingApprovals()} />}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Pending Approvals</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryLabel}>PENDING</Text>
            <Text style={styles.summaryValue}>{approvals.length}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.warning} />
            <Text style={styles.loadingText}>Loading pending approvals</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not process pending approvals</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && visibleApprovals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No pending approvals.</Text>
          </View>
        ) : null}

        {!isLoading && visibleApprovals.length > 0 ? (
          <View style={styles.list}>
            {visibleApprovals.map((approval) => {
              const isProcessing = processingId === approval.id

              return (
                <View key={approval.id} style={styles.listItem}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Email</Text>
                    <Text style={styles.metaValue}>{approval.email}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Requested at</Text>
                    <Text style={styles.metaValue}>{formatRequestedAt(approval.requestedAt)}</Text>
                  </View>

                  <View style={styles.actions}>
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

        {!isLoading && approvals.length > PAGE_SIZE ? (
          <View style={styles.pagination}>
            <Pressable
              style={[styles.pageButton, currentPage === 1 ? styles.pageButtonDisabled : null]}
              onPress={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
              disabled={currentPage === 1}
            >
              <Text style={[styles.pageButtonText, currentPage === 1 ? styles.pageButtonTextDisabled : null]}>
                Previous
              </Text>
            </Pressable>

            <Text style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </Text>

            <Pressable
              style={[styles.pageButton, currentPage === totalPages ? styles.pageButtonDisabled : null]}
              onPress={() => setPage((currentValue) => Math.min(totalPages, currentValue + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.pageButtonText, currentPage === totalPages ? styles.pageButtonTextDisabled : null]}>
                Next
              </Text>
            </Pressable>
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
    paddingTop: 12,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 28,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  summaryBadge: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.warning,
    shadowColor: colors.warning,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  summaryLabel: {
    color: '#fff7ed',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  summaryValue: {
    marginTop: 2,
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  errorBox: {
    marginBottom: 14,
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
  emptyState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  listItem: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  metaRow: {
    gap: 4,
    marginBottom: 12,
  },
  metaLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
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
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  pageButton: {
    minWidth: 92,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(240, 242, 245, 0.9)',
  },
  pageButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  pageButtonTextDisabled: {
    color: '#98a2b3',
  },
  pageIndicator: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})
