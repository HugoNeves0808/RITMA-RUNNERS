import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { fetchAdminUsers } from '../../features/admin/userList/services/adminUserListService'
import type { AdminUserListItem } from '../../features/admin/userList/types/adminUserListItem'
import { colors } from '../../theme/colors'

type AdminUserListScreenProps = {
  token: string
}

const PAGE_SIZE = 10

function formatLastLogin(value: string | null) {
  if (!value) {
    return 'Never'
  }

  const lastLoginAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - lastLoginAt.getTime()

  if (Number.isNaN(lastLoginAt.getTime()) || diffMs < 0) {
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

function isLastLoginStale(value: string | null) {
  if (!value) {
    return false
  }

  const lastLoginAt = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - lastLoginAt.getTime()
  const yearMs = 365 * 24 * 60 * 60 * 1000

  if (Number.isNaN(lastLoginAt.getTime()) || diffMs < 0) {
    return false
  }

  return diffMs >= yearMs
}

export function AdminUserListScreen({ token }: AdminUserListScreenProps) {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleUsers = useMemo(
    () => users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [users, currentPage],
  )

  useEffect(() => {
    setPage((currentValue) => Math.min(currentValue, Math.max(1, Math.ceil(users.length / PAGE_SIZE))))
  }, [users.length])

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        const data = await fetchAdminUsers(token)
        setUsers(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [token])

  const refreshUsers = async () => {
    try {
      setIsRefreshing(true)
      const data = await fetchAdminUsers(token)
      setUsers(data)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unknown error')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshUsers()} />}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Users</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryLabel}>USERS</Text>
            <Text style={styles.summaryValue}>{users.length}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={styles.loadingText}>Loading users</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load users</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && visibleUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No active users.</Text>
          </View>
        ) : null}

        {!isLoading && visibleUsers.length > 0 ? (
          <View style={styles.list}>
            {visibleUsers.map((user) => (
              <View key={user.id} style={styles.listItem}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Email</Text>
                  <Text style={styles.metaValue}>{user.email}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Role</Text>
                  <View style={[styles.roleTag, user.role === 'USER' ? styles.roleTagUser : null]}>
                    <Text style={[styles.roleText, user.role === 'USER' ? styles.roleTextUser : null]}>
                      {user.role}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Last login</Text>
                  <View style={styles.lastLoginRow}>
                    <Text style={styles.metaValue}>{formatLastLogin(user.lastLoginAt)}</Text>
                    {isLastLoginStale(user.lastLoginAt) ? (
                      <FontAwesome6 name="triangle-exclamation" size={14} color="#d97706" />
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {!isLoading && users.length > PAGE_SIZE ? (
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
    backgroundColor: '#166534',
    shadowColor: '#15803d',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  summaryLabel: {
    color: '#f0fdf4',
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
    gap: 6,
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
  roleTag: {
    alignSelf: 'flex-start',
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
  },
  roleTagUser: {
    backgroundColor: 'rgba(152, 162, 179, 0.16)',
  },
  roleText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  roleTextUser: {
    color: '#475467',
  },
  lastLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: colors.primaryButton,
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(240, 242, 245, 0.9)',
  },
  pageButtonText: {
    color: colors.primaryButtonText,
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
