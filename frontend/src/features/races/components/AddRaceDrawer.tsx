import { faPenToSquare, faPlus, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tabs,
  TimePicker,
  Tooltip,
} from 'antd'
import { useAuth } from '../../auth'
import {
  createManagedRaceOption,
  createRace,
  deleteManagedRaceOption,
  detachManagedRaceOptionUsage,
  fetchManagedRaceOptions,
  fetchManagedRaceOptionUsage,
  updateRaceTableItem,
  updateManagedRaceOption,
} from '../services/racesTableService'
import {
  getRaceStatusColor,
  RACE_STATUS_OPTIONS,
} from '../types/raceFilters'
import type {
  ManagedRaceOptionType,
  RaceCreateOptions,
  CreateRacePayload,
  RaceDetailResponse,
  RaceOptionUsage,
  RaceTypeOption,
} from '../types/racesTable'
import styles from './AddRaceDrawer.module.css'

const { TextArea } = Input

type AddRaceDrawerProps = {
  createOptions: RaceCreateOptions
  onCreated: () => void | Promise<void>
  onCreateOptionsChange?: (nextOptions: RaceCreateOptions) => void
  mode?: 'create' | 'edit'
  triggerLabel?: string
  open?: boolean
  raceId?: string | null
  initialRace?: RaceDetailResponse | null
  onClose?: () => void
}

type ManagedOptionConfirmState =
  | { kind: 'delete'; optionType: ManagedRaceOptionType; option: RaceTypeOption }
  | { kind: 'detach-delete'; optionType: ManagedRaceOptionType; option: RaceTypeOption }
  | null

type AddRaceFormValues = {
  raceStatus: string
  raceDate?: dayjs.Dayjs
  raceTime?: dayjs.Dayjs
  name: string
  location?: string
  teamId?: string
  circuitId?: string
  raceTypeId?: string
  realKm?: number
  elevation?: number
  isValidForCategoryRanking?: boolean
  officialTime?: string
  chipTime?: string
  pacePerKm?: string
  shoeId?: string
  generalClassification?: number
  isGeneralClassificationPodium?: boolean
  ageGroupClassification?: number
  isAgeGroupClassificationPodium?: boolean
  teamClassification?: number
  isTeamClassificationPodium?: boolean
  preRaceConfidence?: string
  raceDifficulty?: string
  finalSatisfaction?: string
  painInjuries?: string
  analysisNotes?: string
  wouldRepeatThisRace?: boolean
}

type DrawerInitialValues = Partial<AddRaceFormValues>

const ANALYSIS_SELECT_OPTIONS = [
  { value: 'VERY_LOW', label: 'Very low' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'VERY_HIGH', label: 'Very high' },
]

const INITIAL_FORM_VALUES: Partial<AddRaceFormValues> = {
  isValidForCategoryRanking: true,
  isGeneralClassificationPodium: false,
  isAgeGroupClassificationPodium: false,
  isTeamClassificationPodium: false,
}

const CREATE_RACE_STATUS_ORDER = [
  'IN_LIST',
  'NOT_REGISTERED',
  'REGISTERED',
  'COMPLETED',
  'DID_NOT_START',
  'DID_NOT_FINISH',
  'CANCELLED',
] as const

const CREATE_RACE_STATUS_OPTIONS = RACE_STATUS_OPTIONS
  .filter((status) => status.value !== 'IN_LIST_WITHOUT_DATE')
  .map((status) => ({
    ...status,
    label: status.value === 'IN_LIST' ? 'In List' : status.label,
  }))
  .sort((left, right) => CREATE_RACE_STATUS_ORDER.indexOf(left.value as typeof CREATE_RACE_STATUS_ORDER[number]) - CREATE_RACE_STATUS_ORDER.indexOf(right.value as typeof CREATE_RACE_STATUS_ORDER[number]))

const MANAGED_OPTION_CONFIG: Record<ManagedRaceOptionType, {
  title: string
  singularLabel: string
  placeholder: string
  emptyLabel: string
}> = {
  'race-types': {
    title: 'Race types',
    singularLabel: 'race type',
    placeholder: 'Select race type',
    emptyLabel: 'No race types available.',
  },
  teams: {
    title: 'Teams',
    singularLabel: 'team',
    placeholder: 'Select team',
    emptyLabel: 'No teams available.',
  },
  circuits: {
    title: 'Circuits',
    singularLabel: 'circuit',
    placeholder: 'Select circuit',
    emptyLabel: 'No circuits available.',
  },
  shoes: {
    title: 'Shoes',
    singularLabel: 'shoe',
    placeholder: 'Select shoe',
    emptyLabel: 'No shoes available.',
  },
}

const FIELD_OPTION_TYPES: Record<'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId', ManagedRaceOptionType> = {
  raceTypeId: 'race-types',
  teamId: 'teams',
  circuitId: 'circuits',
  shoeId: 'shoes',
}

const FIELD_ERROR_PATTERNS: Array<{ pattern: RegExp; field: keyof AddRaceFormValues }> = [
  { pattern: /race status/i, field: 'raceStatus' },
  { pattern: /race date/i, field: 'raceDate' },
  { pattern: /race name|^name /i, field: 'name' },
  { pattern: /location/i, field: 'location' },
  { pattern: /team/i, field: 'teamId' },
  { pattern: /circuit/i, field: 'circuitId' },
  { pattern: /invalid race type|race type/i, field: 'raceTypeId' },
  { pattern: /distance|real km/i, field: 'realKm' },
  { pattern: /elevation/i, field: 'elevation' },
  { pattern: /official time/i, field: 'officialTime' },
  { pattern: /chip time/i, field: 'chipTime' },
  { pattern: /pace/i, field: 'pacePerKm' },
  { pattern: /shoe/i, field: 'shoeId' },
  { pattern: /general classification/i, field: 'generalClassification' },
  { pattern: /age group classification/i, field: 'ageGroupClassification' },
  { pattern: /team classification/i, field: 'teamClassification' },
  { pattern: /pre-race confidence/i, field: 'preRaceConfidence' },
  { pattern: /race difficulty/i, field: 'raceDifficulty' },
  { pattern: /final satisfaction/i, field: 'finalSatisfaction' },
]

function parseTimeToSeconds(value: string | undefined, mode: 'duration' | 'pace', fieldLabel?: string) {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (mode === 'duration' && parts.length === 3) {
    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error(`${fieldLabel ?? 'Time'} must use HH:MM:SS.`)
    }

    if (hours > 23 || minutes > 59 || seconds > 59) {
      throw new Error(`${fieldLabel ?? 'Time'} must use valid HH:MM:SS values.`)
    }

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (mode === 'pace' && parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error(`${fieldLabel ?? 'Pace'} must use MM:SS.`)
    }

    if (minutes > 59 || seconds > 59) {
      throw new Error(`${fieldLabel ?? 'Pace'} must use valid MM:SS values.`)
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration'
    ? `${fieldLabel ?? 'Time'} must use HH:MM:SS.`
    : `${fieldLabel ?? 'Pace'} must use MM:SS.`)
}

