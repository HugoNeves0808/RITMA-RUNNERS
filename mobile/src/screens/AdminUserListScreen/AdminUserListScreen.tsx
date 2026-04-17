import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
    return 'Nunca'
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
      return `há ${Math.max(minutes, 1)} min`
    }

    return `há ${hours}h ${minutes}min`
  }

  if (diffMs < monthMs) {
    const days = Math.floor(diffMs / dayMs)
    return days === 1 ? 'há 1 dia' : `há ${days} dias`
  }

  if (diffMs < yearMs) {
    const months = Math.floor(diffMs / monthMs)
    return months === 1 ? 'há 1 mês' : `há ${months} meses`
  }

  const years = Math.floor(diffMs / yearMs)
  return years === 1 ? 'há 1 ano' : `há ${years} anos`
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
  const [search, setSearch] = useState('')
  const [onlyAdmins, setOnlyAdmins] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)
  const [areFiltersVisible, setAreFiltersVisible] = useState(false)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesEmail = !normalizedSearch || user.email.toLowerCase().includes(normalizedSearch)
        const matchesRole = !onlyAdmins || user.role === 'ADMIN'
        const matchesStale = !staleOnly || isLastLoginStale(user.lastLoginAt)

        return matchesEmail && matchesRole && matchesStale
      }),
    [users, normalizedSearch, onlyAdmins, staleOnly],
  )

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleUsers = useMemo(
    () => filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredUsers, currentPage],
  )

  useEffect(() => {
    setPage((currentValue) => Math.min(currentValue, Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))))
  }, [filteredUsers.length])

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        const data = await fetchAdminUsers(token, {
          search,
          onlyAdmins,
          staleOnly,
        })
        setUsers(data)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [token, search, onlyAdmins, staleOnly])

  const refreshUsers = async () => {
    try {
      setIsRefreshing(true)
      const data = await fetchAdminUsers(token, {
        search,
        onlyAdmins,
        staleOnly,
      })
      setUsers(data)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Erro desconhecido')
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
          <Text style={styles.title}>Utilizadores</Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryLabel}>UTILIZADORES</Text>
            <Text style={styles.summaryValue}>{filteredUsers.length}</Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.filterToggle, areFiltersVisible ? styles.filterToggleActive : null]}
            onPress={() => setAreFiltersVisible((currentValue) => !currentValue)}
          >
            <FontAwesome6
              name="sliders"
              size={14}
              color={areFiltersVisible ? colors.primaryButtonText : colors.textSecondary}
            />
            <Text style={[styles.filterToggleText, areFiltersVisible ? styles.filterToggleTextActive : null]}>
              Filtros
            </Text>
          </Pressable>

          {(search.trim() || onlyAdmins || staleOnly) ? (
            <Pressable
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearch('')
                setOnlyAdmins(false)
                setStaleOnly(false)
              }}
            >
              <FontAwesome6 name="rotate-left" size={14} color={colors.textSecondary} />
              <Text style={styles.clearFiltersText}>Limpar</Text>
            </Pressable>
          ) : null}
        </View>

        {areFiltersVisible ? (
          <View style={styles.filtersPanel}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Pesquisar por email"
                placeholderTextColor="#98a2b3"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <Pressable style={styles.checkboxRow} onPress={() => setOnlyAdmins((currentValue) => !currentValue)}>
              <FontAwesome6
                name={onlyAdmins ? 'square-check' : 'square'}
                size={18}
                color={onlyAdmins ? colors.teal : '#98a2b3'}
              />
              <Text style={styles.checkboxText}>Apenas admins</Text>
            </Pressable>

            <Pressable style={styles.checkboxRow} onPress={() => setStaleOnly((currentValue) => !currentValue)}>
              <FontAwesome6
                name={staleOnly ? 'square-check' : 'square'}
                size={18}
                color={staleOnly ? colors.teal : '#98a2b3'}
              />
              <Text style={styles.checkboxText}>Inativo há mais de 1 ano</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.teal} />
            <Text style={styles.loadingText}>A carregar utilizadores</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Não foi possível carregar utilizadores</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && visibleUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sem utilizadores ativos.</Text>
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
                  <Text style={styles.metaLabel}>Perfil</Text>
                  <View style={[styles.roleTag, user.role === 'USER' ? styles.roleTagUser : null]}>
                    <Text style={[styles.roleText, user.role === 'USER' ? styles.roleTextUser : null]}>
                      {user.role}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Último login</Text>
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

        {!isLoading && filteredUsers.length > PAGE_SIZE ? (
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
    paddingTop: 20,
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
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#166534',
    shadowColor: '#15803d',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  summaryLabel: {
    color: '#f0fdf4',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  summaryValue: {
    marginTop: 2,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterToggleActive: {
    backgroundColor: colors.primaryButton,
    borderColor: colors.primaryButton,
  },
  filterToggleText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterToggleTextActive: {
    color: colors.primaryButtonText,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearFiltersText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filtersPanel: {
    gap: 14,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
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
