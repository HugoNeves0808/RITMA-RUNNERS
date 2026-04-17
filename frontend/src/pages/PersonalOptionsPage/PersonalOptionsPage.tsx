import { faBoxArchive, faBroom, faMagnifyingGlass, faPenToSquare, faPlus, faRotateLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, Checkbox, Drawer, Empty, Input, InputNumber, Modal, Space, Spin, Tooltip, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import {
  createManagedRaceOption,
  deleteManagedRaceOption,
  detachManagedRaceOptionUsage,
  fetchManagedRaceOptions,
  fetchManagedRaceOptionUsage,
  updateManagedRaceOptionArchived,
  updateManagedRaceOption,
  type ManagedRaceOptionType,
  type RaceOptionUsage,
  type RaceTypeOption,
} from '../../features/races'
import { translateRaceTypeName } from '../../utils/raceTypeLocalization'
import styles from './PersonalOptionsPage.module.css'

const { Title } = Typography

type ManagedOptionConfirmState =
  | { kind: 'delete'; option: RaceTypeOption }
  | { kind: 'detach-delete'; option: RaceTypeOption }
  | null

function getLocaleFromLanguage(language: string | undefined) {
  return language === 'pt' ? 'pt-PT' : 'en-GB'
}

function getOptionTypeKey(optionType: ManagedRaceOptionType) {
  return optionType === 'race-types' ? 'raceTypes' : optionType
}

function normalizeDecimalInput(value: string | number | undefined) {
  if (value == null) {
    return ''
  }

  return String(value).replace(',', '.')
}

function parseDecimalNumberInput(value: string | number | undefined) {
  const normalized = normalizeDecimalInput(value)
  if (!normalized) {
    return 0
  }

  const cleaned = normalized.replace(/[^0-9.]/g, '')
  const [integerPart = '', ...decimalParts] = cleaned.split('.')
  const decimalPart = decimalParts.join('')
  const parsedValue = Number(decimalPart.length > 0 ? `${integerPart}.${decimalPart}` : integerPart)

  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

type PersonalOptionsPageProps = {
  optionType: ManagedRaceOptionType
}

export function PersonalOptionsPage({ optionType }: PersonalOptionsPageProps) {
  const { token } = useAuth()
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const locale = getLocaleFromLanguage(language)
  const [options, setOptions] = useState<RaceTypeOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optionName, setOptionName] = useState('')
  const [targetKm, setTargetKm] = useState<number | null>(null)
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [usage, setUsage] = useState<RaceOptionUsage | null>(null)
  const [pendingDeleteOption, setPendingDeleteOption] = useState<RaceTypeOption | null>(null)
  const [confirmState, setConfirmState] = useState<ManagedOptionConfirmState>(null)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showDefaultFromRitma, setShowDefaultFromRitma] = useState(true)

  const activeType = optionType
  const optionTypeKey = getOptionTypeKey(activeType)
  const config = useMemo(() => ({
    title: t(`personalOptions.options.${optionTypeKey}.title`),
    itemLabel: t(`personalOptions.options.${optionTypeKey}.item`),
    emptyLabel: t(`personalOptions.options.${optionTypeKey}.empty`),
    inputPlaceholder: t(`personalOptions.options.${optionTypeKey}.inputPlaceholder`),
  }), [optionTypeKey, t])
  const deferredSearch = useDeferredValue(search)
  const visibleOptions = useMemo(
    () => options.filter((option) => {
      const searchableName = activeType === 'race-types'
        ? (translateRaceTypeName(option.name, t) ?? option.name)
        : option.name

      if (!showArchived && option.archived) {
        return false
      }

      if (!showDefaultFromRitma && option.isDefault) {
        return false
      }

      if (deferredSearch.trim()) {
        return searchableName.toLowerCase().includes(deferredSearch.trim().toLowerCase())
      }

      return true
    }),
    [activeType, deferredSearch, options, showArchived, showDefaultFromRitma, t],
  )

  const hasActiveFilters = search.trim().length > 0 || showArchived || !showDefaultFromRitma

  useEffect(() => {
    const loadOptions = async () => {
      if (!token) {
        setOptions([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const payload = await fetchManagedRaceOptions(activeType, token, true)
        setOptions(payload)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('personalOptions.errors.load'))
      } finally {
        setIsLoading(false)
      }
    }

    void loadOptions()
  }, [activeType, t, token])

  const resetEditorState = () => {
    setOptionName('')
    setTargetKm(null)
    setEditingOptionId(null)
    setIsEditorOpen(false)
    setIsDiscardModalOpen(false)
    setUsage(null)
    setPendingDeleteOption(null)
    setConfirmState(null)
    setError(null)
  }

  useEffect(() => {
    setOptionName('')
    setTargetKm(null)
    setEditingOptionId(null)
    setIsEditorOpen(false)
    setIsDiscardModalOpen(false)
    setUsage(null)
    setPendingDeleteOption(null)
    setConfirmState(null)
    setError(null)
    setSearch('')
    setShowArchived(false)
    setShowDefaultFromRitma(true)
  }, [activeType])

  const handleClearFilters = () => {
    setSearch('')
    setShowArchived(false)
    setShowDefaultFromRitma(true)
  }

  const hasUnsavedEditorChanges = optionName.trim().length > 0 || (activeType === 'race-types' && targetKm != null)

  const handleCloseEditor = () => {
    if (hasUnsavedEditorChanges) {
      setIsDiscardModalOpen(true)
      return
    }

    resetEditorState()
  }

  const handleSave = async () => {
    if (!token) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setUsage(null)
      setPendingDeleteOption(null)
      setConfirmState(null)

      const savedOption = editingOptionId
        ? await updateManagedRaceOption(
          activeType,
          editingOptionId,
          {
            name: optionName,
            targetKm: activeType === 'race-types' ? targetKm : undefined,
          },
          token,
        )
        : await createManagedRaceOption(
          activeType,
          {
            name: optionName,
            targetKm: activeType === 'race-types' ? targetKm : undefined,
          },
          token,
        )

      const nextOptions = editingOptionId
        ? options.map((option) => (option.id === savedOption.id ? savedOption : option))
        : [...options, savedOption]

      setOptions(nextOptions.sort((left, right) => left.name.localeCompare(right.name)))

      setOptionName('')
      setTargetKm(null)
      setEditingOptionId(null)
      setIsEditorOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('personalOptions.errors.save', { item: config.itemLabel }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (option: RaceTypeOption) => {
    if (!token) {
      return
    }

    try {
      setError(null)
      setUsage(null)
      setPendingDeleteOption(null)
      const nextUsage = await fetchManagedRaceOptionUsage(activeType, option.id, token)

      if (nextUsage.usageCount > 0) {
        setPendingDeleteOption(option)
        setUsage(nextUsage)
        return
      }

      setConfirmState({ kind: 'delete', option })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('personalOptions.errors.delete', { item: config.itemLabel }))
    }
  }

  const handleToggleArchived = async (option: RaceTypeOption, archived: boolean) => {
    if (!token) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const savedOption = await updateManagedRaceOptionArchived(activeType, option.id, archived, token)
      setOptions((current) => current
        .map((currentOption) => (currentOption.id === savedOption.id ? savedOption : currentOption))
        .sort((left, right) => left.name.localeCompare(right.name)))
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : t('personalOptions.errors.update', { item: config.itemLabel }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!token || !confirmState) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (confirmState.kind === 'detach-delete') {
        await detachManagedRaceOptionUsage(activeType, confirmState.option.id, token)
      }

      await deleteManagedRaceOption(activeType, confirmState.option.id, token)

      setOptions((current) => current.filter((option) => option.id !== confirmState.option.id))

      if (editingOptionId === confirmState.option.id) {
        setOptionName('')
        setTargetKm(null)
        setEditingOptionId(null)
      }

      setUsage(null)
      setPendingDeleteOption(null)
      setConfirmState(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('personalOptions.errors.delete', { item: config.itemLabel }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDetachDelete = async () => {
    if (!token || !pendingDeleteOption) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await detachManagedRaceOptionUsage(activeType, pendingDeleteOption.id, token)
      await deleteManagedRaceOption(activeType, pendingDeleteOption.id, token)

      setOptions((current) => current.filter((option) => option.id !== pendingDeleteOption.id))

      if (editingOptionId === pendingDeleteOption.id) {
        setOptionName('')
        setTargetKm(null)
        setEditingOptionId(null)
      }

      setUsage(null)
      setPendingDeleteOption(null)
      setConfirmState(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('personalOptions.errors.delete', { item: config.itemLabel }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Title level={1} className={styles.pageTitle}>{config.title}</Title>
        </div>
        <div className={styles.headerActions}>
          <Button
            type="primary"
            className={styles.addButton}
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => {
              setOptionName('')
              setTargetKm(null)
              setEditingOptionId(null)
              setError(null)
              setIsEditorOpen(true)
            }}
          >
            {t('personalOptions.actions.add', { item: config.itemLabel })}
          </Button>
        </div>
      </div>

      <div className={styles.contentLayout}>
        <section className={styles.contentMain}>
          <Card className={styles.pageCard} variant="borderless">
            {error ? (
              <Alert
                type="error"
                showIcon
                message={t('personalOptions.errors.manageTitle', { title: config.title })}
                description={error}
                style={{ marginBottom: 18 }}
              />
            ) : null}

            {isLoading ? (
              <div className={styles.loadingState}>
                <Space size="middle">
                  <Spin />
                  <span className={styles.loadingText}>{t('personalOptions.loading', { title: config.title })}</span>
                </Space>
              </div>
            ) : visibleOptions.length === 0 ? (
              <div className={styles.emptyWrap}>
                <Empty description={hasActiveFilters ? t('personalOptions.empty.filtered') : config.emptyLabel} />
              </div>
            ) : (
              <div className={styles.optionList}>
                {visibleOptions.map((option) => (
                  <div
                    key={option.id}
                    className={[styles.optionRow, option.archived ? styles.optionRowArchived : ''].filter(Boolean).join(' ')}
                  >
                    <div className={styles.optionInfo}>
                      <div className={styles.optionNameRow}>
                        <span className={styles.optionName}>
                          {activeType === 'race-types' ? translateRaceTypeName(option.name, t) : option.name}
                        </span>
                        {option.archived ? <span className={styles.archivedBadge}>{t('personalOptions.badges.archived')}</span> : null}
                      </div>
                      {activeType === 'race-types' ? (
                        <div className={styles.optionMetaRow}>
                          <span className={styles.optionMeta}>
                            {option.targetKm != null
                              ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(option.targetKm)} km`
                              : t('personalOptions.raceTypes.noTargetKm')}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {option.isDefault ? (
                      <div className={styles.optionActions}>
                        <span className={styles.defaultOptionBadge}>{t('personalOptions.badges.defaultFromRitma')}</span>
                      </div>
                    ) : (
                      <div className={styles.optionActions}>
                        <Button
                          type="text"
                          icon={<FontAwesomeIcon icon={option.archived ? faRotateLeft : faBoxArchive} />}
                          onClick={() => void handleToggleArchived(option, !option.archived)}
                        >
                          {option.archived ? t('personalOptions.actions.restore') : t('personalOptions.actions.archive')}
                        </Button>
                        <Button
                          type="text"
                          icon={<FontAwesomeIcon icon={faPenToSquare} />}
                          onClick={() => {
                            setOptionName(option.name)
                            setTargetKm(activeType === 'race-types' ? (option.targetKm ?? null) : null)
                            setEditingOptionId(option.id)
                            setIsEditorOpen(true)
                            setUsage(null)
                            setPendingDeleteOption(null)
                            setConfirmState(null)
                            setError(null)
                          }}
                        >
                          {t('personalOptions.actions.edit')}
                        </Button>
                        <Button
                          type="text"
                          danger
                          icon={<FontAwesomeIcon icon={faTrashCan} />}
                          onClick={() => void handleDelete(option)}
                        >
                          {t('personalOptions.actions.delete')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>{t('personalOptions.filters.title')}</h3>
              {hasActiveFilters ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  title={t('personalOptions.filters.clear')}
                  aria-label={t('personalOptions.filters.clear')}
                  onClick={handleClearFilters}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>{t('personalOptions.filters.search')}</span>
              <Input
                allowClear
                className={styles.searchInput}
                value={search}
                placeholder={t('personalOptions.filters.searchPlaceholder')}
                suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>{t('personalOptions.filters.visibility')}</span>
              <label className={styles.checkboxRow}>
                <Checkbox checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
                <span>{t('personalOptions.filters.showArchived')}</span>
              </label>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>{t('personalOptions.filters.source')}</span>
              <label className={styles.checkboxRow}>
                <Checkbox checked={showDefaultFromRitma} onChange={(event) => setShowDefaultFromRitma(event.target.checked)} />
                <span>{t('personalOptions.badges.defaultFromRitma')}</span>
              </label>
            </div>
          </div>
        </aside>
      </div>

      <Drawer
        title={editingOptionId
          ? t('personalOptions.drawer.editTitle', { item: config.itemLabel })
          : t('personalOptions.drawer.addTitle', { item: config.itemLabel })}
        placement="right"
        width={560}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        destroyOnHidden
        extra={(
          <Space>
            <Button onClick={handleCloseEditor}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              className={styles.saveButton}
              loading={isSubmitting}
              disabled={!optionName.trim() || (activeType === 'race-types' && targetKm == null)}
              onClick={() => void handleSave()}
            >
              {editingOptionId ? t('personalOptions.actions.saveChanges') : t('personalOptions.actions.addShort')}
            </Button>
          </Space>
        )}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message={t('personalOptions.errors.saveTitle', { item: config.itemLabel })}
            description={error}
            style={{ marginBottom: 18 }}
          />
        ) : null}

        <div className={styles.drawerForm}>
          <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <span className={styles.requiredMark} aria-hidden="true">*</span>
              <span>{t('personalOptions.fields.name')}</span>
            </span>
            <Input
              value={optionName}
              maxLength={100}
              placeholder={config.inputPlaceholder}
              onChange={(event) => setOptionName(event.target.value)}
            />
          </label>

          {activeType === 'race-types' ? (
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <span className={styles.requiredMark} aria-hidden="true">*</span>
                <span>{t('personalOptions.fields.targetKm')}</span>
                <Tooltip title={t('personalOptions.raceTypes.targetKmHelp')}>
                  <span className={styles.infoIcon} aria-label={t('personalOptions.raceTypes.targetKmInfoAria')}>i</span>
                </Tooltip>
              </span>
              <InputNumber
                min={0}
                max={9999.99}
                precision={2}
                step={0.01}
                className={styles.targetInput}
                placeholder={t('personalOptions.fields.targetKm')}
                value={targetKm ?? undefined}
                parser={(value) => parseDecimalNumberInput(value)}
                onChange={(value) => setTargetKm(typeof value === 'number' ? value : null)}
              />
            </label>
          ) : null}
        </div>
      </Drawer>

      <Modal
        title={t('personalOptions.discard.title')}
        open={isDiscardModalOpen}
        okText={t('personalOptions.discard.ok')}
        cancelText={t('personalOptions.discard.cancel')}
        okButtonProps={{ danger: true }}
        onOk={resetEditorState}
        onCancel={() => setIsDiscardModalOpen(false)}
      >
        <p>{t('personalOptions.discard.body')}</p>
      </Modal>

      <Modal
        title={t('personalOptions.detachDelete.title')}
        open={usage != null && pendingDeleteOption != null}
        okText={t('personalOptions.detachDelete.ok')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        confirmLoading={isSubmitting}
        onOk={() => void handleConfirmDetachDelete()}
        onCancel={() => {
          setUsage(null)
          setPendingDeleteOption(null)
        }}
      >
        <div className={styles.usageCard}>
          <div className={styles.usageHeader}>
            <strong>{t('personalOptions.detachDelete.usedIn', { count: usage?.usageCount ?? 0 })}</strong>
            <span>
              {t('personalOptions.detachDelete.body', { item: config.itemLabel })}
            </span>
          </div>

          <div className={styles.usageList}>
            {usage?.records.map((record) => (
              <div key={`${record.contextLabel}-${record.raceId}`} className={styles.usageRow}>
                <span className={styles.usageRaceName}>{record.raceName}</span>
                <span className={styles.usageContext}>{record.contextLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title={t('personalOptions.delete.title')}
        open={confirmState?.kind === 'delete'}
        okText={t('personalOptions.actions.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        confirmLoading={isSubmitting}
        onOk={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      >
        <p>
          {t('personalOptions.delete.body', { name: confirmState?.option.name ?? '' })}
        </p>
      </Modal>
    </div>
  )
}
