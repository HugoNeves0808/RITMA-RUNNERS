import {
  faAngleDown,
  faAngleUp,
  faBroom,
  faCalendarDays,
  faBolt,
  faMedal,
  faPenToSquare,
  faRoad,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Checkbox, Empty, Input, InputNumber, Modal, Segmented, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import { STORAGE_KEYS } from '../../constants/storage'
import {
  AddRaceDrawer,
  createManagedRaceOption,
  deleteRace,
  deleteManagedRaceOption,
  detachManagedRaceOptionUsage,
  fetchManagedRaceOptions,
  fetchManagedRaceOptionUsage,
  fetchRaceCreateOptions,
  fetchRaceDetail,
  fetchRaceTypes,
  updateManagedRaceOption,
  type RaceCreateOptions,
  RaceDetailsDrawer,
  type RaceDetailResponse,
  type RaceOptionUsage,
  type RaceTypeOption,
} from '../../features/races'
import {
  fetchBestEfforts,
  type BestEffortCategory,
  type BestEffortItem,
  type BestEffortsViewMode,
} from '../../features/best-efforts'
import styles from './BestEffortsPage.module.css'

const { Title } = Typography
const PODIUM_ORDER_TOP_THREE = [1, 0, 2]
const PODIUM_ORDER_TOP_FIVE = [1, 0, 2, 3, 4]
const CATEGORY_DISTANCE_EXCLUDED_MARGIN_KM = 0.3

type PersistedBestEffortsFiltersState = {
  viewMode: BestEffortsViewMode
  selectedRaceType?: string
  isRaceTypesOpen: boolean
}

function readPersistedBestEffortsFilters(): PersistedBestEffortsFiltersState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEYS.bestEffortsFilters)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedBestEffortsFiltersState>
    return {
      viewMode: parsed.viewMode === 'top-5' || parsed.viewMode === 'all' ? parsed.viewMode : 'top-3',
      selectedRaceType: typeof parsed.selectedRaceType === 'string' ? parsed.selectedRaceType : undefined,
      isRaceTypesOpen: parsed.isRaceTypesOpen ?? true,
    }
  } catch {
    return null
  }
}

type CheckboxFilterSectionProps = {
  title: string
  count: number
  isOpen: boolean
  onToggle: () => void
  titleAction?: React.ReactNode
  children: React.ReactNode
}

function CheckboxFilterSection({
  title,
  count,
  isOpen,
  onToggle,
  titleAction,
  children,
}: CheckboxFilterSectionProps) {
  return (
    <div className={styles.filterField}>
      <button
        type="button"
        className={styles.checkboxSectionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.checkboxSectionTitleRow}>
          <span className={styles.filterLabel}>{title}</span>
          {count > 0 ? <span className={styles.filterCount}>{count}</span> : null}
          {titleAction ? <span className={styles.checkboxSectionTitleAction}>{titleAction}</span> : null}
        </span>
        <FontAwesomeIcon icon={isOpen ? faAngleUp : faAngleDown} className={styles.checkboxSectionIcon} />
      </button>

      {isOpen ? <div className={styles.checkboxSectionBody}>{children}</div> : null}
    </div>
  )
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}/km`
}

function formatRaceDate(value: string | null) {
  if (!value) {
    return 'No date'
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDistance(value: number | null) {
  if (value == null) {
    return '-'
  }

  return `${value.toFixed(2)} km`
}

function getMinimumAcceptedDistance(expectedDistanceKm: number | null) {
  if (expectedDistanceKm == null) {
    return null
  }

  return Math.max(expectedDistanceKm - CATEGORY_DISTANCE_EXCLUDED_MARGIN_KM, 0)
}

function getFilteredItems(
  items: BestEffortItem[],
  viewMode: BestEffortsViewMode,
) {
  const visibleItems = items.filter((item) => item.validForBestEffortRanking || item.rankingNote === 'Below category distance')

  if (viewMode === 'top-3') {
    return visibleItems.filter((item) => item.validForBestEffortRanking).slice(0, 3)
  }

  if (viewMode === 'top-5') {
    return visibleItems.filter((item) => item.validForBestEffortRanking).slice(0, 5)
  }

  return visibleItems
}

function getPodiumOrder(items: BestEffortItem[]) {
  if (items.length <= 3) {
    return PODIUM_ORDER_TOP_THREE.filter((index) => index < items.length)
  }

  return PODIUM_ORDER_TOP_FIVE.filter((index) => index < items.length)
}

function getRankingNoteBadgeClassName(item: BestEffortItem) {
  if (item.rankingNote === 'Below category distance') {
    return styles.rankingNoteBelowTarget
  }

  if (!item.validForBestEffortRanking) {
    return styles.rankingNoteExcluded
  }

  return styles.rankingNoteValid
}

function hasDisplayedRanking(item: BestEffortItem) {
  return item.validForBestEffortRanking || item.rankingNote === 'Below category distance'
}

function getCategoryScoreBadgeClassNameForItem(item: BestEffortItem) {
  if (item.rankingNote === 'Below category distance') {
    return styles.categoryScoreBelowTarget
  }

  if (!item.validForBestEffortRanking) {
    return styles.categoryScoreExcluded
  }

  return styles.categoryScoreValid
}

function getPodiumHeight(rank: number) {
  if (rank === 1) {
    return styles.podiumFirst
  }

  if (rank === 2) {
    return styles.podiumSecond
  }

  if (rank === 3) {
    return styles.podiumThird
  }

  if (rank === 4) {
    return styles.podiumFourth
  }

  return styles.podiumFifth
}

function getPodiumTone(rank: number) {
  if (rank === 1) {
    return styles.podiumGold
  }

  if (rank === 2) {
    return styles.podiumSilver
  }

  if (rank === 3) {
    return styles.podiumBronze
  }

  return styles.podiumNeutral
}

function getModalRaceTone(rank: number) {
  if (rank >= 1 && rank <= 3) {
    return styles.modalRaceGold
  }

  if (rank === 4 || rank === 5) {
    return styles.modalRaceNeutral
  }

  return ''
}

function getPodiumLabel(rank: number) {
  if (rank === 1) {
    return 'PR'
  }

  if (rank === 2) {
    return '2nd'
  }

  if (rank === 3) {
    return '3rd'
  }

  return `${rank}th`
}

function getPodiumIcon(rank: number) {
  return rank === 1 ? faBolt : faMedal
}

function shouldShowPodiumIcon(rank: number) {
  return rank <= 3
}

function EntryBadges({ item }: { item: BestEffortItem }) {
  return (
    <Space wrap>
      <span className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassNameForItem(item)}`.trim()}>
        {item.rankingNote}
      </span>
    </Space>
  )
}

