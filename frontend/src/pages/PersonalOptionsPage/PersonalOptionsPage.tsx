import { faBoxArchive, faBroom, faMagnifyingGlass, faPenToSquare, faPlus, faRotateLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
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
import styles from './PersonalOptionsPage.module.css'

const { Title } = Typography

type ManagedOptionConfirmState =
  | { kind: 'delete'; option: RaceTypeOption }
  | { kind: 'detach-delete'; option: RaceTypeOption }
  | null

const OPTION_CONFIG: Record<ManagedRaceOptionType, {
  title: string
  singularLabel: string
  description: string
  emptyLabel: string
  inputPlaceholder: string
}> = {
  'race-types': {
    title: 'Race types',
    singularLabel: 'race type',
    description: 'Define the race categories you want to reuse across your races and best-effort analysis.',
    emptyLabel: 'No race types created yet.',
    inputPlaceholder: 'Type the race type name here',
  },
  teams: {
    title: 'Teams',
    singularLabel: 'team',
    description: 'Keep your teams ready so they are always available when creating or editing races.',
    emptyLabel: 'No teams created yet.',
    inputPlaceholder: 'Type the team name here',
  },
  circuits: {
    title: 'Circuits',
    singularLabel: 'circuit',
    description: 'Store the circuits or championships you use often.',
    emptyLabel: 'No circuits created yet.',
    inputPlaceholder: 'Type the circuit name here',
  },
  shoes: {
    title: 'Shoes',
    singularLabel: 'shoe',
    description: 'Manage the shoes you want to assign to race results.',
    emptyLabel: 'No shoes created yet.',
    inputPlaceholder: 'Type the shoe name here',
  },
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
  const config = OPTION_CONFIG[activeType]
  const deferredSearch = useDeferredValue(search)
  const visibleOptions = useMemo(
    () => options.filter((option) => {
      if (!showArchived && option.archived) {
        return false
      }

      if (!showDefaultFromRitma && option.isDefault) {
        return false
      }

      if (deferredSearch.trim()) {
        return option.name.toLowerCase().includes(deferredSearch.trim().toLowerCase())
      }

      return true
    }),
    [deferredSearch, options, showArchived, showDefaultFromRitma],
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
        setError(loadError instanceof Error ? loadError.message : 'Could not load your personal options right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOptions()
  }, [activeType, token])

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
      setError(saveError instanceof Error ? saveError.message : `Could not save this ${config.singularLabel} right now.`)
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
      setError(deleteError instanceof Error ? deleteError.message : `Could not delete this ${config.singularLabel} right now.`)
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
      setError(archiveError instanceof Error ? archiveError.message : `Could not update this ${config.singularLabel} right now.`)
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
      setError(deleteError instanceof Error ? deleteError.message : `Could not delete this ${config.singularLabel} right now.`)
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
      setError(deleteError instanceof Error ? deleteError.message : `Could not delete this ${config.singularLabel} right now.`)
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
            {`Add ${config.singularLabel}`}
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
                message={`Could not manage ${config.title.toLowerCase()}`}
                description={error}
                style={{ marginBottom: 18 }}
              />
            ) : null}

            {isLoading ? (
              <div className={styles.loadingState}>
                <Space size="middle">
                  <Spin />
                  <span className={styles.loadingText}>Loading {config.title.toLowerCase()}</span>
                </Space>
              </div>
            ) : visibleOptions.length === 0 ? (
              <div className={styles.emptyWrap}>
                <Empty description={hasActiveFilters ? `No ${config.title.toLowerCase()} match the selected filters.` : config.emptyLabel} />
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
                        <span className={styles.optionName}>{option.name}</span>
                        {option.archived ? <span className={styles.archivedBadge}>Archived</span> : null}
                      </div>
                      {activeType === 'race-types' ? (
                        <div className={styles.optionMetaRow}>
                          <span className={styles.optionMeta}>
                            {option.targetKm != null ? `${option.targetKm.toFixed(2)} km` : 'No target km set'}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {option.isDefault ? (
                      <div className={styles.optionActions}>
                        <span className={styles.defaultOptionBadge}>Default from RITMA</span>
                      </div>
                    ) : (
                      <div className={styles.optionActions}>
                        <Button
                          type="text"
                          icon={<FontAwesomeIcon icon={option.archived ? faRotateLeft : faBoxArchive} />}
                          onClick={() => void handleToggleArchived(option, !option.archived)}
                        >
                          {option.archived ? 'Restore' : 'Archive'}
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
                          Edit
                        </Button>
                        <Button
                          type="text"
                          danger
                          icon={<FontAwesomeIcon icon={faTrashCan} />}
                          onClick={() => void handleDelete(option)}
                        >
                          Delete
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
              <h3 className={styles.sidebarTitle}>Filters</h3>
              {hasActiveFilters ? (
                <Button
                  type="text"
                  className={styles.clearButton}
                  icon={<FontAwesomeIcon icon={faBroom} />}
                  title="Clear filters"
                  aria-label="Clear filters"
                  onClick={handleClearFilters}
                />
              ) : null}
            </div>

            <div className={styles.sidebarDivider} />

            <label className={styles.filterField}>
              <span className={styles.filterLabel}>Search</span>
              <Input
                allowClear
                className={styles.searchInput}
                value={search}
                placeholder={`Search ${config.title.toLowerCase()} by name`}
                suffix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Visibility</span>
              <label className={styles.checkboxRow}>
                <Checkbox checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
                <span>Show archived</span>
              </label>
            </div>

            <div className={styles.filterField}>
              <span className={styles.filterLabel}>Source</span>
              <label className={styles.checkboxRow}>
                <Checkbox checked={showDefaultFromRitma} onChange={(event) => setShowDefaultFromRitma(event.target.checked)} />
                <span>Default from RITMA</span>
              </label>
            </div>
          </div>
        </aside>
      </div>

      <Drawer
        title={editingOptionId ? `Edit ${config.singularLabel}` : `Add ${config.singularLabel}`}
        placement="right"
        width={460}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        destroyOnHidden
        extra={(
          <Space>
            <Button onClick={handleCloseEditor}>Cancel</Button>
            <Button
              type="primary"
              className={styles.saveButton}
              loading={isSubmitting}
              disabled={!optionName.trim() || (activeType === 'race-types' && targetKm == null)}
              onClick={() => void handleSave()}
            >
              {editingOptionId ? 'Save changes' : 'Add'}
            </Button>
          </Space>
        )}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message={`Could not save this ${config.singularLabel}`}
            description={error}
            style={{ marginBottom: 18 }}
          />
        ) : null}

        <div className={styles.drawerForm}>
          <label className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>
              <span className={styles.requiredMark} aria-hidden="true">*</span>
              <span>Name</span>
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
                <span>Target km</span>
                <Tooltip title="Expected distance for this race type. It is used to group races correctly and power best-effort rankings.">
                  <span className={styles.infoIcon} aria-label="Target km info">i</span>
                </Tooltip>
              </span>
              <InputNumber
                min={0}
                max={9999.99}
                precision={2}
                step={0.01}
                className={styles.targetInput}
                placeholder="Target km"
                value={targetKm ?? undefined}
                parser={(value) => parseDecimalNumberInput(value)}
                onChange={(value) => setTargetKm(typeof value === 'number' ? value : null)}
              />
            </label>
          ) : null}
        </div>
      </Drawer>

      <Modal
        title="Discard changes?"
        open={isDiscardModalOpen}
        okText="Discard"
        cancelText="Keep editing"
        okButtonProps={{ danger: true }}
        onOk={resetEditorState}
        onCancel={() => setIsDiscardModalOpen(false)}
      >
        <p>You have unsaved changes. If you leave now, the information you entered will be lost.</p>
      </Modal>

      <Modal
        title="Remove associations and delete?"
        open={usage != null && pendingDeleteOption != null}
        okText="Remove and delete"
        cancelText="Cancel"
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
            <strong>Used in {usage?.usageCount ?? 0} record{usage?.usageCount === 1 ? '' : 's'}</strong>
            <span>
              This {config.singularLabel} is already attached to existing races. You can remove those links and delete it.
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
        title={confirmState?.kind === 'detach-delete' ? 'Remove associations and delete?' : 'Delete option?'}
        open={confirmState?.kind === 'delete'}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        confirmLoading={isSubmitting}
        onOk={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      >
        <p>
          {`Delete "${confirmState?.option.name ?? ''}"? This action cannot be undone.`}
        </p>
      </Modal>
    </div>
  )
}
