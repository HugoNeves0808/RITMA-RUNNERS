import {
  faAngleDown,
  faAngleUp,
  faBroom,
  faCalendarDays,
  faBolt,
  faMedal,
  faPenToSquare,
  faRoad,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, Checkbox, Empty, Modal, Segmented, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import { STORAGE_KEYS } from '../../constants/storage'
import {
  AddRaceDrawer,
  deleteRace,
  fetchRaceCreateOptions,
  fetchRaceDetail,
  fetchRaceTypes,
  type RaceCreateOptions,
  RaceDetailsDrawer,
  type RaceDetailResponse,
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
const CATEGORY_DISTANCE_EXCLUDED_MARGIN_KM = 0.1

function getLocaleFromLanguage(language: string | undefined) {
  return language === 'pt' ? 'pt-PT' : 'en-GB'
}

type PersistedBestEffortsFiltersState = {
  viewMode: BestEffortsViewMode
  selectedRaceTypes: string[]
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
    const selectedRaceTypes = Array.isArray(parsed.selectedRaceTypes)
      ? parsed.selectedRaceTypes.filter((raceType): raceType is string => typeof raceType === 'string')
      : typeof (parsed as { selectedRaceType?: unknown }).selectedRaceType === 'string'
        ? [(parsed as { selectedRaceType?: string }).selectedRaceType as string]
        : []
    return {
      viewMode: parsed.viewMode === 'top-5' || parsed.viewMode === 'all' ? parsed.viewMode : 'top-3',
      selectedRaceTypes,
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

function formatRaceDate(value: string | null, locale: string, noDateLabel: string) {
  if (!value) {
    return noDateLabel
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDistance(value: number | null, locale: string) {
  if (value == null) {
    return '-'
  }

  const formattedValue = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  return `${formattedValue} km`
}

function normalizeDecimalInput(value: string | number | undefined) {
  if (value == null) {
    return ''
  }

  return String(value).replace(',', '.')
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
  const visibleItems = items.filter((item) => item.validForBestEffortRanking)

  if (viewMode === 'top-3') {
    return visibleItems.slice(0, 3)
  }

  if (viewMode === 'top-5') {
    return visibleItems.slice(0, 5)
  }

  return visibleItems
}

function assignVisibleRanks(items: BestEffortItem[]) {
  return items.map((item, index) => ({
    ...item,
    overallRank: index + 1,
  }))
}

function getPodiumOrder(items: BestEffortItem[]) {
  if (items.length <= 3) {
    return PODIUM_ORDER_TOP_THREE.filter((index) => index < items.length)
  }

  return PODIUM_ORDER_TOP_FIVE.filter((index) => index < items.length)
}

function getRankingNoteBadgeClassName(item: BestEffortItem) {
  if (!item.validForBestEffortRanking) {
    return styles.rankingNoteExcluded
  }

  return styles.rankingNoteValid
}

function hasDisplayedRanking(item: BestEffortItem) {
  return item.validForBestEffortRanking
}

function getCategoryScoreBadgeClassNameForItem(item: BestEffortItem) {
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

function formatPodiumLabel(rank: number, language: string | undefined, prLabel: string) {
  if (rank === 1) {
    return prLabel
  }

  if (language === 'pt') {
    return `${rank}º`
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

function getRankingNoteLabel(
  rankingNote: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  switch (rankingNote) {
    case 'Valid for ranking':
      return t('bestEfforts.rankingNote.valid')
    case 'Excluded from category ranking':
      return t('bestEfforts.rankingNote.excluded')
    case 'Missing category target':
      return t('bestEfforts.rankingNote.missingTarget')
    case 'Missing real distance':
      return t('bestEfforts.rankingNote.missingDistance')
    default:
      return rankingNote
  }
}

function EntryBadges({ item }: { item: BestEffortItem }) {
  const { t } = useTranslation()
  return (
    <Space wrap>
      <span className={`${styles.categoryScoreBadge} ${getCategoryScoreBadgeClassNameForItem(item)}`.trim()}>
        {getRankingNoteLabel(item.rankingNote, t)}
      </span>
    </Space>
  )
}

function PodiumCard({ item }: { item: BestEffortItem }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = getLocaleFromLanguage(language)
  const prLabel = t('bestEfforts.podium.pr')
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
      <div className={styles.podiumRankBadge}>{formatPodiumLabel(item.overallRank, language, prLabel)}</div>
      <div className={styles.podiumContent}>
        <span className={styles.podiumRaceName}>{item.raceName}</span>
        <span className={styles.podiumMeta}>
          <span className={styles.inlineMetaItem}>
            <FontAwesomeIcon icon={faCalendarDays} className={styles.inlineMetaIcon} />
            {formatRaceDate(item.raceDate, locale, t('bestEfforts.format.noDate'))}
          </span>
          <span className={styles.inlineMetaItem}>
            <FontAwesomeIcon icon={faRoad} className={styles.inlineMetaIcon} />
            {formatDistance(item.realKm, locale)}
          </span>
        </span>
        <span className={styles.podiumTime}>{formatDuration(item.chipTimeSeconds)}</span>
        <span className={styles.podiumPace}>{formatPace(item.pacePerKmSeconds)}</span>
      </div>
    </article>
  )
}

function getEmptyPodiumMessage(
  expectedDistanceKm: number | null,
  missingCount: number,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (expectedDistanceKm == null) {
    return t('bestEfforts.podium.defineTargetKm')
  }

  if (missingCount === 1) {
    return t('bestEfforts.podium.needOneMore')
  }

  return t('bestEfforts.podium.needMore', { count: missingCount })
}

function PodiumEmptyCard({
  rank,
  expectedDistanceKm,
  missingCount,
}: {
  rank: number
  expectedDistanceKm: number | null
  missingCount: number
}) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const prLabel = t('bestEfforts.podium.pr')
  return (
    <article
      className={[
        styles.podiumCard,
        styles.podiumEmptyCard,
        getPodiumHeight(rank),
      ].join(' ')}
    >
      <div className={styles.podiumRankBadge}>{formatPodiumLabel(rank, language, prLabel)}</div>
      <div className={styles.podiumEmptyContent}>
        <span className={styles.podiumEmptyTitle}>{t('bestEfforts.podium.emptySlot')}</span>
        <span className={styles.podiumEmptyMessage}>
          {getEmptyPodiumMessage(expectedDistanceKm, missingCount, t)}
        </span>
      </div>
    </article>
  )
}

function PodiumShowcase({
  items,
  featuredLimit,
  expectedDistanceKm,
}: {
  items: BestEffortItem[]
  featuredLimit: number
  expectedDistanceKm: number | null
}) {
  const orderedIndexes = getPodiumOrder(Array.from({ length: featuredLimit }))
  const filledItems = items.slice(0, featuredLimit)
  const missingCount = Math.max(featuredLimit - filledItems.length, 0)

  return (
    <div className={styles.podiumBoard}>
      {orderedIndexes.map((index) => {
        const item = filledItems[index]

        if (item) {
          return <PodiumCard key={item.raceId} item={item} />
        }

        return (
          <PodiumEmptyCard
            key={`empty-podium-${expectedDistanceKm ?? 'no-target'}-${index + 1}`}
            rank={index + 1}
            expectedDistanceKm={expectedDistanceKm}
            missingCount={missingCount}
          />
        )
      })}
    </div>
  )
}

function EntryTableRow({ item }: { item: BestEffortItem }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = getLocaleFromLanguage(language)
  return (
    <tr className={styles.entryTableRow}>
      <td className={styles.entryTableRank}>#{item.overallRank}</td>
      <td className={styles.entryTableName}>{item.raceName}</td>
      <td className={styles.entryTableCell}>{formatRaceDate(item.raceDate, locale, t('bestEfforts.format.noDate'))}</td>
      <td className={styles.entryTableCell}>{formatDistance(item.realKm, locale)}</td>
      <td className={styles.entryTableMetric}>{formatDuration(item.chipTimeSeconds)}</td>
      <td className={styles.entryTableMetric}>{formatPace(item.pacePerKmSeconds)}</td>
      <td className={styles.entryTableMetric}>{formatDuration(item.officialTimeSeconds)}</td>
      <td className={styles.entryTableStatus}>
        <span className={`${styles.rankingNoteBadge} ${getRankingNoteBadgeClassName(item)}`.trim()}>
          {getRankingNoteLabel(item.rankingNote, t)}
        </span>
      </td>
    </tr>
  )
}

type CategoryRacesModalState = {
  categoryName: string
  categoryKey: string
  mode: CategoryRacesMode
  items: BestEffortItem[]
}

type CategoryRacesMode = 'valid' | 'excluded'

function getExcludedItems(category: BestEffortCategory) {
  return category.efforts.filter((item) => !item.validForBestEffortRanking)
}

function getCategoryScoreBadgeClassName(mode: CategoryRacesMode) {
  switch (mode) {
    case 'valid':
      return styles.categoryScoreValid
    case 'excluded':
      return styles.categoryScoreExcluded
  }
}

export function BestEffortsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = getLocaleFromLanguage(language)
  const persistedFilters = useMemo(() => readPersistedBestEffortsFilters(), [])
  const isPageRefreshRef = useRef(false)
  const [payload, setPayload] = useState<BestEffortCategory[]>([])
  const [raceTypes, setRaceTypes] = useState<RaceTypeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BestEffortsViewMode>(persistedFilters?.viewMode ?? 'top-3')
  const [selectedRaceTypes, setSelectedRaceTypes] = useState<string[]>(persistedFilters?.selectedRaceTypes ?? [])
  const [isRaceTypesOpen, setIsRaceTypesOpen] = useState(persistedFilters?.isRaceTypesOpen ?? true)
  const [categoryRacesModal, setCategoryRacesModal] = useState<CategoryRacesModalState | null>(null)
  const [expandedCategoryKeys, setExpandedCategoryKeys] = useState<string[]>([])
  const [isManageRaceTypesPanelOpen, setIsManageRaceTypesPanelOpen] = useState(false)
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
        setErrorMessage(error instanceof Error ? error.message : t('bestEfforts.errors.load'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadBestEfforts()
  }, [token])

  const visibleCategories = useMemo(() => payload
    .map((category) => {
      const items = assignVisibleRanks(getFilteredItems(category.efforts, viewMode))
      return {
        ...category,
        visibleItems: items,
      }
    })
    .filter((category) => selectedRaceTypes.length === 0 || selectedRaceTypes.includes(category.categoryName))
    .filter((category) => category.totalEffortCount > 0), [payload, selectedRaceTypes, viewMode])

  const featuredLimit = viewMode === 'top-3' ? 3 : 5
  const raceTypeOptions = raceTypes.map((raceType) => ({
    label: raceType.name,
    value: raceType.name,
  }))

  useEffect(() => {
    if (selectedRaceTypes.length > 0) {
      setIsRaceTypesOpen(true)
    }
  }, [selectedRaceTypes])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(STORAGE_KEYS.bestEffortsFilters, JSON.stringify({
      viewMode,
      selectedRaceTypes,
      isRaceTypesOpen,
    } satisfies PersistedBestEffortsFiltersState))
  }, [isRaceTypesOpen, selectedRaceTypes, viewMode])

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

  const shouldShowClearFiltersButton = useMemo(
    () => viewMode !== 'top-3' || selectedRaceTypes.length > 0,
    [selectedRaceTypes.length, viewMode],
  )

  const handleClearFilters = () => {
    setViewMode('top-3')
    setSelectedRaceTypes([])
    setExpandedCategoryKeys([])
  }

  const expandCategoryTable = (categoryKey: string) => {
    setExpandedCategoryKeys((current) => (current.includes(categoryKey) ? current : [...current, categoryKey]))
  }

  const collapseCategoryTable = (categoryKey: string) => {
    setExpandedCategoryKeys((current) => current.filter((key) => key !== categoryKey))
  }

  const openCategoryRacesModal = (category: BestEffortCategory, mode: CategoryRacesMode) => {
    const baseItems = mode === 'valid'
      ? category.efforts.filter((item) => item.validForBestEffortRanking)
      : getExcludedItems(category)

    const items = mode === 'valid' ? assignVisibleRanks(baseItems) : baseItems

    setCategoryRacesModal({
      categoryName: category.categoryName,
      categoryKey: category.categoryKey,
      mode,
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
      : getExcludedItems(category)

    setCategoryRacesModal({
      ...currentModal,
      categoryName: category.categoryName,
      items: currentModal.mode === 'valid' ? assignVisibleRanks(items) : items,
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
      setDetailsError(loadError instanceof Error ? loadError.message : t('bestEfforts.errors.loadRace'))
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
      setDetailsError(loadError instanceof Error ? loadError.message : t('bestEfforts.errors.loadRaceForEdit'))
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
      setDetailsError(deleteError instanceof Error ? deleteError.message : t('bestEfforts.errors.deleteRace'))
    } finally {
      setIsDeletingRace(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <Title level={1} className={styles.pageTitle}>{t('bestEfforts.title')}</Title>
        </div>
        <Segmented<BestEffortsViewMode>
          value={viewMode}
          onChange={(value) => setViewMode(value)}
          options={[
            { label: t('bestEfforts.viewMode.top3'), value: 'top-3' },
            { label: t('bestEfforts.viewMode.top5'), value: 'top-5' },
            { label: t('bestEfforts.viewMode.all'), value: 'all' },
          ]}
          className={styles.viewSwitcher}
          aria-label={t('bestEfforts.viewMode.aria')}
        />
      </header>

      {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

      {isLoading ? (
        <Card className={styles.emptyCard}>
          <div className={styles.loadingState}>
            <Space size="middle">
              <Spin />
              <span className={styles.loadingText}>{t('bestEfforts.loading')}</span>
            </Space>
          </div>
        </Card>
      ) : null}

      <div className={styles.contentLayout}>
        <section className={styles.mainSection}>
          {!isLoading && !errorMessage && visibleCategories.length === 0 ? (
            <Card className={styles.emptyCard} variant="borderless">
              <div className={styles.emptyWrap}>
                <Empty description={t('bestEfforts.empty')} />
              </div>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && visibleCategories.length > 0 ? (
            <div className={styles.categoryList}>
              {visibleCategories.map((category) => (
                <Card key={category.categoryKey} className={styles.categoryCard} styles={{ body: { padding: 24 } }}>
                  {(() => {
                    const excludedCount = getExcludedItems(category).length
                    const effectiveValidCount = category.efforts.filter((item) => item.validForBestEffortRanking).length
                    const minimumAcceptedDistance = getMinimumAcceptedDistance(category.expectedDistanceKm)
                    const minimumAcceptedDistanceLabel = minimumAcceptedDistance != null
                      ? formatDistance(minimumAcceptedDistance, locale)
                      : t('bestEfforts.category.minimumDistanceFallback')

                    return (
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryTitleBlock}>
                      <div className={styles.categoryTitleRow}>
                        <Title level={3} className={styles.categoryTitle}>{category.categoryName}</Title>
                        {category.expectedDistanceKm != null ? (
                          <span className={`${styles.categoryScoreBadge} ${styles.categoryScoreTarget}`.trim()}>
                            {formatDistance(category.expectedDistanceKm, locale)}
                          </span>
                        ) : (
                          <Tag>{t('bestEfforts.category.noTargetKm')}</Tag>
                        )}
                      </div>
                    </div>

                    <div className={styles.categoryMetaAside}>
                      <div className={styles.metaRow}>
                        <Tooltip title={t('bestEfforts.category.validTooltip', { minDistance: minimumAcceptedDistanceLabel })}>
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
                            {effectiveValidCount} {t('bestEfforts.category.validLabel')}
                          </span>
                        </Tooltip>
                        {excludedCount > 0 ? (
                          <Tooltip title={t('bestEfforts.category.excludedTooltip', { minDistance: minimumAcceptedDistanceLabel })}>
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
                              {excludedCount} {t('bestEfforts.category.excludedLabel')}
                            </span>
                          </Tooltip>
                        ) : null}
                        <span className={styles.categoryScoreDivider} aria-hidden="true">|</span>
                        <span
                          className={`${styles.categoryScoreBadge} ${styles.categoryScoreTotal}`.trim()}
                        >
                          {category.totalEffortCount} {t('bestEfforts.category.totalLabel')}
                        </span>
                      </div>
                    </div>

                  </div>
                    )
                  })()}

                  <div className={styles.entriesList}>
                    <PodiumShowcase
                      items={category.visibleItems}
                      featuredLimit={featuredLimit}
                      expectedDistanceKm={category.expectedDistanceKm}
                    />

                    {category.visibleItems.length === 0 ? (
                      <div className={styles.categoryEmptyState}>
                        {category.expectedDistanceKm == null
                          ? t('bestEfforts.category.defineTargetKmHint')
                          : t('bestEfforts.category.noEligibleHint')}
                      </div>
                    ) : null}

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
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.rank')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.race')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.date')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.distance')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.chip')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.pace')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.official')}</th>
                                      <th className={styles.entryTableHeading}>{t('bestEfforts.table.status')}</th>
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
                                  {isExpanded ? t('bestEfforts.table.showLess') : t('bestEfforts.table.seeAll', { count: remainingItems.length })}
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
              <span className={styles.sidebarTitle}>{t('bestEfforts.filters.title')}</span>
              {shouldShowClearFiltersButton ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  title={t('bestEfforts.filters.clear')}
                  aria-label={t('bestEfforts.filters.clear')}
                  onClick={handleClearFilters}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            <CheckboxFilterSection
              title={t('bestEfforts.filters.raceTypes')}
              count={selectedRaceTypes.length}
              isOpen={isRaceTypesOpen}
              onToggle={() => setIsRaceTypesOpen((current) => !current)}
              titleAction={(
                <span onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.manageFilterButton}
                      onClick={() => setIsManageRaceTypesPanelOpen(true)}
                      aria-label={t('bestEfforts.filters.manageRaceTypesAria')}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                </span>
              )}
            >
              <div className={styles.checkboxList}>
                {raceTypeOptions.length === 0 ? (
                  <span className={styles.checkboxListHint}>{t('bestEfforts.filters.noRaceTypes')}</span>
                ) : raceTypeOptions.map((raceType) => (
                  <label key={raceType.value} className={styles.checkboxOption}>
                    <Checkbox
                      checked={selectedRaceTypes.includes(raceType.value)}
                      onChange={(event) => setSelectedRaceTypes((current) => (
                        event.target.checked
                          ? [...current, raceType.value]
                          : current.filter((value) => value !== raceType.value)
                      ))}
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
        title={categoryRacesModal
          ? `${categoryRacesModal.categoryName} \u00B7 ${categoryRacesModal.mode === 'valid' ? t('bestEfforts.category.modal.validTitle') : t('bestEfforts.category.modal.excludedTitle')}`
          : ''}
        footer={null}
        onCancel={() => setCategoryRacesModal(null)}
        width={860}
      >
        <div className={styles.modalList}>
          {categoryRacesModal?.items.map((item) => (
            <Card
              key={item.raceId}
              className={`${styles.modalRaceCard} ${styles.clickableModalRaceCard}`.trim()}
              styles={{ body: { padding: 16 } }}
              onClick={() => void handleOpenRaceDetails(item)}
            >
              <div className={styles.modalRaceHeader}>
                <div className={styles.modalRaceMain}>
                  {hasDisplayedRanking(item) ? <span className={styles.modalRankBadge}>#{item.overallRank}</span> : null}
                  <div className={styles.modalRaceTitleBlock}>
                    <Title level={5} className={styles.modalRaceTitle}>{item.raceName}</Title>
                    <div className={styles.entrySubtitle}>
                      <span>{formatRaceDate(item.raceDate, locale, t('bestEfforts.format.noDate'))}</span>
                      <span>{formatDistance(item.realKm, locale)}</span>
                      <span>{item.raceTypeName}</span>
                    </div>
                  </div>
                </div>

                <EntryBadges item={item} />
              </div>
            </Card>
          ))}

          {categoryRacesModal && categoryRacesModal.items.length === 0 ? (
            <Empty description={t('bestEfforts.category.modal.empty')} />
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
            setDetailsError(loadError instanceof Error ? loadError.message : t('bestEfforts.errors.reloadRace'))
          } finally {
            setIsDetailsLoading(false)
          }
        }}
      />

      <Modal
        title={t('bestEfforts.deleteRace.title')}
        open={racePendingDelete != null}
        okText={t('bestEfforts.deleteRace.ok')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
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
            ? t('bestEfforts.deleteRace.bodyNamed', { name: racePendingDelete.raceName })
            : t('bestEfforts.deleteRace.body')}
        </p>
      </Modal>

      {isManageRaceTypesPanelOpen ? (
        <AddRaceDrawer
          createOptions={createOptions}
          onCreated={() => Promise.resolve()}
          onCreateOptionsChange={(nextOptions) => {
            setCreateOptions(nextOptions)
            setRaceTypes(nextOptions.raceTypes)
            setSelectedRaceTypes((current) => current.filter((raceTypeName) => (
              nextOptions.raceTypes.some((raceType) => raceType.name === raceTypeName)
            )))
          }}
          hideTrigger
          forceManageOptionType="race-types"
          onManageOptionModalClose={() => {
            setIsManageRaceTypesPanelOpen(false)
            void reloadBestEffortsPageData()
          }}
          onClose={() => {
            setIsManageRaceTypesPanelOpen(false)
            void reloadBestEffortsPageData()
          }}
        />
      ) : null}
    </div>
  )
}