function PodiumCard({ item }: { item: BestEffortItem }) {
  return (
    <article
      className={[
        styles.podiumCard,
        getPodiumHeight(item.overallRank),
        getPodiumTone(item.overallRank),
        item.validForBestEffortRanking ? '' : styles.podiumInvalid,
      ].join(' ')}
    >
      {shouldShowPodiumIcon(item.overallRank) ? (
        <div className={styles.podiumIconWrap}>
          <FontAwesomeIcon icon={getPodiumIcon(item.overallRank)} className={styles.podiumIcon} />
        </div>
      ) : null}
      <div className={styles.podiumRankBadge}>{getPodiumLabel(item.overallRank)}</div>
      <div className={styles.podiumContent}>
        <span className={styles.podiumRaceName}>{item.raceName}</span>
        <span className={styles.podiumMeta}>
          <span className={styles.inlineMetaItem}>
            <FontAwesomeIcon icon={faCalendarDays} className={styles.inlineMetaIcon} />
            {formatRaceDate(item.raceDate)}
          </span>
          <span className={styles.inlineMetaItem}>
            <FontAwesomeIcon icon={faRoad} className={styles.inlineMetaIcon} />
            {formatDistance(item.realKm)}
          </span>
        </span>
        <span className={styles.podiumTime}>{formatDuration(item.chipTimeSeconds)}</span>
        <span className={styles.podiumPace}>{formatPace(item.pacePerKmSeconds)}</span>
      </div>
    </article>
  )
}

function PodiumShowcase({ items }: { items: BestEffortItem[] }) {
  const orderedIndexes = getPodiumOrder(items)

  return (
    <div className={styles.podiumBoard}>
      {orderedIndexes.map((index) => (
        <PodiumCard key={items[index].raceId} item={items[index]} />
      ))}
    </div>
  )
}

function EntryTableRow({ item }: { item: BestEffortItem }) {
  return (
    <tr className={styles.entryTableRow}>
      <td className={styles.entryTableRank}>#{item.overallRank}</td>
      <td className={styles.entryTableName}>{item.raceName}</td>
      <td className={styles.entryTableCell}>{formatRaceDate(item.raceDate)}</td>
      <td className={styles.entryTableCell}>{formatDistance(item.realKm)}</td>
      <td className={styles.entryTableMetric}>{formatDuration(item.chipTimeSeconds)}</td>
      <td className={styles.entryTableMetric}>{formatPace(item.pacePerKmSeconds)}</td>
      <td className={styles.entryTableMetric}>{formatDuration(item.officialTimeSeconds)}</td>
      <td className={styles.entryTableStatus}>
        <span className={`${styles.rankingNoteBadge} ${getRankingNoteBadgeClassName(item)}`.trim()}>
          {item.rankingNote}
        </span>
      </td>
    </tr>
  )
}

type CategoryRacesModalState = {
  categoryName: string
  categoryKey: string
  mode: CategoryRacesMode
  title: string
  items: BestEffortItem[]
}

