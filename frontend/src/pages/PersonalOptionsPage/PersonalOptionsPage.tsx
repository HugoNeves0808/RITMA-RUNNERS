import { faPenToSquare, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Drawer, Empty, Input, InputNumber, Modal, Space, Spin, Tooltip, Typography } from 'antd'
import { useAuth } from '../../features/auth'
import {
  createManagedRaceOption,
  deleteManagedRaceOption,
  detachManagedRaceOptionUsage,
  fetchManagedRaceOptionUsage,
  fetchRaceCreateOptions,
  updateManagedRaceOption,
  type ManagedRaceOptionType,
  type RaceCreateOptions,
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

const EMPTY_OPTIONS: RaceCreateOptions = {
  raceTypes: [],
  teams: [],
  circuits: [],
  shoes: [],
}

function normalizeDecimalInput(value: string | number | undefined) {
  if (value == null) {
    return ''
  }

  return String(value).replace(',', '.')
}

function getOptionsForType(options: RaceCreateOptions, optionType: ManagedRaceOptionType) {
  switch (optionType) {
    case 'race-types':
      return options.raceTypes
    case 'teams':
      return options.teams
    case 'circuits':
      return options.circuits
    case 'shoes':
      return options.shoes
    default:
      return []
  }
}

function replaceOptionsForType(
  options: RaceCreateOptions,
  optionType: ManagedRaceOptionType,
  nextValues: RaceTypeOption[],
) {
  return {
    ...options,
    raceTypes: optionType === 'race-types' ? nextValues : options.raceTypes,
    teams: optionType === 'teams' ? nextValues : options.teams,
    circuits: optionType === 'circuits' ? nextValues : options.circuits,
    shoes: optionType === 'shoes' ? nextValues : options.shoes,
  }
}

type PersonalOptionsPageProps = {
  optionType: ManagedRaceOptionType
}

export function PersonalOptionsPage({ optionType }: PersonalOptionsPageProps) {
  const { token } = useAuth()
  const [options, setOptions] = useState<RaceCreateOptions>(EMPTY_OPTIONS)
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

  const activeType = optionType
  const config = OPTION_CONFIG[activeType]
  const activeOptions = useMemo(
    () => getOptionsForType(options, activeType),
    [activeType, options],
  )

  useEffect(() => {
    const loadOptions = async () => {
      if (!token) {
        setOptions(EMPTY_OPTIONS)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const payload = await fetchRaceCreateOptions(token)
        setOptions(payload)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load your personal options right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadOptions()
  }, [token])

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
  }, [activeType])

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
        ? activeOptions.map((option) => (option.id === savedOption.id ? savedOption : option))
        : [...activeOptions, savedOption]

      setOptions((current) => replaceOptionsForType(
        current,
        activeType,
        nextOptions.sort((left, right) => left.name.localeCompare(right.name)),
      ))

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

      setOptions((current) => replaceOptionsForType(
        current,
        activeType,
        getOptionsForType(current, activeType).filter((option) => option.id !== confirmState.option.id),
      ))

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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Title level={1} className={styles.pageTitle}>{config.title}</Title>
        </div>
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

        {usage && pendingDeleteOption ? (
          <div className={styles.usageCard}>
            <div className={styles.usageHeader}>
              <strong>Used in {usage.usageCount} record{usage.usageCount === 1 ? '' : 's'}</strong>
              <span>
                This {config.singularLabel} is already attached to existing races. You can remove those links and delete it.
              </span>
            </div>

            <div className={styles.usageList}>
              {usage.records.map((record) => (
                <div key={`${record.contextLabel}-${record.raceId}`} className={styles.usageRow}>
                  <span className={styles.usageRaceName}>{record.raceName}</span>
                  <span className={styles.usageContext}>{record.contextLabel}</span>
                </div>
              ))}
            </div>

            <Space>
              <Button
                onClick={() => {
                  setUsage(null)
                  setPendingDeleteOption(null)
                }}
              >
                Cancel
              </Button>
              <Button
                danger
                loading={isSubmitting}
                onClick={() => setConfirmState({ kind: 'detach-delete', option: pendingDeleteOption })}
              >
                Remove links and delete
              </Button>
            </Space>
          </div>
        ) : null}

        {isLoading ? (
          <div className={styles.loadingState}>
            <Spin />
            <span>Loading {config.title.toLowerCase()}</span>
          </div>
        ) : activeOptions.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description={config.emptyLabel} />
          </div>
        ) : (
          <div className={styles.optionList}>
            {activeOptions.map((option) => (
              <div key={option.id} className={styles.optionRow}>
                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>{option.name}</span>
                  {activeType === 'race-types' ? (
                    <span className={styles.optionMeta}>
                      {option.targetKm != null ? `${option.targetKm.toFixed(2)} km` : 'No target km set'}
                    </span>
                  ) : (
                    <span className={styles.optionMeta}>Reusable in your race forms</span>
                  )}
                </div>

                <div className={styles.optionActions}>
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
              </div>
            ))}
          </div>
        )}
      </Card>

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
            <span className={styles.fieldLabel}>Name</span>
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
                parser={(value) => Number(normalizeDecimalInput(value))}
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
        title={confirmState?.kind === 'detach-delete' ? 'Remove associations and delete?' : 'Delete option?'}
        open={confirmState != null}
        okText={confirmState?.kind === 'detach-delete' ? 'Remove and delete' : 'Delete'}
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        confirmLoading={isSubmitting}
        onOk={() => void handleConfirmDelete()}
        onCancel={() => setConfirmState(null)}
      >
        <p>
          {confirmState?.kind === 'detach-delete'
            ? `This will remove "${confirmState.option.name}" from the linked records and then delete it.`
            : `Delete "${confirmState?.option.name ?? ''}"? This action cannot be undone.`}
        </p>
      </Modal>
    </div>
  )
}
