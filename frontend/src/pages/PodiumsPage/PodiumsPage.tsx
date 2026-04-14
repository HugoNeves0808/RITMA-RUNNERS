import { faBroom, faCalendarDays, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, Checkbox, Empty, Input, Modal, Spin, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import { fetchPodiumHistory, type PodiumHistoryItem, type PodiumType } from '../../features/podiums'
import {
  AddRaceDrawer,
  RaceDetailsDrawer,
  deleteRace,
  fetchRaceCreateOptions,
  fetchRaceDetail,
  type RaceCreateOptions,
  type RaceDetailResponse,
} from '../../features/races'
import styles from './PodiumsPage.module.css'

const { Title } = Typography

function getLocaleFromLanguage(language: string | undefined) {
  return language === 'pt' ? 'pt-PT' : 'en-GB'
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

function formatTimelineDate(value: string | null, locale: string, noDateLabel: string) {
  if (!value) {
    return noDateLabel
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
  return `${day} ${month}`
}

function getRaceYear(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.getFullYear()
}

function formatDuration(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPace(totalSeconds: number | null) {
  if (totalSeconds == null) {
    return '-'
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}/km`
}

function getPodiumTypeLabel(type: PodiumType, t: (key: string) => string) {
  switch (type) {
    case 'GENERAL':
      return t('podiums.filters.typeGeneral')
    case 'AGE_GROUP':
      return t('podiums.filters.typeAgeGroup')
    case 'TEAM':
      return t('podiums.filters.typeTeam')
  }
}

function getPodiumBadgeClassName(position: number) {
  if (position === 1) {
    return styles.badgeFirst
  }

  if (position === 2) {
    return styles.badgeSecond
  }

  if (position === 3) {
    return styles.badgeThird
  }

  return styles.badgeNeutral
}

function getPositionSuffix(position: number) {
  if (position === 1) {
    return 'st'
  }

  if (position === 2) {
    return 'nd'
  }

  if (position === 3) {
    return 'rd'
  }

  return 'th'
}

function formatPodiumPosition(position: number, language: string | undefined) {
  if (language === 'pt') {
    return `${position}º`
  }

  return `${position}${getPositionSuffix(position)}`
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className={styles.summaryCard} bordered={false}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </Card>
  )
}

export function PodiumsPage() {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = getLocaleFromLanguage(language)
  const [payload, setPayload] = useState<PodiumHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<PodiumType[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [raceDetails, setRaceDetails] = useState<RaceDetailResponse | null>(null)
  const [selectedDetailsRace, setSelectedDetailsRace] = useState<PodiumHistoryItem | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [createOptions, setCreateOptions] = useState<RaceCreateOptions>({
    raceTypes: [],
    teams: [],
    circuits: [],
    shoes: [],
  })
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingRace, setEditingRace] = useState<RaceDetailResponse | null>(null)
  const [racePendingDelete, setRacePendingDelete] = useState<PodiumHistoryItem | null>(null)
  const [isDeletingRace, setIsDeletingRace] = useState(false)

  useEffect(() => {
    if (!token) {
      setPayload([])
      setIsLoading(false)
      return
    }

    const loadPodiums = async () => {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const [response, nextCreateOptions] = await Promise.all([
          fetchPodiumHistory(token),
          fetchRaceCreateOptions(token),
        ])
        setPayload(response.items)
        setCreateOptions(nextCreateOptions)
      } catch (loadError) {
        setErrorMessage(loadError instanceof Error ? loadError.message : t('podiums.errors.load'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadPodiums()
  }, [t, token])

  const summary = useMemo(() => ({
    total: payload.length,
    general: payload.filter((item) => item.podiumType === 'GENERAL').length,
    ageGroup: payload.filter((item) => item.podiumType === 'AGE_GROUP').length,
    team: payload.filter((item) => item.podiumType === 'TEAM').length,
  }), [payload])

  const availableYears = useMemo(
    () => Array.from(new Set(payload.map((item) => getRaceYear(item.raceDate)).filter((year): year is number => year != null))).sort((a, b) => b - a),
    [payload],
  )

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return payload.filter((item) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.podiumType)) {
        return false
      }

      const raceYear = getRaceYear(item.raceDate)
      if (selectedYears.length > 0 && (raceYear == null || !selectedYears.includes(raceYear))) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableFields = [
        item.raceName,
        item.raceTypeName,
        formatRaceDate(item.raceDate, locale, t('podiums.format.noDate')),
        getPodiumTypeLabel(item.podiumType, t),
      ]

      return searchableFields.some((field) => field?.toLowerCase().includes(normalizedSearch))
    })
  }, [locale, payload, searchValue, selectedTypes, selectedYears, t])

  const groupedItems = useMemo(() => {
    const groups = new Map<number, PodiumHistoryItem[]>()

    filteredItems.forEach((item) => {
      const year = getRaceYear(item.raceDate) ?? 0
      const current = groups.get(year)

      if (current) {
        current.push(item)
        return
      }

      groups.set(year, [item])
    })

    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0])
  }, [filteredItems])

  const shouldShowClearFiltersButton = useMemo(
    () => searchValue.trim().length > 0 || selectedTypes.length > 0 || selectedYears.length > 0,
    [searchValue, selectedTypes.length, selectedYears.length],
  )

  const handleClearFilters = () => {
    setSearchValue('')
    setSelectedTypes([])
    setSelectedYears([])
  }

  const handleOpenDetails = async (item: PodiumHistoryItem) => {
    if (!token) {
      return
    }

    setRaceDetails(null)
    setDetailsError(null)
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    setSelectedDetailsRace(item)

    try {
      const details = await fetchRaceDetail(item.raceId, token)
      setRaceDetails(details)
    } catch (loadError) {
      setDetailsError(loadError instanceof Error ? loadError.message : t('podiums.errors.loadRace'))
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const reloadPodiumsPageData = async () => {
    if (!token) {
      return
    }

    const [response, nextCreateOptions] = await Promise.all([
      fetchPodiumHistory(token),
      fetchRaceCreateOptions(token),
    ])

    setPayload(response.items)
    setCreateOptions(nextCreateOptions)
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
      setDetailsError(loadError instanceof Error ? loadError.message : t('podiums.errors.loadRaceForEdit'))
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
      await reloadPodiumsPageData()
    } catch (deleteError) {
      setDetailsError(deleteError instanceof Error ? deleteError.message : t('podiums.errors.deleteRace'))
    } finally {
      setIsDeletingRace(false)
    }
  }

  return (
      <div className={styles.page}>
      <div className={styles.header}>
        <Title level={1} className={styles.pageTitle}>{t('podiums.title')}</Title>
      </div>

      <div className={styles.summaryGrid}>
        <SummaryCard label={t('podiums.summary.total')} value={summary.total} />
        <SummaryCard label={t('podiums.summary.general')} value={summary.general} />
        <SummaryCard label={t('podiums.summary.ageGroup')} value={summary.ageGroup} />
        <SummaryCard label={t('podiums.summary.team')} value={summary.team} />
      </div>

      <div className={styles.contentLayout}>
        <section className={styles.mainSection}>
          {errorMessage ? (
            <Alert
              type="error"
              showIcon
              message={t('podiums.alert.loadTitle')}
              description={errorMessage}
            />
          ) : null}

          {isLoading ? (
            <div className={styles.loadingState}>
              <Spin size="large" />
            </div>
          ) : null}

          {!isLoading && !errorMessage && filteredItems.length === 0 ? (
            <Card className={styles.emptyCard} bordered={false}>
              <Empty description={payload.length === 0 ? t('podiums.empty.noneYet') : t('podiums.empty.noMatch')} />
            </Card>
          ) : null}

          {!isLoading && !errorMessage && filteredItems.length > 0 ? (
            <div className={styles.timelineList}>
              {groupedItems.map(([year, items]) => (
                <div key={year} className={styles.yearGroup}>
                  <div className={styles.yearRow}>
                    <span className={styles.yearLabel}>{year}</span>
                  </div>

                  {items.map((item) => (
                    <div key={item.podiumKey} className={styles.timelineItem}>
                      <div className={styles.timelineDate}>{formatTimelineDate(item.raceDate, locale, t('podiums.format.noDate'))}</div>
                      <div className={styles.timelineRail}>
                        <span className={styles.timelineDot} aria-hidden="true" />
                      </div>
                      <Card
                        className={styles.podiumCard}
                        bordered={false}
                        onClick={() => void handleOpenDetails(item)}
                      >
                        <div className={styles.cardInner}>
                          <div className={`${styles.podiumBadge} ${getPodiumBadgeClassName(item.podiumPosition)}`.trim()}>
                            <span className={styles.podiumBadgePosition}>
                              {formatPodiumPosition(item.podiumPosition, language)}
                            </span>
                            <span className={styles.podiumBadgeType}>{getPodiumTypeLabel(item.podiumType, t)}</span>
                          </div>

                          <div className={styles.cardContent}>
                            <div className={styles.topRow}>
                              <h3 className={styles.cardTitle}>{item.raceName}</h3>
                              <span className={styles.inlineMeta}>
                                <FontAwesomeIcon icon={faCalendarDays} className={styles.metaIcon} />
                                {formatRaceDate(item.raceDate, locale, t('podiums.format.noDate'))}
                              </span>
                              <span className={styles.inlineMeta}>
                                <FontAwesomeIcon icon={faFlagCheckered} className={styles.metaIcon} />
                                {item.raceTypeName ?? '-'}
                              </span>
                            </div>

                            <div className={styles.metricsGrid}>
                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>{t('podiums.card.officialTime')}</span>
                                <span className={styles.metricValue}>{formatDuration(item.officialTimeSeconds)}</span>
                              </div>
                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>{t('podiums.card.chipTime')}</span>
                                <span className={styles.metricValue}>{formatDuration(item.chipTimeSeconds)}</span>
                              </div>
                              <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>{t('podiums.card.pace')}</span>
                                <span className={styles.metricValue}>{formatPace(item.pacePerKmSeconds)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>{t('podiums.filters.title')}</span>
              {shouldShowClearFiltersButton ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  title={t('podiums.filters.clear')}
                  aria-label={t('podiums.filters.clear')}
                  onClick={handleClearFilters}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            <div className={styles.filterField}>
              <label htmlFor="podiums-search" className={styles.filterLabel}>{t('podiums.filters.searchLabel')}</label>
              <Input
                id="podiums-search"
                allowClear
                placeholder={t('podiums.filters.searchPlaceholder')}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>{t('podiums.filters.yearsLabel')}</span>
              <div className={styles.checkboxList}>
                {availableYears.length === 0 ? (
                  <span className={styles.checkboxHint}>{t('podiums.filters.yearsEmpty')}</span>
                ) : availableYears.map((year) => (
                  <label key={year} className={styles.checkboxOption}>
                    <Checkbox
                      checked={selectedYears.includes(year)}
                      onChange={(event) => setSelectedYears((current) => (
                        event.target.checked
                          ? [...current, year]
                          : current.filter((value) => value !== year)
                      ))}
                    />
                    <span className={styles.checkboxOptionLabel}>{year}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>{t('podiums.filters.typeLabel')}</span>
              <div className={styles.checkboxList}>
                {([
                  { label: t('podiums.filters.typeGeneral'), value: 'GENERAL', count: summary.general },
                  { label: t('podiums.filters.typeAgeGroup'), value: 'AGE_GROUP', count: summary.ageGroup },
                  { label: t('podiums.filters.typeTeam'), value: 'TEAM', count: summary.team },
                ] as Array<{ label: string; value: PodiumType; count: number }>).map((option) => (
                  <label key={option.value} className={styles.checkboxOption}>
                    <Checkbox
                      checked={selectedTypes.includes(option.value)}
                      onChange={(event) => setSelectedTypes((current) => (
                        event.target.checked
                          ? [...current, option.value]
                          : current.filter((value) => value !== option.value)
                      ))}
                    />
                    <span className={styles.checkboxOptionLabel}>
                      {option.label}
                      <span className={styles.filterCount}>{option.count}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

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
          setRaceDetails(null)
          setDetailsError(null)
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
          await reloadPodiumsPageData()
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
            setDetailsError(loadError instanceof Error ? loadError.message : t('podiums.errors.reloadRace'))
          } finally {
            setIsDetailsLoading(false)
          }
        }}
      />

      <Modal
        title={t('podiums.deleteRace.title')}
        open={racePendingDelete != null}
        zIndex={1400}
        okText={t('podiums.deleteRace.ok')}
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
            ? t('podiums.deleteRace.bodyNamed', { name: racePendingDelete.raceName })
            : t('podiums.deleteRace.body')}
        </p>
      </Modal>
    </div>
  )
}