type ManagedOptionConfirmState =
  | { kind: 'delete'; option: RaceTypeOption }
  | { kind: 'detach-delete'; option: RaceTypeOption }
  | null

type CategoryRacesMode = 'valid' | 'total' | 'below-category-distance' | 'excluded'

function getBelowCategoryDistanceItems(category: BestEffortCategory) {
  return category.efforts.filter((item) => item.rankingNote === 'Below category distance')
}

function getExcludedItems(category: BestEffortCategory) {
  return category.efforts.filter((item) => !item.validForBestEffortRanking && item.rankingNote !== 'Below category distance')
}

function getCategoryScoreBadgeClassName(mode: CategoryRacesMode) {
  switch (mode) {
    case 'valid':
      return styles.categoryScoreValid
    case 'below-category-distance':
      return styles.categoryScoreBelowTarget
    case 'excluded':
      return styles.categoryScoreExcluded
    default:
      return styles.categoryScoreTotal
  }
}

export function BestEffortsPage() {
  const { token } = useAuth()
  const persistedFilters = useMemo(() => readPersistedBestEffortsFilters(), [])
  const isPageRefreshRef = useRef(false)
  const [payload, setPayload] = useState<BestEffortCategory[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceTypeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BestEffortsViewMode>(persistedFilters?.viewMode ?? 'top-3')
  const [selectedRaceType, setSelectedRaceType] = useState<string | undefined>(persistedFilters?.selectedRaceType)
  const [isRaceTypesOpen, setIsRaceTypesOpen] = useState(persistedFilters?.isRaceTypesOpen ?? true)
  const [categoryRacesModal, setCategoryRacesModal] = useState<CategoryRacesModalState | null>(null)
  const [expandedCategoryKeys, setExpandedCategoryKeys] = useState<string[]>([])
  const [isManageRaceTypesModalOpen, setIsManageRaceTypesModalOpen] = useState(false)
  const [managedRaceTypeName, setManagedRaceTypeName] = useState('')
  const [managedRaceTypeTargetKm, setManagedRaceTypeTargetKm] = useState<number | null>(null)
  const [editingRaceTypeId, setEditingRaceTypeId] = useState<string | null>(null)
  const [managedRaceTypeError, setManagedRaceTypeError] = useState<string | null>(null)
  const [isManagedRaceTypeLoading, setIsManagedRaceTypeLoading] = useState(false)
  const [isManagedRaceTypeSubmitting, setIsManagedRaceTypeSubmitting] = useState(false)
  const [managedRaceTypeUsage, setManagedRaceTypeUsage] = useState<RaceOptionUsage | null>(null)
  const [managedRaceTypeConfirmState, setManagedRaceTypeConfirmState] = useState<ManagedOptionConfirmState>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [raceDetails, setRaceDetails] = useState<RaceDetailResponse | null>(null)
  const [selectedDetailsRace, setSelectedDetailsRace] = useState<BestEffortItem | null>(null)
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({
    raceTypes: [],
    teams: [],
    circuits: [],
    shoes: [],
  })
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceDetailResponse | null>(null)
  const [racePendingDelete, setRacePendingDelete] = useState<BestEffortItem | null>(null)
  const [isDeletingRace, setIsDeletingRace] = useState(false)

  useEffect(() => {
    const loadBestEfforts = async () => {
      if (!token) {
        setPayload([])
        setRaceTypes([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)
        const [response, raceTypeOptions, nextCreateOptions] = await Promise.all([
          fetchBestEfforts(token),
          fetchRaceTypes(token),
          fetchRaceCreateOptions(token),
        ])
        setPayload(response.categories)
        setRaceTypes(raceTypeOptions)
        setCreateOptions(nextCreateOptions)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load best efforts right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadBestEfforts()
  }, [token])

  const visibleCategories = useMemo(() => payload
    .map((category) => {
      const items = getFilteredItems(category.efforts, viewMode)
      return {
        ...category,
        visibleItems: items,
      }
    })
    .filter((category) => !selectedRaceType || category.categoryName === selectedRaceType)
    .filter((category) => category.totalEffortCount > 0), [payload, selectedRaceType, viewMode])

  const featuredLimit = viewMode === 'top-3' ? 3 : 5
  const raceTypeOptions = raceTypes.map((raceType) => ({
    label: raceType.name,
    value: raceType.name,
  }))

  useEffect(() => {
    if (!selectedRaceType) {
      setIsRaceTypesOpen(false)
    }
  }, [selectedRaceType])

  useEffect(() => {
    if (selectedRaceType) {
      setIsRaceTypesOpen(true)
    }
  }, [selectedRaceType])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(STORAGE_KEYS.bestEffortsFilters, JSON.stringify({
      viewMode,
      selectedRaceType,
      isRaceTypesOpen,
    } satisfies PersistedBestEffortsFiltersState))
  }, [isRaceTypesOpen, selectedRaceType, viewMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      isPageRefreshRef.current = true
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      if (!isPageRefreshRef.current) {
        window.sessionStorage.removeItem(STORAGE_KEYS.bestEffortsFilters)
      }
    }
  }, [])

  const handleClearFilters = () => {
    setViewMode('top-3')
    setSelectedRaceType(undefined)
    setExpandedCategoryKeys([])
  }

  const expandCategoryTable = (categoryKey: string) => {
    setExpandedCategoryKeys((current) => (current.includes(categoryKey) ? current : [...current, categoryKey]))
  }

  const collapseCategoryTable = (categoryKey: string) => {
    setExpandedCategoryKeys((current) => current.filter((key) => key !== categoryKey))
  }

  const openManageRaceTypesModal = async (optionToEdit?: RaceTypeOption) => {
    setManagedRaceTypeName(optionToEdit?.name ?? '')
    setManagedRaceTypeTargetKm(optionToEdit?.targetKm ?? null)
    setEditingRaceTypeId(optionToEdit?.id ?? null)
    setManagedRaceTypeError(null)
    setManagedRaceTypeUsage(null)
    setManagedRaceTypeConfirmState(null)
    setIsManageRaceTypesModalOpen(true)

    if (!token) {
      return
    }

    try {
      setIsManagedRaceTypeLoading(true)
      const latestRaceTypes = await fetchManagedRaceOptions('race-types', token)
      setRaceTypes(latestRaceTypes)
    } catch (loadError) {
      setManagedRaceTypeError(loadError instanceof Error ? loadError.message : 'Could not load race types right now.')
    } finally {
      setIsManagedRaceTypeLoading(false)
    }
  }

  const closeManageRaceTypesModal = () => {
    setIsManageRaceTypesModalOpen(false)
    setManagedRaceTypeName('')
    setManagedRaceTypeTargetKm(null)
    setEditingRaceTypeId(null)
    setManagedRaceTypeError(null)
    setManagedRaceTypeUsage(null)
    setManagedRaceTypeConfirmState(null)
    setIsManagedRaceTypeSubmitting(false)
  }

  const handleSaveRaceType = async () => {
    if (!token) {
      return
    }

    try {
      setIsManagedRaceTypeSubmitting(true)
      setManagedRaceTypeError(null)

      const savedRaceType = editingRaceTypeId
        ? await updateManagedRaceOption('race-types', editingRaceTypeId, { name: managedRaceTypeName, targetKm: managedRaceTypeTargetKm }, token)
        : await createManagedRaceOption('race-types', { name: managedRaceTypeName, targetKm: managedRaceTypeTargetKm }, token)

      const latestRaceTypes = editingRaceTypeId
        ? raceTypes.map((option) => (option.id === savedRaceType.id ? savedRaceType : option)).sort((left, right) => left.name.localeCompare(right.name))
        : [...raceTypes, savedRaceType].sort((left, right) => left.name.localeCompare(right.name))

      setRaceTypes(latestRaceTypes)
      setManagedRaceTypeName('')
      setManagedRaceTypeTargetKm(null)
      setEditingRaceTypeId(null)
    } catch (saveError) {
      setManagedRaceTypeError(saveError instanceof Error ? saveError.message : 'Could not save this race type right now.')
    } finally {
      setIsManagedRaceTypeSubmitting(false)
    }
  }

  const handleDeleteRaceType = async (option: RaceTypeOption) => {
    if (!token) {
      return
    }

    try {
      setManagedRaceTypeError(null)
      setManagedRaceTypeUsage(null)
      const usage = await fetchManagedRaceOptionUsage('race-types', option.id, token)

      if (usage.usageCount > 0) {
        setManagedRaceTypeUsage(usage)
        setManagedRaceTypeConfirmState({ kind: 'detach-delete', option })
        return
      }

      setManagedRaceTypeConfirmState({ kind: 'delete', option })
    } catch (deleteError) {
      setManagedRaceTypeError(deleteError instanceof Error ? deleteError.message : 'Could not delete this race type right now.')
    }
  }

  const handleConfirmRaceTypeAction = async () => {
    if (!token || !managedRaceTypeConfirmState) {
      return
    }

    try {
      setIsManagedRaceTypeSubmitting(true)
      setManagedRaceTypeError(null)

      if (managedRaceTypeConfirmState.kind === 'detach-delete') {
        await detachManagedRaceOptionUsage('race-types', managedRaceTypeConfirmState.option.id, token)
      }

      await deleteManagedRaceOption('race-types', managedRaceTypeConfirmState.option.id, token)

      const nextRaceTypes = raceTypes.filter((option) => option.id !== managedRaceTypeConfirmState.option.id)
      setRaceTypes(nextRaceTypes)

      if (selectedRaceType === managedRaceTypeConfirmState.option.name) {
        setSelectedRaceType(undefined)
      }

      if (editingRaceTypeId === managedRaceTypeConfirmState.option.id) {
        setManagedRaceTypeName('')
        setManagedRaceTypeTargetKm(null)
        setEditingRaceTypeId(null)
      }

      const refreshedPayload = await fetchBestEfforts(token)
      setPayload(refreshedPayload.categories)
      setManagedRaceTypeUsage(null)
      setManagedRaceTypeConfirmState(null)
    } catch (confirmError) {
      setManagedRaceTypeError(confirmError instanceof Error ? confirmError.message : 'Could not complete this action right now.')
    } finally {
      setIsManagedRaceTypeSubmitting(false)
    }
  }

  const openCategoryRacesModal = (category: BestEffortCategory, mode: CategoryRacesMode) => {
    const items = (() => {
      if (mode === 'valid') {
        return category.efforts.filter((item) => item.validForBestEffortRanking)
      }

      if (mode === 'below-category-distance') {
        return getBelowCategoryDistanceItems(category)
      }

      if (mode === 'excluded') {
        return getExcludedItems(category)
      }

      return category.efforts
    })()

    const title = (() => {
      if (mode === 'valid') {
        return 'Valid races'
      }

      if (mode === 'below-category-distance') {
        return 'Below target'
      }

      if (mode === 'excluded') {
        return 'Excluded races'
      }

      return 'All races'
    })()

    setCategoryRacesModal({
      categoryName: category.categoryName,
      categoryKey: category.categoryKey,
      mode,
      title,
      items,
    })
  }

  const syncCategoryRacesModal = (
    categories: BestEffortCategory[],
    currentModal: CategoryRacesModalState | null,
  ) => {
    if (!currentModal) {
      return
    }

    const category = categories.find((entry) => entry.categoryKey === currentModal.categoryKey)
    if (!category) {
      setCategoryRacesModal(null)
      return
    }

    const items = currentModal.mode === 'valid'
      ? category.efforts.filter((item) => item.validForBestEffortRanking)
      : currentModal.mode === 'below-category-distance'
        ? getBelowCategoryDistanceItems(category)
        : currentModal.mode === 'excluded'
          ? getExcludedItems(category)
          : category.efforts

    setCategoryRacesModal({
      ...currentModal,
      categoryName: category.categoryName,
      items,
    })
  }

  const handleOpenRaceDetails = async (item: BestEffortItem) => {
    if (!token) {
      return
    }

    try {
      setIsDetailsOpen(true)
      setIsDetailsLoading(true)
      setDetailsError(null)
      setSelectedDetailsRace(item)
      const details = await fetchRaceDetail(item.raceId, token)
      setRaceDetails(details)
    } catch (loadError) {
      setRaceDetails(null)
      setDetailsError(loadError instanceof Error ? loadError.message : 'Could not load this race right now.')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const reloadBestEffortsPageData = async () => {
    if (!token) {
      return
    }

    const [response, raceTypeOptions, nextCreateOptions] = await Promise.all([
      fetchBestEfforts(token),
      fetchRaceTypes(token),
      fetchRaceCreateOptions(token),
    ])

    setPayload(response.categories)
    setRaceTypes(raceTypeOptions)
    setCreateOptions(nextCreateOptions)
    syncCategoryRacesModal(response.categories, categoryRacesModal)
  }

  const handleOpenEditFromDetails = async () => {
    if (!selectedDetailsRace || !token) {
      return
    }

    try {
      const details = raceDetails?.id === selectedDetailsRace.raceId
        ? raceDetails
        : await fetchRaceDetail(selectedDetailsRace.raceId, token)

      setEditingRace(details)
      setIsDetailsOpen(false)
      setIsEditDrawerOpen(true)
    } catch (loadError) {
      setDetailsError(loadError instanceof Error ? loadError.message : 'Could not load this race for editing right now.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!token || !racePendingDelete) {
      return
    }

    try {
      setIsDeletingRace(true)
      await deleteRace(racePendingDelete.raceId, token)
      setRacePendingDelete(null)
      setIsDetailsOpen(false)
      setRaceDetails(null)
      setSelectedDetailsRace(null)
      setDetailsError(null)
      await reloadBestEffortsPageData()
    } catch (deleteError) {
      setDetailsError(deleteError instanceof Error ? deleteError.message : 'Could not delete this race right now.')
    } finally {
      setIsDeletingRace(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <Title level={1} className={styles.pageTitle}>Best Efforts</Title>
        </div>
        <Segmented<BestEffortsViewMode>
          value={viewMode}
          onChange={(value) => setViewMode(value)}
          options={[
            { label: 'Top 3', value: 'top-3' },
            { label: 'Top 5', value: 'top-5' },
            { label: 'All races', value: 'all' },
          ]}
          className={styles.viewSwitcher}
          aria-label="Best efforts view selector"
        />
      </header>

      {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

      {isLoading ? (
        <Card className={styles.emptyCard}>
          <Spin />
        </Card>
      ) : null}

      <div className={styles.contentLayout}>
        <section className={styles.mainSection}>
          {!isLoading && !errorMessage && visibleCategories.length === 0 ? (
            <Card className={styles.emptyCard} variant="borderless">
              <div className={styles.emptyWrap}>
                <Empty description="No best efforts found for the current filters." />
              </div>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && visibleCategories.length > 0 ? (
            <div className={styles.categoryList}>
              {visibleCategories.map((category) => (
                <Card key={category.categoryKey} className={styles.categoryCard} styles={{ body: { padding: 24 } }}>
                  {(() => {
                    const belowCategoryDistanceCount = getBelowCategoryDistanceItems(category).length
                    const excludedCount = getExcludedItems(category).length
                    const minimumAcceptedDistance = getMinimumAcceptedDistance(category.expectedDistanceKm)
                    const minimumAcceptedDistanceLabel = minimumAcceptedDistance != null
                      ? formatDistance(minimumAcceptedDistance)
                      : 'the category minimum distance'

                    return (
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryTitleBlock}>
                      <div className={styles.categoryTitleRow}>
                        <Title level={3} className={styles.categoryTitle}>{category.categoryName}</Title>
                        {category.expectedDistanceKm != null ? (
                          <span className={`${styles.categoryScoreBadge} ${styles.categoryScoreTarget}`.trim()}>
                            {formatDistance(category.expectedDistanceKm)}
                          </span>
                        ) : (
                          <Tag>No target km defined</Tag>
                        )}
                      </div>
                    </div>

                    <div className={styles.categoryMetaAside}>
                      <div className={styles.metaRow}>
                        <Tooltip title="Valid races are eligible for best effort ranking. They need to be marked as valid for category ranking, have chip time, and meet the target distance threshold.">
                          <span
                            className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassName('valid')} ${styles.clickableTag}`.trim()}
                            onClick={() => openCategoryRacesModal(category, 'valid')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openCategoryRacesModal(category, 'valid')
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {category.validEffortCount} valid
                          </span>
                        </Tooltip>
                        {belowCategoryDistanceCount > 0 ? (
                          <Tooltip title={`Below target races are within 300 meters of the target and stay visible in this category, but they still fall short of the target distance (${formatDistance(category.expectedDistanceKm)}).`}>
                            <span
                              className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassName('below-category-distance')} ${styles.clickableTag}`.trim()}
                              onClick={() => openCategoryRacesModal(category, 'below-category-distance')}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  openCategoryRacesModal(category, 'below-category-distance')
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              {belowCategoryDistanceCount} below target
                            </span>
                          </Tooltip>
                        ) : null}
                        {excludedCount > 0 ? (
                          <Tooltip title={`Excluded races are outside the ranking because they are either marked as not valid for category ranking, more than 300 meters below the target (${minimumAcceptedDistanceLabel}), or the race type still has no target km defined.`}>
                            <span
                              className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassName('excluded')} ${styles.clickableTag}`.trim()}
                              onClick={() => openCategoryRacesModal(category, 'excluded')}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  openCategoryRacesModal(category, 'excluded')
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              {excludedCount} excluded
                            </span>
                          </Tooltip>
                        ) : null}
                        <span className={styles.categoryScoreDivider} aria-hidden="true">|</span>
                        <span
                          className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassName('total')} ${styles.clickableTag}`.trim()}
                          onClick={() => openCategoryRacesModal(category, 'total')}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openCategoryRacesModal(category, 'total')
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {category.totalEffortCount} total
                        </span>
                      </div>
                    </div>

                  </div>
                    )
                  })()}

                  <div className={styles.entriesList}>
                    {category.visibleItems.length > 0 ? (
                      <PodiumShowcase items={category.visibleItems.slice(0, featuredLimit)} />
                    ) : (
                      <div className={styles.categoryEmptyState}>
                        {category.expectedDistanceKm == null
                          ? 'Define a target km for this race type to unlock the ranking.'
                          : 'No races are currently eligible for this ranking.'}
                      </div>
                    )}

                    {viewMode === 'all' && category.visibleItems.length > featuredLimit ? (
                      <div className={styles.rankListSection}>
                        {(() => {
                          const remainingItems = category.visibleItems.slice(featuredLimit)
                          const isExpanded = expandedCategoryKeys.includes(category.categoryKey)
                          const visibleTableItems = isExpanded ? remainingItems : remainingItems.slice(0, 5)

                          return (
                            <>
                              <div className={styles.entryTableWrap}>
                                <table className={styles.entryTable}>
                                  <thead>
                                    <tr className={styles.entryTableHeader}>
                                      <th className={styles.entryTableHeading}>Rank</th>
                                      <th className={styles.entryTableHeading}>Race</th>
                                      <th className={styles.entryTableHeading}>Date</th>
                                      <th className={styles.entryTableHeading}>Distance</th>
                                      <th className={styles.entryTableHeading}>Chip</th>
                                      <th className={styles.entryTableHeading}>Pace</th>
                                      <th className={styles.entryTableHeading}>Official</th>
                                      <th className={styles.entryTableHeading}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className={styles.rankList}>
                                    {visibleTableItems.map((item) => (
                                      <EntryTableRow key={item.raceId} item={item} />
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {remainingItems.length > 5 ? (
                                <button
                                  type="button"
                                  className={styles.showMoreButton}
                                  onClick={() => {
                                    if (isExpanded) {
                                      collapseCategoryTable(category.categoryKey)
                                      return
                                    }

                                    expandCategoryTable(category.categoryKey)
                                  }}
                                >
                                  {isExpanded ? 'Show less' : `See all ${remainingItems.length} races`}
                                </button>
                              ) : null}
                            </>
                          )
                        })()}
                      </div>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Filters</span>
              <Button
                type="text"
                className={styles.clearButton}
                icon={<FontAwesomeIcon icon={faBroom} />}
                title="Clear filters"
                aria-label="Clear filters"
                onClick={handleClearFilters}
              />
            </div>

            <div className={styles.sidebarDivider} />

            <CheckboxFilterSection
              title="Race types"
              count={selectedRaceType ? 1 : 0}
              isOpen={isRaceTypesOpen}
              onToggle={() => setIsRaceTypesOpen((current) => !current)}
              titleAction={(
                <span onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.manageFilterButton}
                    onClick={() => void openManageRaceTypesModal()}
                    aria-label="Create or manage race types"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                </span>
              )}
            >
              <div className={styles.checkboxList}>
                {raceTypeOptions.length === 0 ? (
                  <span className={styles.checkboxListHint}>No race types available</span>
                ) : raceTypeOptions.map((raceType) => (
                  <label key={raceType.value} className={styles.checkboxOption}>
                    <Checkbox
                      checked={selectedRaceType === raceType.value}
                      onChange={() => setSelectedRaceType(
                        selectedRaceType === raceType.value ? undefined : raceType.value,
                      )}
                    />
                    <span className={styles.checkboxOptionLabel}>{raceType.label}</span>
                  </label>
                ))}
              </div>
            </CheckboxFilterSection>

          </div>
        </aside>
      </div>

      <Modal
        open={categoryRacesModal != null}
        title={categoryRacesModal ? `${categoryRacesModal.categoryName} · ${categoryRacesModal.title}` : ''}
        footer={null}
        onCancel={() => setCategoryRacesModal(null)}
        width={860}
      >
        <div className={styles.modalList}>
          {categoryRacesModal?.items.map((item) => (
            <Card
              key={item.raceId}
              className={`${styles.modalRaceCard} ${styles.clickableModalRaceCard} ${getModalRaceTone(item.overallRank)}`.trim()}
              styles={{ body: { padding: 16 } }}
              onClick={() => void handleOpenRaceDetails(item)}
            >
              <div className={styles.modalRaceHeader}>
                <div className={styles.modalRaceMain}>
                  {hasDisplayedRanking(item) ? <span className={styles.modalRankBadge}>#{item.overallRank}</span> : null}
                  <div className={styles.modalRaceTitleBlock}>
                    <Title level={5} className={styles.modalRaceTitle}>{item.raceName}</Title>
                    <div className={styles.entrySubtitle}>
                      <span>{formatRaceDate(item.raceDate)}</span>
                      <span>{formatDistance(item.realKm)}</span>
                      <span>{item.raceTypeName}</span>
                    </div>
                  </div>
                </div>

                <EntryBadges item={item} />
              </div>
            </Card>
          ))}

          {categoryRacesModal && categoryRacesModal.items.length === 0 ? (
            <Empty description="No races found for this category." />
          ) : null}
        </div>
      </Modal>

      <RaceDetailsDrawer
        open={isDetailsOpen}
        race={raceDetails}
        isLoading={isDetailsLoading}
        error={detailsError}
        isDeleting={isDeletingRace}
        onEdit={() => {
          void handleOpenEditFromDetails()
        }}
        onDelete={() => {
          if (!selectedDetailsRace) {
            return
          }

          setRacePendingDelete(selectedDetailsRace)
        }}
        onClose={() => {
          setIsDetailsOpen(false)
          setIsDetailsLoading(false)
          setDetailsError(null)
          setRaceDetails(null)
          setSelectedDetailsRace(null)
        }}
      />

      <AddRaceDrawer
        mode="edit"
        open={isEditDrawerOpen}
        raceId={editingRace?.id ?? null}
        initialRace={editingRace}
        createOptions={createOptions}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          if (selectedDetailsRace) {
            setIsDetailsOpen(true)
          }
        }}
        onCreated={async () => {
          setIsEditDrawerOpen(false)
          setEditingRace(null)
          await reloadBestEffortsPageData()
          if (!selectedDetailsRace || !token) {
            return
          }

          try {
            setIsDetailsOpen(true)
            setIsDetailsLoading(true)
            const details = await fetchRaceDetail(selectedDetailsRace.raceId, token)
            setRaceDetails(details)
            setDetailsError(null)
          } catch (loadError) {
            setRaceDetails(null)
            setDetailsError(loadError instanceof Error ? loadError.message : 'Could not reload this race right now.')
          } finally {
            setIsDetailsLoading(false)
          }
        }}
      />

      <Modal
        title="Delete race?"
        open={racePendingDelete != null}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        confirmLoading={isDeletingRace}
        onOk={() => void handleConfirmDelete()}
        onCancel={() => {
          if (isDeletingRace) {
            return
          }

          setRacePendingDelete(null)
        }}
      >
        <p>
          {racePendingDelete
            ? `This will permanently delete "${racePendingDelete.raceName}".`
            : 'This will permanently delete this race.'}
        </p>
      </Modal>

      <Modal
        className={styles.manageOptionsDialog}
        open={isManageRaceTypesModalOpen}
        title="Manage race types"
        footer={null}
        onCancel={closeManageRaceTypesModal}
      >
        {managedRaceTypeError ? <Alert type="error" message={managedRaceTypeError} showIcon style={{ marginBottom: 16 }} /> : null}

        <div className={styles.manageOptionsModal}>
          <div className={styles.manageOptionsForm}>
            <div className={styles.manageInputRow}>
              <Input
                placeholder="Type the race type name here"
                value={managedRaceTypeName}
                onChange={(event) => setManagedRaceTypeName(event.target.value)}
                maxLength={100}
              />
              <InputNumber
                min={0}
                max={9999.99}
                precision={2}
                step={0.01}
                className={styles.manageRaceTypeTargetInput}
                placeholder="Target km"
                value={managedRaceTypeTargetKm ?? undefined}
                onChange={(value) => setManagedRaceTypeTargetKm(typeof value === 'number' ? value : null)}
              />
              <div className={styles.manageInputActions}>
                {editingRaceTypeId ? (
                  <button
                    type="button"
                    className={styles.cancelEditingIconButton}
                    onClick={() => {
                      setManagedRaceTypeName('')
                      setManagedRaceTypeTargetKm(null)
                      setEditingRaceTypeId(null)
                      setManagedRaceTypeError(null)
                      setManagedRaceTypeUsage(null)
                      setManagedRaceTypeConfirmState(null)
                    }}
                    aria-label="Cancel editing"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                ) : null}

                {!managedRaceTypeConfirmState ? (
                  <Button
                    type="primary"
                    className={styles.saveButton}
                    loading={isManagedRaceTypeSubmitting}
                    disabled={!managedRaceTypeName.trim() || managedRaceTypeTargetKm == null}
                    onClick={() => void handleSaveRaceType()}
                  >
                    {editingRaceTypeId ? 'Save changes' : 'Add'}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {isManagedRaceTypeLoading ? (
            <div className={styles.manageOptionsLoading}>
              <Spin />
            </div>
          ) : raceTypes.length === 0 ? (
            <div className={styles.manageOptionsEmptyState}>
              <Empty description="No race types found yet." />
            </div>
          ) : (
            <div className={styles.manageOptionsList}>
              {raceTypes.map((option) => (
                <div key={option.id} className={styles.manageOptionRow}>
                  <div className={styles.manageOptionInfo}>
                    <span className={styles.manageOptionName}>{option.name}</span>
                    <span className={styles.manageOptionMeta}>
                      {option.targetKm != null ? `${option.targetKm.toFixed(2)} km` : 'No target km set'}
                    </span>
                  </div>
                  <div className={styles.manageOptionActions}>
                    <Button
                      type="text"
                      icon={<FontAwesomeIcon icon={faPenToSquare} />}
                      onClick={() => void openManageRaceTypesModal(option)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="text"
                      danger
                      icon={<FontAwesomeIcon icon={faTrashCan} />}
                      onClick={() => void handleDeleteRaceType(option)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {managedRaceTypeConfirmState ? (
            <div className={styles.manageConfirmBox}>
              <p className={styles.manageConfirmText}>
                {managedRaceTypeConfirmState.kind === 'detach-delete'
                  ? `This race type is being used in ${managedRaceTypeUsage?.usageCount ?? 0} race(s). Delete it and detach it from those races?`
                  : `Delete "${managedRaceTypeConfirmState.option.name}"?`}
              </p>
              <Space>
                <Button onClick={() => {
                  setManagedRaceTypeConfirmState(null)
                  setManagedRaceTypeUsage(null)
                }}
                >
                  Cancel
                </Button>
                <Button danger loading={isManagedRaceTypeSubmitting} onClick={() => void handleConfirmRaceTypeAction()}>
                  {managedRaceTypeConfirmState.kind === 'detach-delete' ? 'Detach and delete' : 'Delete'}
                </Button>
              </Space>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