function formatDigitTimeInput(rawValue: string | undefined, mode: 'duration' | 'pace') {
  const digits = (rawValue ?? '').replace(/\D/g, '')
  const maxDigits = mode === 'duration' ? 6 : 4
  const trimmedDigits = digits.slice(0, maxDigits)

  if (mode === 'duration') {
    if (trimmedDigits.length <= 2) {
      return trimmedDigits
    }

    if (trimmedDigits.length <= 4) {
      return `${trimmedDigits.slice(0, 2)}:${trimmedDigits.slice(2)}`
    }

    return `${trimmedDigits.slice(0, 2)}:${trimmedDigits.slice(2, 4)}:${trimmedDigits.slice(4)}`
  }

  if (trimmedDigits.length <= 2) {
    return trimmedDigits
  }

  return `${trimmedDigits.slice(0, 2)}:${trimmedDigits.slice(2)}`
}

function normalizeClassificationPodium(value: number | null | undefined) {
  return value != null && value >= 1 && value <= 3
}

function isRaceDateRequired(raceStatus: string | undefined) {
  return (raceStatus ?? '').trim().toUpperCase() !== 'IN_LIST'
}

function normalizeRaceStatus(raceStatus: string | undefined) {
  return (raceStatus ?? '').trim().toUpperCase()
}

function isCompletedStatus(raceStatus: string | undefined) {
  return normalizeRaceStatus(raceStatus) === 'COMPLETED'
}

function isDnsStatus(raceStatus: string | undefined) {
  return normalizeRaceStatus(raceStatus) === 'DID_NOT_START'
}

function isDnfStatus(raceStatus: string | undefined) {
  return normalizeRaceStatus(raceStatus) === 'DID_NOT_FINISH'
}

function shouldShowDistanceFields(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus) || isDnfStatus(raceStatus)
}

function shouldShowRankingValidityField(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus)
}

function shouldShowResultsTab(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus)
}

function shouldShowAnalysisTab(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus) || isDnfStatus(raceStatus) || isDnsStatus(raceStatus)
}

function shouldShowShoeInRaceData(raceStatus: string | undefined) {
  return isDnfStatus(raceStatus)
}

function shouldShowPreRaceConfidence(raceStatus: string | undefined) {
  return shouldShowAnalysisTab(raceStatus)
}

function shouldShowRaceDifficulty(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus) || isDnfStatus(raceStatus)
}

function shouldShowFinalSatisfaction(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus) || isDnfStatus(raceStatus)
}

function shouldShowPainInjuries(raceStatus: string | undefined) {
  return shouldShowAnalysisTab(raceStatus)
}

function shouldShowWouldRepeatThisRace(raceStatus: string | undefined) {
  return isCompletedStatus(raceStatus) || isDnfStatus(raceStatus)
}

function formatSecondsAsPace(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDurationInput(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return undefined
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatPaceInput(totalSeconds: number | null | undefined) {
  if (totalSeconds == null) {
    return undefined
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getLiveTimeFieldError(
  value: string | undefined,
  mode: 'duration' | 'pace',
  fieldLabel: string,
) {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (parts.some((part) => part.length === 0 || Number.isNaN(Number(part)))) {
    return mode === 'duration'
      ? `${fieldLabel} must use HH:MM:SS.`
      : `${fieldLabel} must use MM:SS.`
  }

  if (mode === 'duration') {
    if (parts.length !== 3) {
      return null
    }

    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    return hours > 23 || minutes > 59 || seconds > 59
      ? `${fieldLabel} must use valid HH:MM:SS values.`
      : null
  }

  if (parts.length !== 2) {
    return null
  }

  const [minutes, seconds] = parts.map((part) => Number(part))
  return minutes > 59 || seconds > 59
    ? `${fieldLabel} must use valid MM:SS values.`
    : null
}

function getFieldNameFromError(message: string): keyof AddRaceFormValues | null {
  const matchedEntry = FIELD_ERROR_PATTERNS.find((entry) => entry.pattern.test(message))
  return matchedEntry?.field ?? null
}

function normalizeValue(value: unknown): unknown {
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.toISOString() : null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return value ?? null
}

function hasUnsavedChanges(values: AddRaceFormValues, initialValues: DrawerInitialValues) {
  const allKeys = new Set([
    ...Object.keys(initialValues),
    ...Object.keys(values),
  ])

  return Array.from(allKeys).some((key) => {
    const currentValue = normalizeValue(values[key as keyof AddRaceFormValues])
    const initialValue = normalizeValue(initialValues[key as keyof AddRaceFormValues])
    return currentValue !== initialValue
  })
}

function buildDrawerInitialValues(race: RaceDetailResponse | null | undefined): DrawerInitialValues {
  if (!race) {
    return INITIAL_FORM_VALUES
  }

  return {
    raceStatus: race.race.raceStatus ?? 'REGISTERED',
    raceDate: race.race.raceDate ? dayjs(race.race.raceDate) : undefined,
    raceTime: race.race.raceTime ? dayjs(`2000-01-01T${race.race.raceTime}`) : undefined,
    name: race.race.name,
    location: race.race.location ?? undefined,
    teamId: race.race.teamId ?? undefined,
    circuitId: race.race.circuitId ?? undefined,
    raceTypeId: race.race.raceTypeId ?? undefined,
    realKm: race.race.realKm ?? undefined,
    elevation: race.race.elevation ?? undefined,
    isValidForCategoryRanking: race.race.isValidForCategoryRanking ?? true,
    officialTime: formatDurationInput(race.results.officialTimeSeconds),
    chipTime: formatDurationInput(race.results.chipTimeSeconds),
    pacePerKm: formatPaceInput(race.results.pacePerKmSeconds),
    shoeId: race.results.shoeId ?? undefined,
    generalClassification: race.results.generalClassification ?? undefined,
    isGeneralClassificationPodium: race.results.isGeneralClassificationPodium ?? false,
    ageGroupClassification: race.results.ageGroupClassification ?? undefined,
    isAgeGroupClassificationPodium: race.results.isAgeGroupClassificationPodium ?? false,
    teamClassification: race.results.teamClassification ?? undefined,
    isTeamClassificationPodium: race.results.isTeamClassificationPodium ?? false,
    preRaceConfidence: race.analysis.preRaceConfidence ?? undefined,
    raceDifficulty: race.analysis.raceDifficulty ?? undefined,
    finalSatisfaction: race.analysis.finalSatisfaction ?? undefined,
    painInjuries: race.analysis.painInjuries ?? undefined,
    analysisNotes: race.analysis.analysisNotes ?? undefined,
    wouldRepeatThisRace: race.analysis.wouldRepeatThisRace ?? false,
  }
}

function buildRacePayload(values: AddRaceFormValues, fallbackRace?: RaceDetailResponse | null): CreateRacePayload {
  const normalizedStatus = normalizeRaceStatus(values.raceStatus)
  const showDistanceFields = shouldShowDistanceFields(normalizedStatus)
  const showResultsTab = shouldShowResultsTab(normalizedStatus)
  const showAnalysisTab = shouldShowAnalysisTab(normalizedStatus)
  const officialTimeSeconds = showResultsTab ? parseTimeToSeconds(values.officialTime, 'duration', 'Official time') : null
  const chipTimeSeconds = showResultsTab ? parseTimeToSeconds(values.chipTime, 'duration', 'Chip time') : null
  const pacePerKmSeconds = showResultsTab ? parseTimeToSeconds(values.pacePerKm, 'pace', 'Pace per KM') : null
  const effectiveRaceDate = values.raceDate
    ?? (normalizedStatus !== 'IN_LIST' && fallbackRace?.race.raceDate ? dayjs(fallbackRace.race.raceDate) : undefined)

  return {
    race: {
      raceStatus: values.raceStatus,
      raceDate: effectiveRaceDate ? effectiveRaceDate.format('YYYY-MM-DD') : null,
      raceTime: values.raceTime ? values.raceTime.format('HH:mm:ss') : null,
      name: values.name.trim(),
      location: values.location?.trim() ? values.location.trim() : null,
      teamId: values.teamId ?? null,
      circuitId: values.circuitId ?? null,
      raceTypeId: values.raceTypeId ?? null,
      realKm: showDistanceFields ? (values.realKm ?? null) : null,
      elevation: showDistanceFields ? (values.elevation ?? null) : null,
      isValidForCategoryRanking: shouldShowRankingValidityField(normalizedStatus)
        ? (values.isValidForCategoryRanking ?? true)
        : false,
    },
    results: {
      officialTimeSeconds,
      chipTimeSeconds,
      pacePerKmSeconds,
      shoeId: showResultsTab || shouldShowShoeInRaceData(normalizedStatus) ? (values.shoeId ?? null) : null,
      generalClassification: showResultsTab ? (values.generalClassification ?? null) : null,
      isGeneralClassificationPodium: showResultsTab ? (values.isGeneralClassificationPodium ?? false) : false,
      ageGroupClassification: showResultsTab ? (values.ageGroupClassification ?? null) : null,
      isAgeGroupClassificationPodium: showResultsTab ? (values.isAgeGroupClassificationPodium ?? false) : false,
      teamClassification: showResultsTab ? (values.teamClassification ?? null) : null,
      isTeamClassificationPodium: showResultsTab ? (values.isTeamClassificationPodium ?? false) : false,
    },
    analysis: {
      preRaceConfidence: showAnalysisTab && shouldShowPreRaceConfidence(normalizedStatus) ? (values.preRaceConfidence ?? null) : null,
      raceDifficulty: showAnalysisTab && shouldShowRaceDifficulty(normalizedStatus) ? (values.raceDifficulty ?? null) : null,
      finalSatisfaction: showAnalysisTab && shouldShowFinalSatisfaction(normalizedStatus) ? (values.finalSatisfaction ?? null) : null,
      painInjuries: showAnalysisTab && shouldShowPainInjuries(normalizedStatus) && values.painInjuries?.trim()
        ? values.painInjuries.trim()
        : null,
      analysisNotes: showAnalysisTab && values.analysisNotes?.trim() ? values.analysisNotes.trim() : null,
      wouldRepeatThisRace: showAnalysisTab && shouldShowWouldRepeatThisRace(normalizedStatus) ? (values.wouldRepeatThisRace ?? null) : null,
    },
  }
}

function renderInfoLabel(label: string, description: string) {
  return (
    <span className={styles.fieldLabelWrap}>
      <span>{label}</span>
      <Tooltip title={description}>
        <span className={styles.infoIcon} aria-label={`${label} info`}>
          i
        </span>
      </Tooltip>
    </span>
  )
}

function getRaceStatusGuidance(raceStatus: string | undefined) {
  if (isCompletedStatus(raceStatus)) {
    return 'Completed unlocks the full race form, including results and post-race analysis.'
  }

  if (isDnfStatus(raceStatus)) {
    return 'Did not finish keeps race context and analysis visible, but hides final result fields.'
  }

  if (isDnsStatus(raceStatus)) {
    return 'Did not start keeps the race details and notes, without showing result fields.'
  }

  if (normalizeRaceStatus(raceStatus) === 'IN_LIST') {
    return 'In list keeps this entry lightweight while you are only tracking the race plan.'
  }

  return ''
}

export function AddRaceDrawer({
  createOptions,
  onCreated,
  onCreateOptionsChange,
  mode = 'create',
  triggerLabel = 'Add Race',
  open,
  raceId = null,
  initialRace = null,
  onClose,
}: AddRaceDrawerProps) {
  const { token } = useAuth()
  const [form] = Form.useForm<AddRaceFormValues>()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localCreateOptions, setLocalCreateOptions] = useState<RaceCreateOptions>(createOptions)
  const [isManageOptionsModalOpen, setIsManageOptionsModalOpen] = useState(false)
  const [managedOptionType, setManagedOptionType] = useState<ManagedRaceOptionType>('race-types')
  const [managedOptionName, setManagedOptionName] = useState('')
  const [managedOptionTargetKm, setManagedOptionTargetKm] = useState<number | null>(null)
  const [editingManagedOptionId, setEditingManagedOptionId] = useState<string | null>(null)
  const [managedOptionError, setManagedOptionError] = useState<string | null>(null)
  const [isManagedOptionSubmitting, setIsManagedOptionSubmitting] = useState(false)
  const [isManagedOptionLoading, setIsManagedOptionLoading] = useState(false)
  const [managedOptionUsage, setManagedOptionUsage] = useState<RaceOptionUsage | null>(null)
  const [pendingDeleteOption, setPendingDeleteOption] = useState<RaceTypeOption | null>(null)
  const [managedOptionConfirmState, setManagedOptionConfirmState] = useState<ManagedOptionConfirmState>(null)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const initialFormValues = useMemo(() => buildDrawerInitialValues(initialRace), [initialRace])
  const isEditMode = mode === 'edit'
  const currentRaceStatus = Form.useWatch('raceStatus', form) ?? initialFormValues.raceStatus
  const hasSelectedStatus = isEditMode || Boolean(currentRaceStatus)
  const showDistanceFields = shouldShowDistanceFields(currentRaceStatus)
  const showRankingValidityField = shouldShowRankingValidityField(currentRaceStatus)
  const showResultsTab = shouldShowResultsTab(currentRaceStatus)
  const showAnalysisTab = shouldShowAnalysisTab(currentRaceStatus)
  const showShoeInRaceData = shouldShowShoeInRaceData(currentRaceStatus)
  const showPreRaceConfidence = shouldShowPreRaceConfidence(currentRaceStatus)
  const showRaceDifficulty = shouldShowRaceDifficulty(currentRaceStatus)
  const showFinalSatisfaction = shouldShowFinalSatisfaction(currentRaceStatus)
  const showPainInjuries = shouldShowPainInjuries(currentRaceStatus)
  const showWouldRepeatThisRace = shouldShowWouldRepeatThisRace(currentRaceStatus)

  useEffect(() => {
    setLocalCreateOptions(createOptions)
  }, [createOptions])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    form.resetFields()
    form.setFieldsValue(initialFormValues)
    setError(null)
  }, [form, initialFormValues, isOpen])

  const syncCreateOptions = (nextOptions: RaceCreateOptions) => {
    setLocalCreateOptions(nextOptions)
    onCreateOptionsChange?.(nextOptions)
  }

  const getOptionsForType = (optionType: ManagedRaceOptionType) => {
    switch (optionType) {
      case 'race-types':
        return localCreateOptions.raceTypes
      case 'teams':
        return localCreateOptions.teams
      case 'circuits':
        return localCreateOptions.circuits
      case 'shoes':
        return localCreateOptions.shoes
      default:
        return []
    }
  }

  const replaceOptionsForType = (optionType: ManagedRaceOptionType, nextValues: RaceTypeOption[]) => {
    const nextOptions: RaceCreateOptions = {
      ...localCreateOptions,
      raceTypes: optionType === 'race-types' ? nextValues : localCreateOptions.raceTypes,
      teams: optionType === 'teams' ? nextValues : localCreateOptions.teams,
      circuits: optionType === 'circuits' ? nextValues : localCreateOptions.circuits,
      shoes: optionType === 'shoes' ? nextValues : localCreateOptions.shoes,
    }
    syncCreateOptions(nextOptions)
  }

  const resetManagedOptionState = () => {
    setManagedOptionName('')
    setManagedOptionTargetKm(null)
    setEditingManagedOptionId(null)
    setManagedOptionError(null)
    setManagedOptionUsage(null)
    setPendingDeleteOption(null)
    setManagedOptionConfirmState(null)
    setIsManagedOptionSubmitting(false)
  }

  const openManageOptionsModal = async (optionType: ManagedRaceOptionType, optionToEdit?: RaceTypeOption) => {
    setManagedOptionType(optionType)
    setManagedOptionName(optionToEdit?.name ?? '')
    setManagedOptionTargetKm(optionType === 'race-types' ? (optionToEdit?.targetKm ?? null) : null)
    setEditingManagedOptionId(optionToEdit?.id ?? null)
    setManagedOptionError(null)
    setIsManageOptionsModalOpen(true)

    if (!token) {
      return
    }

    try {
      setIsManagedOptionLoading(true)
      const latestOptions = await fetchManagedRaceOptions(optionType, token)
      replaceOptionsForType(optionType, latestOptions)
    } catch (loadError) {
      setManagedOptionError(loadError instanceof Error ? loadError.message : 'Could not load these options right now.')
    } finally {
      setIsManagedOptionLoading(false)
    }
  }

  const closeManageOptionsModal = () => {
    setIsManageOptionsModalOpen(false)
    resetManagedOptionState()
  }

  const clearFieldError = (fieldName: keyof AddRaceFormValues) => {
    form.setFields([{ name: fieldName, errors: [] }])
  }

  const setFieldError = (fieldName: keyof AddRaceFormValues, message: string | null) => {
    form.setFields([{ name: fieldName, errors: message ? [message] : [] }])
  }

  const closeDrawer = () => {
    if (!isControlled) {
      setInternalOpen(false)
    }

    onClose?.()
    setIsDiscardModalOpen(false)
    setError(null)
    closeManageOptionsModal()
    form.resetFields()
    form.setFieldsValue(initialFormValues)
  }

  const handleSaveManagedOption = async () => {
    if (!token) {
      return
    }

    try {
      setIsManagedOptionSubmitting(true)
      setManagedOptionError(null)
      setManagedOptionUsage(null)
      setPendingDeleteOption(null)

      const savedOption = editingManagedOptionId
        ? await updateManagedRaceOption(
          managedOptionType,
          editingManagedOptionId,
          { name: managedOptionName, targetKm: managedOptionType === 'race-types' ? managedOptionTargetKm : undefined },
          token,
        )
        : await createManagedRaceOption(
          managedOptionType,
          { name: managedOptionName, targetKm: managedOptionType === 'race-types' ? managedOptionTargetKm : undefined },
          token,
        )

      const currentOptions = getOptionsForType(managedOptionType)
      const nextOptions = editingManagedOptionId
        ? currentOptions.map((option) => (option.id === savedOption.id ? savedOption : option))
        : [...currentOptions, savedOption].sort((left, right) => left.name.localeCompare(right.name))

      replaceOptionsForType(managedOptionType, nextOptions)

      const linkedField = Object.entries(FIELD_OPTION_TYPES).find(([, value]) => value === managedOptionType)?.[0] as keyof AddRaceFormValues | undefined
      if (linkedField) {
        form.setFieldValue(linkedField, savedOption.id)
      }

      setManagedOptionName('')
      setManagedOptionTargetKm(null)
      setEditingManagedOptionId(null)
    } catch (saveError) {
      setManagedOptionError(saveError instanceof Error ? saveError.message : 'Could not save this option right now.')
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const handleDeleteManagedOption = async (optionType: ManagedRaceOptionType, option: RaceTypeOption) => {
    if (!token) {
      return
    }

    try {
      setManagedOptionError(null)
      setManagedOptionUsage(null)
      setPendingDeleteOption(null)

      const usage = await fetchManagedRaceOptionUsage(optionType, option.id, token)
      if (usage.usageCount > 0) {
        setPendingDeleteOption(option)
        setManagedOptionUsage(usage)
        return
      }

      setManagedOptionConfirmState({ kind: 'delete', optionType, option })
    } catch (deleteError) {
      const nextMessage = deleteError instanceof Error ? deleteError.message : 'Could not delete this option right now.'

      if (/cannot be deleted because it is already being used/i.test(nextMessage)) {
        setPendingDeleteOption(option)
        try {
          const usage = await fetchManagedRaceOptionUsage(optionType, option.id, token)
          setManagedOptionUsage(usage)
          setManagedOptionError(null)
        } catch {
          setManagedOptionUsage(null)
          setManagedOptionError(nextMessage)
        }
      } else {
        setManagedOptionError(nextMessage)
      }
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const handleConfirmManagedOptionAction = async () => {
    if (!token || !managedOptionConfirmState) {
      return
    }

    try {
      setIsManagedOptionSubmitting(true)
      setManagedOptionError(null)
      const { kind, optionType, option } = managedOptionConfirmState

      if (kind === 'detach-delete') {
        await detachManagedRaceOptionUsage(optionType, option.id, token)
      }

      await deleteManagedRaceOption(optionType, option.id, token)

      const nextOptions = getOptionsForType(optionType).filter((currentOption) => currentOption.id !== option.id)
      replaceOptionsForType(managedOptionType, nextOptions)

      const linkedField = Object.entries(FIELD_OPTION_TYPES).find(([, value]) => value === optionType)?.[0] as keyof AddRaceFormValues | undefined
      if (linkedField && form.getFieldValue(linkedField) === option.id) {
        form.setFieldValue(linkedField, undefined)
      }

      if (editingManagedOptionId === option.id) {
        setManagedOptionName('')
        setEditingManagedOptionId(null)
      }

      setManagedOptionUsage(null)
      setPendingDeleteOption(null)
      setManagedOptionConfirmState(null)
    } catch (detachError) {
      setManagedOptionError(detachError instanceof Error ? detachError.message : 'Could not remove this option from the related records.')
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const renderManagedSelect = (
    fieldName: 'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId',
    label: ReactNode,
    optionType: ManagedRaceOptionType,
    className?: string,
  ) => {
    const config = MANAGED_OPTION_CONFIG[optionType]
    const options = getOptionsForType(optionType)

    return (
      <div className={`${styles.managedField} ${className ?? ''}`.trim()}>
        <Form.Item<AddRaceFormValues> label={label}>
          <div className={styles.managedFieldRow}>
            <Form.Item<AddRaceFormValues> name={fieldName} noStyle>
              <Select
                allowClear
                placeholder={config.placeholder}
                options={options.map((option) => ({
                  value: option.id,
                  label: option.name,
                }))}
              />
            </Form.Item>
            <button
              type="button"
              className={styles.addManagedOptionButton}
              onClick={() => void openManageOptionsModal(optionType)}
              aria-label={`Create or manage ${config.title.toLowerCase()}`}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          </div>
        </Form.Item>
      </div>
    )
  }

  const handleClose = () => {
    const values = form.getFieldsValue(true) as AddRaceFormValues
    if (!hasUnsavedChanges(values, initialFormValues)) {
      closeDrawer()
      return
    }

    setIsDiscardModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!token || (isEditMode && !raceId)) {
      return
    }

    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      setError(null)

      const payload = buildRacePayload(values, isEditMode ? initialRace : null)

      if (isEditMode && raceId) {
        await updateRaceTableItem(raceId, payload, token)
      } else {
        await createRace(payload, token)
      }

      closeDrawer()
      await onCreated()
    } catch (submitError) {
      if (submitError instanceof Error && !('errorFields' in submitError)) {
        const fieldName = getFieldNameFromError(submitError.message)
        if (fieldName) {
          form.setFields([{ name: fieldName, errors: [submitError.message] }])
        }
        setError(submitError.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isManagedOptionSaveDisabled = managedOptionName.trim().length === 0 || (managedOptionType === 'race-types' && managedOptionTargetKm == null)

  return (
    <>
      {!isEditMode ? (
        <Button
          type="primary"
          className={styles.trigger}
          icon={<FontAwesomeIcon icon={faPlus} />}
          aria-label={triggerLabel}
          onClick={() => setInternalOpen(true)}
        >
          {triggerLabel}
        </Button>
      ) : null}

      <Drawer
        title={isEditMode ? 'Edit race' : 'Add race'}
        placement="right"
        width={560}
        open={isOpen}
        onClose={handleClose}
        className={styles.drawer}
        destroyOnHidden={false}
        extra={(
          <Space>
            <Button className={styles.cancelButton} onClick={handleClose}>Cancel</Button>
            <Button className={styles.saveButton} type="primary" loading={isSubmitting} onClick={() => void handleSubmit()}>
              {isEditMode ? 'Save changes' : 'Save race'}
            </Button>
          </Space>
        )}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message={isEditMode ? 'Could not update the race' : 'Could not create the race'}
            description={error}
            className={styles.alert}
          />
        ) : null}

        <Form
          form={form}
          layout="vertical"
          initialValues={initialFormValues}
          onValuesChange={(changedValues) => {
            Object.keys(changedValues).forEach((fieldName) => {
              clearFieldError(fieldName as keyof AddRaceFormValues)
            })

            if ('officialTime' in changedValues) {
              setFieldError(
                'officialTime',
                getLiveTimeFieldError(changedValues.officialTime as string | undefined, 'duration', 'Official time'),
              )
            }

            if ('chipTime' in changedValues) {
              setFieldError(
                'chipTime',
                getLiveTimeFieldError(changedValues.chipTime as string | undefined, 'duration', 'Chip time'),
              )
            }

            if ('pacePerKm' in changedValues) {
              setFieldError(
                'pacePerKm',
                getLiveTimeFieldError(changedValues.pacePerKm as string | undefined, 'pace', 'Pace per KM'),
              )
            }

            if ('raceStatus' in changedValues) {
              clearFieldError('raceDate')
              clearFieldError('realKm')
              clearFieldError('chipTime')
              clearFieldError('pacePerKm')
            }

            if ('chipTime' in changedValues || 'realKm' in changedValues) {
              const currentValues = form.getFieldsValue(true) as AddRaceFormValues
              const chipTimeError = getLiveTimeFieldError(currentValues.chipTime, 'duration', 'Chip time')
              const realKmValue = currentValues.realKm

              if (!chipTimeError && currentValues.chipTime && realKmValue != null && realKmValue > 0) {
                try {
                  const chipTimeSeconds = parseTimeToSeconds(currentValues.chipTime, 'duration', 'Chip time')
                  if (chipTimeSeconds != null) {
                    const computedPace = formatSecondsAsPace(Math.round(chipTimeSeconds / realKmValue))
                    if (form.getFieldValue('pacePerKm') !== computedPace) {
                      form.setFieldValue('pacePerKm', computedPace)
                    }
                    setFieldError('pacePerKm', null)
                  }
                } catch {
                  // Keep the field unchanged when the chip time is still incomplete or invalid.
                }
              }
            }
          }}
        >
          <Tabs
            items={[
              {
                key: 'race',
                label: 'Race data',
                children: (
                  <div className={styles.tabPane}>
                    <div className={styles.statusHighlightCard}>
                      <div className={styles.statusHighlightHeader}>
                        <span className={styles.statusHighlightTitle}>
                          <span aria-hidden="true" className={styles.statusHighlightRequired}>*</span>
                          Race status
                        </span>
                      </div>

                      <Form.Item<AddRaceFormValues>
                        name="raceStatus"
                        rules={[{ required: true, message: 'Race status is required.' }]}
                        className={styles.statusHighlightField}
                      >
                        <Select
                          placeholder="Select the race status first"
                          popupClassName={styles.statusSelectDropdown}
                          options={CREATE_RACE_STATUS_OPTIONS.map((status) => ({
                            value: status.value,
                            label: (
                              <span
                                className={styles.statusOption}
                                style={{
                                  color: getRaceStatusColor(status.value),
                                }}
                              >
                                {status.label}
                              </span>
                            ),
                          }))}
                          optionRender={(option) => {
                            const shouldShowDivider = option.data.value === 'COMPLETED' || option.data.value === 'DID_NOT_START'
                            const isCurrentOption = option.data.value === currentRaceStatus

                            return (
                              <div className={styles.statusOptionDropdownRow}>
                                {shouldShowDivider ? <div className={styles.statusOptionDivider} aria-hidden="true" /> : null}
                                <div
                                  className={[
                                    styles.statusOptionDropdownContent,
                                    isCurrentOption ? styles.statusOptionDropdownContentSelected : '',
                                  ].join(' ').trim()}
                                >
                                  {option.data.label}
                                </div>
                              </div>
                            )
                          }}
                        />
                      </Form.Item>

                      {getRaceStatusGuidance(currentRaceStatus) ? (
                        <div className={styles.statusHighlightHint}>
                          <span className={styles.statusHighlightHintIcon} aria-hidden="true">i</span>
                          <span>{getRaceStatusGuidance(currentRaceStatus)}</span>
                        </div>
                      ) : null}
                    </div>

                    {hasSelectedStatus ? (
                      <>
                        <div className={styles.row}>
                          <Form.Item noStyle dependencies={['raceStatus']}>
                            {({ getFieldValue }) => (
                              <Form.Item<AddRaceFormValues>
                                label={(
                                  <>
                                    {isRaceDateRequired(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                    Race date
                                  </>
                                )}
                                name="raceDate"
                                className={styles.rowItem}
                                rules={[
                                  {
                                    validator: (_, value) => (
                                      !isRaceDateRequired(getFieldValue('raceStatus')) || value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('Race date is required.'))
                                    ),
                                  },
                                ]}
                              >
                                <DatePicker format="YYYY-MM-DD" className={styles.fullWidth} />
                              </Form.Item>
                            )}
                          </Form.Item>

                          <Form.Item<AddRaceFormValues>
                            label={renderInfoLabel('Race time', 'Optional start time of the race. Leave empty if it is not confirmed yet.')}
                            name="raceTime"
                            className={styles.rowItem}
                          >
                            <TimePicker use12Hours format="hh:mm A" className={styles.fullWidth} />
                          </Form.Item>
                        </div>

                        <Form.Item<AddRaceFormValues>
                          label="Race name"
                          name="name"
                          rules={[{ required: true, message: 'Race name is required.' }]}
                        >
                          <Input maxLength={150} placeholder="Lisbon Half Marathon" />
                        </Form.Item>

                        <div className={styles.row}>
                          <Form.Item<AddRaceFormValues> label="Location" name="location" className={styles.rowItem}>
                            <Input maxLength={150} placeholder="Lisbon" />
                          </Form.Item>

                          {renderManagedSelect('raceTypeId', 'Race type', 'race-types', styles.rowItem)}
                        </div>

                        <div className={styles.row}>
                          {renderManagedSelect('teamId', renderInfoLabel('Team', 'Optional team linked to this race entry.'), 'teams', styles.rowItem)}

                          {renderManagedSelect('circuitId', renderInfoLabel('Circuit', 'Optional circuit or championship this race belongs to.'), 'circuits', styles.rowItem)}
                        </div>

                        {showDistanceFields ? (
                          <div className={styles.row}>
                            <Form.Item noStyle dependencies={['raceStatus']}>
                              {({ getFieldValue }) => (
                                <Form.Item<AddRaceFormValues>
                                  label={(
                                    <>
                                      {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                      {renderInfoLabel('Real KM', 'Actual race distance in kilometres, using decimals when needed.')}
                                    </>
                                  )}
                                  name="realKm"
                                  className={styles.rowItem}
                                  rules={[
                                    {
                                      validator: (_, value) => (
                                        !isCompletedStatus(getFieldValue('raceStatus')) || value != null
                                          ? Promise.resolve()
                                          : Promise.reject(new Error('Real KM is required when race status is Completed.'))
                                      ),
                                    },
                                  ]}
                                >
                                  <InputNumber min={0} max={999.99} precision={2} step={0.01} className={styles.fullWidth} placeholder="21.10" />
                                </Form.Item>
                              )}
                            </Form.Item>

                            <Form.Item<AddRaceFormValues> label={renderInfoLabel('Elevation', 'Total elevation gain of the race, usually in meters.')} name="elevation" className={styles.rowItem}>
                              <InputNumber min={0} className={styles.fullWidth} placeholder="250" />
                            </Form.Item>
                          </div>
                        ) : null}

                        {showShoeInRaceData
                          ? renderManagedSelect('shoeId', renderInfoLabel('Shoe', 'Optional shoe used in this race attempt.'), 'shoes', styles.rowItem)
                          : null}

                        {showRankingValidityField ? (
                          <Form.Item<AddRaceFormValues> name="isValidForCategoryRanking" valuePropName="checked">
                            <Checkbox>Valid for category ranking</Checkbox>
                          </Form.Item>
                        ) : null}
                      </>
                    ) : (
                      <div className={styles.statusWaitingState}>
                        Choose a race status to unlock the rest of the form.
                      </div>
                    )}
                  </div>
                ),
              },
              ...(showResultsTab ? [{
                key: 'results',
                label: 'Race results',
                children: (
                  <div className={styles.tabPane}>
                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Official time', 'Official finish time published by the event organization.')} name="officialTime" className={styles.rowItem}>
                        <Input
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="00:00:00"
                          onChange={(event) => {
                            form.setFieldValue('officialTime', formatDigitTimeInput(event.target.value, 'duration'))
                          }}
                        />
                      </Form.Item>

                      <Form.Item noStyle dependencies={['raceStatus']}>
                        {({ getFieldValue }) => (
                          <Form.Item<AddRaceFormValues>
                            label={(
                              <>
                                {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                {renderInfoLabel('Chip time', 'Net finish time measured from crossing the start line to crossing the finish line.')}
                              </>
                            )}
                            name="chipTime"
                            className={styles.rowItem}
                            rules={[
                              {
                                validator: (_, value) => (
                                  !isCompletedStatus(getFieldValue('raceStatus')) || String(value ?? '').trim().length > 0
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('Chip time is required when race status is Completed.'))
                                ),
                              },
                            ]}
                          >
                            <Input
                              inputMode="numeric"
                              maxLength={8}
                              placeholder="00:00:00"
                              onChange={(event) => {
                                form.setFieldValue('chipTime', formatDigitTimeInput(event.target.value, 'duration'))
                              }}
                            />
                          </Form.Item>
                        )}
                      </Form.Item>
                    </div>

                    <Form.Item noStyle dependencies={['raceStatus']}>
                      {({ getFieldValue }) => (
                        <Form.Item<AddRaceFormValues>
                          label={(
                            <>
                              {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                              {renderInfoLabel('Pace per KM', 'Average pace per kilometre. It is calculated automatically from chip time and distance, but you can also adjust it manually.')}
                            </>
                          )}
                          name="pacePerKm"
                          rules={[
                            {
                              validator: (_, value) => (
                                !isCompletedStatus(getFieldValue('raceStatus')) || String(value ?? '').trim().length > 0
                                  ? Promise.resolve()
                                  : Promise.reject(new Error('Pace per KM is required when race status is Completed.'))
                              ),
                            },
                          ]}
                        >
                          <Input
                            inputMode="numeric"
                            maxLength={5}
                            placeholder="00:00"
                            onChange={(event) => {
                              form.setFieldValue('pacePerKm', formatDigitTimeInput(event.target.value, 'pace'))
                            }}
                          />
                        </Form.Item>
                      )}
                    </Form.Item>

                    {renderManagedSelect('shoeId', renderInfoLabel('Shoe', 'Optional shoe used in this race result.'), 'shoes', styles.rowItem)}

                    <div className={styles.row}>
                      <div className={styles.classificationBlock}>
                        <Form.Item<AddRaceFormValues> label={renderInfoLabel('General classification', 'Overall finishing position in the race. Positions 1 to 3 automatically mark the podium checkbox.')} name="generalClassification" className={styles.rowItem}>
                          <InputNumber
                            min={1}
                            className={styles.fullWidth}
                            onChange={(value) => {
                              form.setFieldValue('generalClassification', value ?? undefined)
                              form.setFieldValue('isGeneralClassificationPodium', normalizeClassificationPodium(value))
                            }}
                          />
                        </Form.Item>

                        <Form.Item<AddRaceFormValues> name="isGeneralClassificationPodium" valuePropName="checked" className={styles.classificationCheckbox}>
                          <Checkbox>General classification podium</Checkbox>
                        </Form.Item>
                      </div>

                      <div className={styles.classificationBlock}>
                        <Form.Item<AddRaceFormValues> label={renderInfoLabel('Age group classification', 'Finishing position inside your age category. Positions 1 to 3 automatically mark the podium checkbox.')} name="ageGroupClassification" className={styles.rowItem}>
                          <InputNumber
                            min={1}
                            className={styles.fullWidth}
                            onChange={(value) => {
                              form.setFieldValue('ageGroupClassification', value ?? undefined)
                              form.setFieldValue('isAgeGroupClassificationPodium', normalizeClassificationPodium(value))
                            }}
                          />
                        </Form.Item>

                        <Form.Item<AddRaceFormValues> name="isAgeGroupClassificationPodium" valuePropName="checked" className={styles.classificationCheckbox}>
                          <Checkbox>Age group podium</Checkbox>
                        </Form.Item>
                      </div>
                    </div>

                    <div className={styles.classificationBlock}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Team classification', 'Team finishing position when the race has a team ranking. Positions 1 to 3 automatically mark the podium checkbox.')} name="teamClassification">
                        <InputNumber
                          min={1}
                          className={styles.fullWidth}
                          onChange={(value) => {
                            form.setFieldValue('teamClassification', value ?? undefined)
                            form.setFieldValue('isTeamClassificationPodium', normalizeClassificationPodium(value))
                          }}
                        />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> name="isTeamClassificationPodium" valuePropName="checked" className={styles.classificationCheckbox}>
                        <Checkbox>Team podium</Checkbox>
                      </Form.Item>
                    </div>
                  </div>
                ),
              }] : []),
              ...(showAnalysisTab ? [{
                key: 'analysis',
                label: 'Race analysis',
                children: (
                  <div className={styles.tabPane}>
                    {showPreRaceConfidence || showRaceDifficulty ? (
                      <div className={styles.row}>
                        {showPreRaceConfidence ? (
                          <Form.Item<AddRaceFormValues> label={renderInfoLabel('Pre-race confidence', 'How confident you felt before the race started.')} name="preRaceConfidence" className={styles.rowItem}>
                            <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                          </Form.Item>
                        ) : null}

                        {showRaceDifficulty ? (
                          <Form.Item<AddRaceFormValues> label={renderInfoLabel('Race difficulty', 'Your perception of how hard the race felt overall.')} name="raceDifficulty" className={styles.rowItem}>
                            <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                          </Form.Item>
                        ) : null}
                      </div>
                    ) : null}

                    {showFinalSatisfaction ? (
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Final satisfaction', 'Your final satisfaction with the race and your performance.')} name="finalSatisfaction">
                        <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                      </Form.Item>
                    ) : null}

                    {showPainInjuries ? (
                      <Form.Item<AddRaceFormValues> label="Pain / injuries" name="painInjuries">
                        <TextArea rows={3} placeholder="Notes about pain or injuries during the race" />
                      </Form.Item>
                    ) : null}

                    <Form.Item<AddRaceFormValues> label="Analysis notes" name="analysisNotes">
                      <TextArea rows={5} placeholder="Post-race thoughts, what went well, what to improve..." />
                    </Form.Item>

                    {showWouldRepeatThisRace ? (
                      <Form.Item<AddRaceFormValues> name="wouldRepeatThisRace" valuePropName="checked">
                        <Checkbox>I would repeat this race</Checkbox>
                      </Form.Item>
                    ) : null}
                  </div>
                ),
              }] : []),
            ]}
          />
        </Form>

        <Modal
          title="Discard changes?"
          open={isDiscardModalOpen}
          okText="Discard"
          cancelText="Keep editing"
          okButtonProps={{ danger: true }}
          cancelButtonProps={{ className: styles.cancelButton }}
          onOk={closeDrawer}
          onCancel={() => setIsDiscardModalOpen(false)}
        >
          <p>You have unsaved race data. If you leave now, the information you entered will be lost.</p>
        </Modal>

        <Modal
          className={styles.manageOptionsDialog}
          title={managedOptionType === 'race-types' ? 'Manage race types' : `Manage ${MANAGED_OPTION_CONFIG[managedOptionType].title.toLowerCase()}`}
          open={isManageOptionsModalOpen}
          footer={null}
          onCancel={closeManageOptionsModal}
        >
          <div className={styles.manageOptionsModal}>
            {managedOptionError && !managedOptionUsage ? (
              <Alert
                type="error"
                showIcon
                message={`Could not save ${MANAGED_OPTION_CONFIG[managedOptionType].singularLabel}`}
                description={managedOptionError}
              />
            ) : null}

            <div className={styles.manageOptionsForm}>
              <div
                className={styles.manageInputRow}
                style={managedOptionType === 'race-types'
                  ? { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px auto', gap: 8, alignItems: 'center' }
                  : { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center', justifyContent: 'start' }}
              >
                <Input
                  value={managedOptionName}
                  maxLength={100}
                  placeholder={`Type the ${MANAGED_OPTION_CONFIG[managedOptionType].singularLabel} name here`}
                  onChange={(event) => setManagedOptionName(event.target.value)}
                />
                {managedOptionType === 'race-types' ? (
                  <InputNumber
                    min={0}
                    max={9999.99}
                    precision={2}
                    step={0.01}
                    className={styles.manageTargetInput}
                    placeholder="Target km"
                    value={managedOptionTargetKm ?? undefined}
                    onChange={(value) => setManagedOptionTargetKm(typeof value === 'number' ? value : null)}
                  />
                ) : null}
                <div className={styles.manageInputActions}>
                  {editingManagedOptionId ? (
                    <button
                      type="button"
                      className={styles.cancelEditingIconButton}
                      onClick={() => {
                        setManagedOptionName('')
                        setManagedOptionTargetKm(null)
                        setEditingManagedOptionId(null)
                        setManagedOptionError(null)
                        setManagedOptionUsage(null)
                        setPendingDeleteOption(null)
                      }}
                      aria-label="Cancel editing"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  ) : null}

                  {!managedOptionUsage || !pendingDeleteOption ? (
                    <Button
                      type="primary"
                      className={styles.saveButton}
                      loading={isManagedOptionSubmitting}
                      disabled={isManagedOptionSaveDisabled}
                      onClick={() => void handleSaveManagedOption()}
                      style={!isManagedOptionSaveDisabled
                        ? { borderColor: '#111827', background: '#111827', color: '#ffffff', boxShadow: 'none' }
                        : undefined}
                    >
                      {editingManagedOptionId ? 'Save changes' : 'Add'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.manageOptionsList}>
              {isManagedOptionLoading ? (
                <span className={styles.manageOptionsEmpty}>Loading {MANAGED_OPTION_CONFIG[managedOptionType].title.toLowerCase()}...</span>
              ) : getOptionsForType(managedOptionType).length === 0 ? (
                <div className={styles.manageOptionsEmptyState}>
                  <Empty description={MANAGED_OPTION_CONFIG[managedOptionType].emptyLabel} />
                </div>
              ) : (
                getOptionsForType(managedOptionType).map((option) => (
                  <div key={option.id} className={styles.manageOptionRow}>
                    <div className={styles.manageOptionInfo}>
                      <span className={styles.manageOptionName}>{option.name}</span>
                      {managedOptionType === 'race-types' && option.targetKm != null ? (
                        <span className={styles.manageOptionMeta}>{option.targetKm.toFixed(2)} km target</span>
                      ) : null}
                    </div>
                    <div className={styles.manageOptionActions}>
                      <Button
                        type="text"
                        icon={<FontAwesomeIcon icon={faPenToSquare} />}
                        onClick={() => {
                          setManagedOptionName(option.name)
                          setManagedOptionTargetKm(managedOptionType === 'race-types' ? (option.targetKm ?? null) : null)
                          setEditingManagedOptionId(option.id)
                          setManagedOptionError(null)
                          setManagedOptionUsage(null)
                          setPendingDeleteOption(null)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="text"
                        danger
                        icon={<FontAwesomeIcon icon={faTrashCan} />}
                        onClick={() => void handleDeleteManagedOption(managedOptionType, option)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {managedOptionUsage && pendingDeleteOption ? (
              <div className={styles.usageCard}>
                <div className={styles.usageHeader}>
                  <strong>Used in {managedOptionUsage.usageCount} record{managedOptionUsage.usageCount === 1 ? '' : 's'}</strong>
                </div>

                <div className={styles.usageList}>
                  {managedOptionUsage.records.map((record) => (
                    <div key={`${record.contextLabel}-${record.raceId}`} className={styles.usageRow}>
                      <div className={styles.usageRowMain}>
                        <span className={styles.usageRaceName}>{record.raceName}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  danger
                  loading={isManagedOptionSubmitting}
                  onClick={() => {
                    if (pendingDeleteOption) {
                      setManagedOptionConfirmState({
                        kind: 'detach-delete',
                        optionType: managedOptionType,
                        option: pendingDeleteOption,
                      })
                    }
                  }}
                >
                  Remove from these records and delete
                </Button>
              </div>
            ) : null}
          </div>
        </Modal>

        <Modal
          title={managedOptionConfirmState?.kind === 'detach-delete' ? 'Remove associations and delete?' : 'Delete option?'}
          open={managedOptionConfirmState != null}
          okText={managedOptionConfirmState?.kind === 'detach-delete' ? 'Remove and delete' : 'Delete'}
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          cancelButtonProps={{ className: styles.cancelButton }}
          confirmLoading={isManagedOptionSubmitting}
          onOk={() => void handleConfirmManagedOptionAction()}
          onCancel={() => setManagedOptionConfirmState(null)}
        >
          <p>
            {managedOptionConfirmState?.kind === 'detach-delete'
              ? `This will remove "${managedOptionConfirmState.option.name}" from the listed records and then delete it.`
              : `Delete "${managedOptionConfirmState?.option.name ?? ''}"? This action cannot be undone.`}
          </p>
        </Modal>
      </Drawer>
    </>
  )
}

