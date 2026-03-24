import { FontAwesome6 } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { colors } from '../../../theme/colors'
import {
  createManagedRaceOption,
  createRace,
  deleteManagedRaceOption,
  detachManagedRaceOptionUsage,
  fetchManagedRaceOptionUsage,
  fetchManagedRaceOptions,
  updateManagedRaceOption,
} from '../services/racesTableService'
import { RACE_STATUS_OPTIONS } from '../types/raceFilters'
import type {
  CreateRacePayload,
  ManageRaceOptionPayload,
  ManagedRaceOptionType,
  RaceCreateOptions,
  RaceOptionUsage,
  RaceTypeOption,
} from '../types/racesTable'

type AddRaceModalProps = {
  token: string
  createOptions: RaceCreateOptions
  onCreated: () => void
  onCreateOptionsChange?: (nextOptions: RaceCreateOptions) => void
}

type AddRaceTab = 'race' | 'results' | 'analysis'

type AddRaceFormState = {
  raceStatus: string
  raceDate: string
  raceTime: string
  name: string
  location: string
  teamId: string
  circuitId: string
  raceTypeId: string
  realKm: string
  elevation: string
  isValidForCategoryRanking: boolean
  officialTime: string
  chipTime: string
  pacePerKm: string
  shoeId: string
  generalClassification: string
  isGeneralClassificationPodium: boolean
  ageGroupClassification: string
  isAgeGroupClassificationPodium: boolean
  teamClassification: string
  isTeamClassificationPodium: boolean
  preRaceConfidence: string
  raceDifficulty: string
  finalSatisfaction: string
  painInjuries: string
  analysisNotes: string
  wouldRepeatThisRace: boolean
}

type AnalysisField = 'preRaceConfidence' | 'raceDifficulty' | 'finalSatisfaction'
type SelectableField = 'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId' | AnalysisField
type DateDraft = { year: number; month: number; day: number }
type TimeDraft = { hour: number; minute: number; second: number }
type FormField = keyof AddRaceFormState
type FormErrors = Partial<Record<FormField, string>>
type ManagedOptionConfirmState =
  | { kind: 'delete'; optionType: ManagedRaceOptionType; option: RaceTypeOption }
  | { kind: 'detach-delete'; optionType: ManagedRaceOptionType; option: RaceTypeOption }
  | null

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
    emptyLabel: 'No race type yet.',
  },
  teams: {
    title: 'Teams',
    singularLabel: 'team',
    placeholder: 'Select team',
    emptyLabel: 'No team yet.',
  },
  circuits: {
    title: 'Circuits',
    singularLabel: 'circuit',
    placeholder: 'Select circuit',
    emptyLabel: 'No circuit yet.',
  },
  shoes: {
    title: 'Shoes',
    singularLabel: 'shoe',
    placeholder: 'Select shoe',
    emptyLabel: 'No shoe yet.',
  },
}

const FIELD_OPTION_TYPES: Record<'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId', ManagedRaceOptionType> = {
  raceTypeId: 'race-types',
  teamId: 'teams',
  circuitId: 'circuits',
  shoeId: 'shoes',
}

const ANALYSIS_OPTIONS = [
  { value: 'VERY_LOW', label: 'Very low' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'VERY_HIGH', label: 'Very high' },
]

const INITIAL_FORM_STATE: AddRaceFormState = {
  raceStatus: 'REGISTERED',
  raceDate: '',
  raceTime: '',
  name: '',
  location: '',
  teamId: '',
  circuitId: '',
  raceTypeId: '',
  realKm: '',
  elevation: '',
  isValidForCategoryRanking: true,
  officialTime: '',
  chipTime: '',
  pacePerKm: '',
  shoeId: '',
  generalClassification: '',
  isGeneralClassificationPodium: false,
  ageGroupClassification: '',
  isAgeGroupClassificationPodium: false,
  teamClassification: '',
  isTeamClassificationPodium: false,
  preRaceConfidence: '',
  raceDifficulty: '',
  finalSatisfaction: '',
  painInjuries: '',
  analysisNotes: '',
  wouldRepeatThisRace: false,
}

function parseTimeToSeconds(value: string, mode: 'duration' | 'pace') {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (mode === 'duration' && parts.length === 3) {
    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Duration must use HH:MM:SS.')
    }

    if (hours > 23 || minutes > 59 || seconds > 59) {
      throw new Error('Duration must use valid HH:MM:SS values.')
    }

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (mode === 'pace' && parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Pace must use MM:SS.')
    }

    if (minutes > 59 || seconds > 59) {
      throw new Error('Pace must use valid MM:SS values.')
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration' ? 'Duration must use HH:MM:SS.' : 'Pace must use MM:SS.')
}

function formatDigitTimeInput(rawValue: string, mode: 'duration' | 'pace') {
  const digits = rawValue.replace(/\D/g, '')
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

function getLiveTimeFieldError(value: string, mode: 'duration' | 'pace', fieldLabel: string) {
  const normalized = value.trim()
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

function normalizeClassificationPodium(value: string) {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 3
}

function isRaceDateRequired(raceStatus: string) {
  return raceStatus.trim().toUpperCase() !== 'IN_LIST'
}

function formatSecondsAsPace(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function parseNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const numberValue = Number(normalized.replace(',', '.'))
  if (Number.isNaN(numberValue)) {
    throw new Error('Only numeric values are allowed in numeric fields.')
  }

  return numberValue
}

function parseInteger(value: string, fieldLabel: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const intValue = Number(normalized)
  if (!Number.isInteger(intValue) || intValue <= 0) {
    throw new Error(`${fieldLabel} must be a positive number.`)
  }

  return intValue
}

function hasUnsavedChanges(formState: AddRaceFormState) {
  return (Object.keys(INITIAL_FORM_STATE) as Array<keyof AddRaceFormState>).some((key) => (
    formState[key] !== INITIAL_FORM_STATE[key]
  ))
}

function parseDateDraft(value: string): DateDraft {
  const now = new Date()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function parseTimeDraft(value: string): TimeDraft {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) {
    return { hour: 9, minute: 0, second: 0 }
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: Number(match[3]),
  }
}

function formatDateDraft(dateDraft: DateDraft) {
  return `${dateDraft.year}-${String(dateDraft.month).padStart(2, '0')}-${String(dateDraft.day).padStart(2, '0')}`
}

function formatTimeDraft(timeDraft: TimeDraft) {
  return `${String(timeDraft.hour).padStart(2, '0')}:${String(timeDraft.minute).padStart(2, '0')}:${String(timeDraft.second).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFieldNameFromError(message: string): FormField | null {
  if (/race date/i.test(message)) {
    return 'raceDate'
  }

  if (/race name|^name /i.test(message)) {
    return 'name'
  }

  if (/official time/i.test(message)) {
    return 'officialTime'
  }

  if (/chip time/i.test(message)) {
    return 'chipTime'
  }

  if (/pace/i.test(message)) {
    return 'pacePerKm'
  }

  if (/team/i.test(message)) {
    return 'teamId'
  }

  if (/circuit/i.test(message)) {
    return 'circuitId'
  }

  if (/shoe/i.test(message)) {
    return 'shoeId'
  }

  if (/race type/i.test(message)) {
    return 'raceTypeId'
  }

  return null
}

function getSelectableOptions(
  field: SelectableField,
  createOptions: RaceCreateOptions,
): Array<RaceTypeOption | { value: string; label: string }> {
  switch (field) {
    case 'raceTypeId':
      return createOptions.raceTypes
    case 'teamId':
      return createOptions.teams
    case 'circuitId':
      return createOptions.circuits
    case 'shoeId':
      return createOptions.shoes
    case 'preRaceConfidence':
    case 'raceDifficulty':
    case 'finalSatisfaction':
      return ANALYSIS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))
    default:
      return []
  }
}

function getSelectableValueLabel(
  field: SelectableField | null,
  formState: AddRaceFormState,
  createOptions: RaceCreateOptions,
) {
  if (!field) {
    return ''
  }

  const options = getSelectableOptions(field, createOptions)
  const currentValue = formState[field]
  if (!currentValue) {
    return ''
  }

  const matchedOption = options.find((option) => ('id' in option ? option.id : option.value) === currentValue)
  if (!matchedOption) {
    return ''
  }

  return 'name' in matchedOption ? matchedOption.name : matchedOption.label
}

function showFieldInfo(label: string, description: string) {
  Alert.alert(label, description)
}

export function AddRaceModal({ token, createOptions, onCreated, onCreateOptionsChange }: AddRaceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AddRaceTab>('race')
  const [formState, setFormState] = useState<AddRaceFormState>(INITIAL_FORM_STATE)
  const [localCreateOptions, setLocalCreateOptions] = useState<RaceCreateOptions>(createOptions)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false)
  const [selectorField, setSelectorField] = useState<SelectableField | null>(null)
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false)
  const [isTimeSelectorOpen, setIsTimeSelectorOpen] = useState(false)
  const [isManageOptionsOpen, setIsManageOptionsOpen] = useState(false)
  const [managedOptionType, setManagedOptionType] = useState<ManagedRaceOptionType>('race-types')
  const [managedOptionName, setManagedOptionName] = useState('')
  const [editingManagedOptionId, setEditingManagedOptionId] = useState<string | null>(null)
  const [managedOptionError, setManagedOptionError] = useState<string | null>(null)
  const [isManagedOptionSubmitting, setIsManagedOptionSubmitting] = useState(false)
  const [isManagedOptionLoading, setIsManagedOptionLoading] = useState(false)
  const [managedOptionUsage, setManagedOptionUsage] = useState<RaceOptionUsage | null>(null)
  const [pendingDeleteOption, setPendingDeleteOption] = useState<RaceTypeOption | null>(null)
  const [managedOptionConfirmState, setManagedOptionConfirmState] = useState<ManagedOptionConfirmState>(null)
  const [dateDraft, setDateDraft] = useState<DateDraft>(() => parseDateDraft(''))
  const [timeDraft, setTimeDraft] = useState<TimeDraft>(() => parseTimeDraft(''))
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  useEffect(() => {
    setLocalCreateOptions(createOptions)
  }, [createOptions])

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
    setEditingManagedOptionId(null)
    setManagedOptionError(null)
    setIsManagedOptionSubmitting(false)
    setIsManagedOptionLoading(false)
    setManagedOptionUsage(null)
    setPendingDeleteOption(null)
    setManagedOptionConfirmState(null)
  }

  const setFieldValue = (field: FormField, value: string | boolean) => {
    setFormState((current) => {
      const nextState = { ...current, [field]: value }

      if (field === 'chipTime' || field === 'realKm') {
        const chipTimeError = getLiveTimeFieldError(nextState.chipTime, 'duration', 'Chip time')
        const realKmValue = Number(nextState.realKm.replace(',', '.'))

        if (!chipTimeError && nextState.chipTime.trim() && Number.isFinite(realKmValue) && realKmValue > 0) {
          try {
            const chipTimeSeconds = parseTimeToSeconds(nextState.chipTime, 'duration')
            if (chipTimeSeconds != null) {
              nextState.pacePerKm = formatSecondsAsPace(Math.round(chipTimeSeconds / realKmValue))
            }
          } catch {
            // Keep current pace when chip time is still incomplete or invalid.
          }
        }
      }

      if (field === 'generalClassification') {
        nextState.isGeneralClassificationPodium = normalizeClassificationPodium(String(value))
      }

      if (field === 'ageGroupClassification') {
        nextState.isAgeGroupClassificationPodium = normalizeClassificationPodium(String(value))
      }

      if (field === 'teamClassification') {
        nextState.isTeamClassificationPodium = normalizeClassificationPodium(String(value))
      }

      return nextState
    })
  }

  const clearFieldError = (field: FormField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const setFieldError = (field: FormField, message: string | null) => {
    setFieldErrors((current) => {
      if (!message) {
        if (!current[field]) {
          return current
        }

        const nextErrors = { ...current }
        delete nextErrors[field]
        return nextErrors
      }

      return { ...current, [field]: message }
    })
  }

  const closeModal = () => {
    setIsOpen(false)
    setActiveTab('race')
    setFormState(INITIAL_FORM_STATE)
    setErrorMessage(null)
    setIsStatusSelectorOpen(false)
    setSelectorField(null)
    setIsDateSelectorOpen(false)
    setIsTimeSelectorOpen(false)
    setIsManageOptionsOpen(false)
    setFieldErrors({})
    resetManagedOptionState()
  }

  const openManageOptions = async (optionType: ManagedRaceOptionType) => {
    setManagedOptionType(optionType)
    setIsManageOptionsOpen(true)
    setSelectorField(null)
    setManagedOptionError(null)
    setManagedOptionUsage(null)
    setPendingDeleteOption(null)
    setManagedOptionConfirmState(null)

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

  const closeManageOptions = () => {
    setIsManageOptionsOpen(false)
    resetManagedOptionState()
  }

  const resetManagedOptionEditing = () => {
    setManagedOptionName('')
    setEditingManagedOptionId(null)
    setManagedOptionError(null)
    setManagedOptionUsage(null)
    setPendingDeleteOption(null)
    setManagedOptionConfirmState(null)
  }

  const handleSaveManagedOption = async () => {
    const trimmedName = managedOptionName.trim()
    if (!trimmedName) {
      return
    }

    try {
      setIsManagedOptionSubmitting(true)
      setManagedOptionError(null)
      setManagedOptionUsage(null)
      setPendingDeleteOption(null)
      setManagedOptionConfirmState(null)

      const payload: ManageRaceOptionPayload = { name: trimmedName }
      const savedOption = editingManagedOptionId
        ? await updateManagedRaceOption(managedOptionType, editingManagedOptionId, payload, token)
        : await createManagedRaceOption(managedOptionType, payload, token)

      const currentOptions = getOptionsForType(managedOptionType)
      const nextOptions = editingManagedOptionId
        ? currentOptions.map((option) => (option.id === savedOption.id ? savedOption : option))
        : [...currentOptions, savedOption].sort((left, right) => left.name.localeCompare(right.name))

      replaceOptionsForType(managedOptionType, nextOptions)

      const linkedField = Object.entries(FIELD_OPTION_TYPES).find(([, value]) => value === managedOptionType)?.[0] as FormField | undefined
      if (linkedField) {
        setFieldValue(linkedField, savedOption.id)
        clearFieldError(linkedField)
      }

      setManagedOptionName('')
      setEditingManagedOptionId(null)
    } catch (saveError) {
      setManagedOptionError(saveError instanceof Error ? saveError.message : 'Could not save this option right now.')
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const handleDeleteManagedOption = async (optionType: ManagedRaceOptionType, option: RaceTypeOption) => {
    try {
      setManagedOptionError(null)
      setManagedOptionUsage(null)
      setPendingDeleteOption(null)
      setManagedOptionConfirmState(null)

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
    }
  }

  const handleConfirmManagedOptionAction = async () => {
    if (!managedOptionConfirmState) {
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
      replaceOptionsForType(optionType, nextOptions)

      const linkedField = Object.entries(FIELD_OPTION_TYPES).find(([, value]) => value === optionType)?.[0] as FormField | undefined
      if (linkedField && formState[linkedField] === option.id) {
        setFieldValue(linkedField, '')
      }

      if (editingManagedOptionId === option.id) {
        setManagedOptionName('')
        setEditingManagedOptionId(null)
      }

      setManagedOptionUsage(null)
      setPendingDeleteOption(null)
      setManagedOptionConfirmState(null)
    } catch (confirmError) {
      setManagedOptionError(confirmError instanceof Error ? confirmError.message : 'Could not complete this action right now.')
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const requestClose = () => {
    if (!hasUnsavedChanges(formState)) {
      closeModal()
      return
    }

    Alert.alert(
      'Discard changes?',
      'You have unsaved race data. If you leave now, the information you entered will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: closeModal },
      ],
    )
  }

  const handleSubmit = async () => {
    if (isRaceDateRequired(formState.raceStatus) && !formState.raceDate.trim()) {
      setErrorMessage('Race date is required.')
      setFieldError('raceDate', 'Race date is required.')
      setActiveTab('race')
      return
    }

    if (!formState.name.trim()) {
      setErrorMessage('Race name is required.')
      setFieldError('name', 'Race name is required.')
      setActiveTab('race')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)

      const payload: CreateRacePayload = {
        race: {
          raceStatus: formState.raceStatus,
          raceDate: formState.raceDate.trim() ? formState.raceDate.trim() : null,
          raceTime: formState.raceTime.trim() ? formState.raceTime.trim() : null,
          name: formState.name.trim(),
          location: formState.location.trim() ? formState.location.trim() : null,
          teamId: formState.teamId || null,
          circuitId: formState.circuitId || null,
          raceTypeId: formState.raceTypeId || null,
          realKm: parseNumber(formState.realKm),
          elevation: parseNumber(formState.elevation),
          isValidForCategoryRanking: formState.isValidForCategoryRanking,
        },
        results: {
          officialTimeSeconds: parseTimeToSeconds(formState.officialTime, 'duration'),
          chipTimeSeconds: parseTimeToSeconds(formState.chipTime, 'duration'),
          pacePerKmSeconds: parseTimeToSeconds(formState.pacePerKm, 'pace'),
          shoeId: formState.shoeId || null,
          generalClassification: parseInteger(formState.generalClassification, 'General classification'),
          isGeneralClassificationPodium: formState.isGeneralClassificationPodium,
          ageGroupClassification: parseInteger(formState.ageGroupClassification, 'Age group classification'),
          isAgeGroupClassificationPodium: formState.isAgeGroupClassificationPodium,
          teamClassification: parseInteger(formState.teamClassification, 'Team classification'),
          isTeamClassificationPodium: formState.isTeamClassificationPodium,
        },
        analysis: {
          preRaceConfidence: formState.preRaceConfidence || null,
          raceDifficulty: formState.raceDifficulty || null,
          finalSatisfaction: formState.finalSatisfaction || null,
          painInjuries: formState.painInjuries.trim() ? formState.painInjuries.trim() : null,
          analysisNotes: formState.analysisNotes.trim() ? formState.analysisNotes.trim() : null,
          wouldRepeatThisRace: formState.wouldRepeatThisRace,
        },
      }

      await createRace(payload, token)
      closeModal()
      onCreated()
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to create this race right now.'
      const fieldName = error instanceof Error ? getFieldNameFromError(error.message) : null

      if (fieldName) {
        setFieldError(fieldName, nextMessage)
        if (fieldName === 'officialTime' || fieldName === 'chipTime' || fieldName === 'pacePerKm') {
          setActiveTab('results')
        }
      }

      setErrorMessage(nextMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const renderTabButton = (tab: AddRaceTab, label: string) => (
    <Pressable
      key={tab}
      style={[styles.tabButton, activeTab === tab ? styles.tabButtonActive : null]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonLabel, activeTab === tab ? styles.tabButtonLabelActive : null]}>
        {label}
      </Text>
    </Pressable>
  )

  const renderLabel = (label: string, options?: { required?: boolean; info?: string }) => (
    <View style={styles.fieldLabelRow}>
      <View style={styles.fieldLabelInline}>
        <Text style={styles.fieldLabel}>
          {options?.required ? <Text style={styles.requiredMark}>* </Text> : null}
          {label}
        </Text>
        {options?.info ? (
          <Pressable style={styles.infoButton} onPress={() => showFieldInfo(label, options.info ?? '')}>
            <FontAwesome6 name="circle-info" size={14} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )

  const renderField = (
    field: FormField,
    label: string,
    value: string,
    onChangeText: (nextValue: string) => void,
    placeholder: string,
    options?: { multiline?: boolean; keyboardType?: 'default' | 'numeric'; required?: boolean; info?: string }
  ) => (
    <View style={styles.fieldGroup}>
      {renderLabel(label, options)}
      <TextInput
        value={value}
        onChangeText={(nextValue) => {
          clearFieldError(field)
          onChangeText(nextValue)
        }}
        placeholder={placeholder}
        placeholderTextColor="#98a2b3"
        style={[
          styles.fieldInput,
          options?.multiline ? styles.fieldInputMultiline : null,
          fieldErrors[field] ? styles.fieldInputError : null,
        ]}
        multiline={options?.multiline}
        keyboardType={options?.keyboardType ?? 'default'}
        autoCapitalize="none"
      />
      {fieldErrors[field] ? <Text style={styles.fieldErrorText}>{fieldErrors[field]}</Text> : null}
    </View>
  )

  const renderSelectorField = (
    field: FormField,
    label: string,
    value: string,
    onPress: () => void,
    placeholder: string,
    options?: { info?: string },
  ) => (
    <View style={styles.fieldGroup}>
      {renderLabel(label, options)}
      <Pressable style={[styles.selectTrigger, fieldErrors[field] ? styles.fieldInputError : null]} onPress={onPress}>
        <Text style={[styles.selectTriggerLabel, !value ? styles.selectTriggerPlaceholder : null]}>
          {value || placeholder}
        </Text>
        <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {fieldErrors[field] ? <Text style={styles.fieldErrorText}>{fieldErrors[field]}</Text> : null}
    </View>
  )

  const renderManagedSelectorField = (
    field: 'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId',
    label: string,
    value: string,
    placeholder: string,
    options?: { info?: string },
  ) => (
    <View style={styles.fieldGroup}>
      {renderLabel(label, options)}
      <View style={styles.managedFieldRow}>
        <Pressable
          style={[styles.selectTrigger, styles.managedFieldTrigger, fieldErrors[field] ? styles.fieldInputError : null]}
          onPress={() => setSelectorField(field)}
        >
          <Text style={[styles.selectTriggerLabel, !value ? styles.selectTriggerPlaceholder : null]}>
            {value || placeholder}
          </Text>
          <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.manageFieldButton}
          onPress={() => void openManageOptions(FIELD_OPTION_TYPES[field])}
        >
          <FontAwesome6 name="ellipsis-vertical" size={14} color="#ffffff" />
        </Pressable>
      </View>
      {fieldErrors[field] ? <Text style={styles.fieldErrorText}>{fieldErrors[field]}</Text> : null}
    </View>
  )

  const renderRequiredSelectorField = (
    field: FormField,
    label: string,
    value: string,
    onPress: () => void,
    placeholder: string,
    required = true,
    info?: string,
  ) => (
    <View style={styles.fieldGroup}>
      {renderLabel(label, { required, info })}
      <Pressable style={[styles.selectTrigger, fieldErrors[field] ? styles.fieldInputError : null]} onPress={onPress}>
        <Text style={[styles.selectTriggerLabel, !value ? styles.selectTriggerPlaceholder : null]}>
          {value || placeholder}
        </Text>
        <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {fieldErrors[field] ? <Text style={styles.fieldErrorText}>{fieldErrors[field]}</Text> : null}
    </View>
  )

  const selectorValueLabel = getSelectableValueLabel(selectorField, formState, localCreateOptions)

  return (
    <>
      <Pressable
        style={styles.addButton}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add race"
      >
        <FontAwesome6 name="plus" size={14} color="#ffffff" />
      </Pressable>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={requestClose}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable style={styles.headerIconButton} onPress={requestClose}>
              <FontAwesome6 name="xmark" size={18} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.headerTitle}>Add race</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.cancelAction} onPress={requestClose}>
                <Text style={styles.cancelActionLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveAction, isSaving ? styles.saveActionDisabled : null]} onPress={() => void handleSubmit()}>
                <Text style={styles.saveActionLabel}>{isSaving ? 'Saving...' : 'Save race'}</Text>
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <FontAwesome6 name="circle-xmark" size={18} color="#ff5a5f" />
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>Could not create the race</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.tabsRow}>
            {renderTabButton('race', 'Race data')}
            {renderTabButton('results', 'Race results')}
            {renderTabButton('analysis', 'Race analysis')}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            {activeTab === 'race' ? (
              <View style={styles.formFields}>
                {renderSelectorField(
                  'raceStatus',
                  'Race status',
                  RACE_STATUS_OPTIONS.find((option) => option.value === formState.raceStatus)?.label ?? '',
                  () => setIsStatusSelectorOpen(true),
                  'Select race status',
                  { info: 'Use In list for races you want to track before you have a confirmed date. These races stay hidden from the list by default and only appear when you filter by the In list status.' },
                )}
                {renderRequiredSelectorField(
                  'raceDate',
                  'Race date',
                  formState.raceDate,
                  () => {
                    setDateDraft(parseDateDraft(formState.raceDate))
                    setIsDateSelectorOpen(true)
                  },
                  'Select date',
                  isRaceDateRequired(formState.raceStatus),
                )}
                {renderSelectorField(
                  'raceTime',
                  'Race time',
                  formState.raceTime,
                  () => {
                    setTimeDraft(parseTimeDraft(formState.raceTime))
                    setIsTimeSelectorOpen(true)
                  },
                  'Select time',
                  { info: 'Optional start time of the race. Leave empty if it is not confirmed yet.' },
                )}
                {renderField('name', 'Race name', formState.name, (value) => setFieldValue('name', value), 'Lisbon Half Marathon', { required: true })}
                {renderField('location', 'Location', formState.location, (value) => setFieldValue('location', value), 'Lisbon')}
                {renderManagedSelectorField(
                  'raceTypeId',
                  'Race type',
                  localCreateOptions.raceTypes.find((raceType) => raceType.id === formState.raceTypeId)?.name ?? '',
                  'Select race type',
                )}
                {renderManagedSelectorField(
                  'teamId',
                  'Team',
                  localCreateOptions.teams.find((team) => team.id === formState.teamId)?.name ?? '',
                  'Select team',
                  { info: 'Optional team linked to this race entry.' },
                )}
                {renderManagedSelectorField(
                  'circuitId',
                  'Circuit',
                  localCreateOptions.circuits.find((circuit) => circuit.id === formState.circuitId)?.name ?? '',
                  'Select circuit',
                  { info: 'Optional circuit or championship this race belongs to.' },
                )}
                {renderField('realKm', 'Real KM', formState.realKm, (value) => setFieldValue('realKm', value), '21.10', { keyboardType: 'numeric', info: 'Actual race distance in kilometres, using decimals when needed.' })}
                {renderField('elevation', 'Elevation', formState.elevation, (value) => setFieldValue('elevation', value), '250', { keyboardType: 'numeric', info: 'Total elevation gain of the race, usually in meters.' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isValidForCategoryRanking: !current.isValidForCategoryRanking }))}>
                  <View style={[styles.checkbox, formState.isValidForCategoryRanking ? styles.checkboxCheckedOrange : null]}>
                    {formState.isValidForCategoryRanking ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Valid for category ranking</Text>
                </Pressable>
              </View>
            ) : null}

            {activeTab === 'results' ? (
              <View style={styles.formFields}>
                {renderField(
                  'officialTime',
                  'Official time',
                  formState.officialTime,
                  (value) => {
                    const formattedValue = formatDigitTimeInput(value, 'duration')
                    setFieldValue('officialTime', formattedValue)
                    setFieldError('officialTime', getLiveTimeFieldError(formattedValue, 'duration', 'Official time'))
                  },
                  'HH:MM:SS',
                  { keyboardType: 'numeric', info: 'Official finish time published by the event organization.' },
                )}
                {renderField(
                  'chipTime',
                  'Chip time',
                  formState.chipTime,
                  (value) => {
                    const formattedValue = formatDigitTimeInput(value, 'duration')
                    setFieldValue('chipTime', formattedValue)
                    setFieldError('chipTime', getLiveTimeFieldError(formattedValue, 'duration', 'Chip time'))
                    setFieldError('pacePerKm', null)
                  },
                  'HH:MM:SS',
                  { keyboardType: 'numeric', info: 'Net finish time measured from crossing the start line to crossing the finish line.' },
                )}
                {renderField(
                  'pacePerKm',
                  'Pace per KM',
                  formState.pacePerKm,
                  (value) => {
                    const formattedValue = formatDigitTimeInput(value, 'pace')
                    setFieldValue('pacePerKm', formattedValue)
                    setFieldError('pacePerKm', getLiveTimeFieldError(formattedValue, 'pace', 'Pace per KM'))
                  },
                  'MM:SS',
                  { keyboardType: 'numeric', info: 'Average pace per kilometre. It is calculated automatically from chip time and distance, but you can also adjust it manually.' },
                )}
                {renderManagedSelectorField(
                  'shoeId',
                  'Shoe',
                  localCreateOptions.shoes.find((shoe) => shoe.id === formState.shoeId)?.name ?? '',
                  'Select shoe',
                  { info: 'Optional shoe used in this race result.' },
                )}
                {renderField('generalClassification', 'General classification', formState.generalClassification, (value) => setFieldValue('generalClassification', value), '1', { keyboardType: 'numeric', info: 'Overall finishing position in the race. Positions 1 to 3 automatically mark the podium checkbox.' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isGeneralClassificationPodium: !current.isGeneralClassificationPodium }))}>
                  <View style={[styles.checkbox, formState.isGeneralClassificationPodium ? styles.checkboxCheckedBlack : null]}>
                    {formState.isGeneralClassificationPodium ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>General classification podium</Text>
                </Pressable>
                {renderField('ageGroupClassification', 'Age group classification', formState.ageGroupClassification, (value) => setFieldValue('ageGroupClassification', value), '1', { keyboardType: 'numeric', info: 'Finishing position inside your age category. Positions 1 to 3 automatically mark the podium checkbox.' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isAgeGroupClassificationPodium: !current.isAgeGroupClassificationPodium }))}>
                  <View style={[styles.checkbox, formState.isAgeGroupClassificationPodium ? styles.checkboxCheckedBlack : null]}>
                    {formState.isAgeGroupClassificationPodium ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Age group podium</Text>
                </Pressable>
                {renderField('teamClassification', 'Team classification', formState.teamClassification, (value) => setFieldValue('teamClassification', value), '1', { keyboardType: 'numeric', info: 'Team finishing position when the race has a team ranking. Positions 1 to 3 automatically mark the podium checkbox.' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isTeamClassificationPodium: !current.isTeamClassificationPodium }))}>
                  <View style={[styles.checkbox, formState.isTeamClassificationPodium ? styles.checkboxCheckedBlack : null]}>
                    {formState.isTeamClassificationPodium ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Team podium</Text>
                </Pressable>
              </View>
            ) : null}

            {activeTab === 'analysis' ? (
              <View style={styles.formFields}>
                {renderSelectorField(
                  'preRaceConfidence',
                  'Pre-race confidence',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.preRaceConfidence)?.label ?? '',
                  () => setSelectorField('preRaceConfidence'),
                  'Select value',
                  { info: 'How confident you felt before the race started.' },
                )}
                {renderSelectorField(
                  'raceDifficulty',
                  'Race difficulty',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.raceDifficulty)?.label ?? '',
                  () => setSelectorField('raceDifficulty'),
                  'Select value',
                  { info: 'Your perception of how hard the race felt overall.' },
                )}
                {renderSelectorField(
                  'finalSatisfaction',
                  'Final satisfaction',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.finalSatisfaction)?.label ?? '',
                  () => setSelectorField('finalSatisfaction'),
                  'Select value',
                  { info: 'Your final satisfaction with the race and your performance.' },
                )}
                {renderField('painInjuries', 'Pain / injuries', formState.painInjuries, (value) => setFieldValue('painInjuries', value), 'Notes about pain or injuries', { multiline: true })}
                {renderField('analysisNotes', 'Analysis notes', formState.analysisNotes, (value) => setFieldValue('analysisNotes', value), 'Post-race thoughts and notes', { multiline: true })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, wouldRepeatThisRace: !current.wouldRepeatThisRace }))}>
                  <View style={[styles.checkbox, formState.wouldRepeatThisRace ? styles.checkboxCheckedBlack : null]}>
                    {formState.wouldRepeatThisRace ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>I would repeat this race</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isStatusSelectorOpen} transparent animationType="fade" onRequestClose={() => setIsStatusSelectorOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setIsStatusSelectorOpen(false)}>
          <View style={styles.selectorCard}>
            {RACE_STATUS_OPTIONS.map((option) => {
              const isActive = option.value === formState.raceStatus
              return (
                <Pressable
                  key={option.value}
                  style={[styles.selectorOption, isActive ? styles.selectorOptionActive : null]}
                  onPress={() => {
                    clearFieldError('raceStatus')
                    if (option.value === 'IN_LIST') {
                      clearFieldError('raceDate')
                    }
                    setFieldValue('raceStatus', option.value)
                    setIsStatusSelectorOpen(false)
                  }}
                >
                  <Text style={[styles.selectorOptionLabel, isActive ? styles.selectorOptionLabelActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={isDateSelectorOpen} transparent animationType="fade" onRequestClose={() => setIsDateSelectorOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setIsDateSelectorOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={() => undefined}>
            <View style={styles.pickerColumns}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 2 + index).map((year) => {
                    const isActive = year === dateDraft.year
                    return (
                      <Pressable key={year} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setDateDraft((current) => ({ ...current, year }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{year}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                    const isActive = month === dateDraft.month
                    return (
                      <Pressable key={month} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setDateDraft((current) => ({ ...current, month, day: Math.min(current.day, getDaysInMonth(current.year, month)) }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{String(month).padStart(2, '0')}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Day</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: getDaysInMonth(dateDraft.year, dateDraft.month) }, (_, index) => index + 1).map((day) => {
                    const isActive = day === dateDraft.day
                    return (
                      <Pressable key={day} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setDateDraft((current) => ({ ...current, day }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{String(day).padStart(2, '0')}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
            </View>
            <View style={styles.pickerActions}>
              <Pressable style={styles.cancelAction} onPress={() => setIsDateSelectorOpen(false)}>
                <Text style={styles.cancelActionLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveAction} onPress={() => {
                clearFieldError('raceDate')
                setFieldValue('raceDate', formatDateDraft(dateDraft))
                setIsDateSelectorOpen(false)
              }}>
                <Text style={styles.saveActionLabel}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isTimeSelectorOpen} transparent animationType="fade" onRequestClose={() => setIsTimeSelectorOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setIsTimeSelectorOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={() => undefined}>
            <View style={styles.pickerColumns}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hour</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: 24 }, (_, index) => index).map((hour) => {
                    const isActive = hour === timeDraft.hour
                    return (
                      <Pressable key={hour} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setTimeDraft((current) => ({ ...current, hour }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{String(hour).padStart(2, '0')}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Min</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: 60 }, (_, index) => index).map((minute) => {
                    const isActive = minute === timeDraft.minute
                    return (
                      <Pressable key={minute} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setTimeDraft((current) => ({ ...current, minute }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{String(minute).padStart(2, '0')}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Sec</Text>
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {Array.from({ length: 60 }, (_, index) => index).map((second) => {
                    const isActive = second === timeDraft.second
                    return (
                      <Pressable key={second} style={[styles.pickerOption, isActive ? styles.pickerOptionActive : null]} onPress={() => setTimeDraft((current) => ({ ...current, second }))}>
                        <Text style={[styles.pickerOptionLabel, isActive ? styles.pickerOptionLabelActive : null]}>{String(second).padStart(2, '0')}</Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
            </View>
            <View style={styles.pickerActions}>
              <Pressable style={styles.cancelAction} onPress={() => setIsTimeSelectorOpen(false)}>
                <Text style={styles.cancelActionLabel}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveAction} onPress={() => {
                clearFieldError('raceTime')
                setFieldValue('raceTime', formatTimeDraft(timeDraft))
                setIsTimeSelectorOpen(false)
              }}>
                <Text style={styles.saveActionLabel}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={selectorField != null} transparent animationType="fade" onRequestClose={() => setSelectorField(null)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setSelectorField(null)}>
          <View style={styles.selectorCard}>
            <Pressable
              style={[styles.selectorOption, !selectorValueLabel ? styles.selectorOptionActive : null]}
              onPress={() => {
                if (selectorField) {
                  clearFieldError(selectorField)
                  setFieldValue(selectorField, '')
                }
                setSelectorField(null)
              }}
            >
              <Text style={[styles.selectorOptionLabel, !selectorValueLabel ? styles.selectorOptionLabelActive : null]}>
                {selectorField === 'preRaceConfidence' || selectorField === 'raceDifficulty' || selectorField === 'finalSatisfaction'
                  ? 'No value'
                  : 'No selection'}
              </Text>
            </Pressable>
            {selectorField ? getSelectableOptions(selectorField, localCreateOptions).map((option) => {
              const optionValue = 'id' in option ? option.id : option.value
              const optionLabel = 'name' in option ? option.name : option.label
              const isActive = formState[selectorField] === optionValue

              return (
                <Pressable
                  key={optionValue}
                  style={[styles.selectorOption, isActive ? styles.selectorOptionActive : null]}
                  onPress={() => {
                    if (selectorField) {
                      clearFieldError(selectorField)
                      setFieldValue(selectorField, optionValue)
                    }
                    setSelectorField(null)
                  }}
                >
                  <Text style={[styles.selectorOptionLabel, isActive ? styles.selectorOptionLabelActive : null]}>
                    {optionLabel}
                  </Text>
                </Pressable>
              )
            }) : null}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={isManageOptionsOpen} transparent animationType="fade" onRequestClose={closeManageOptions}>
        <Pressable style={styles.selectorBackdrop} onPress={closeManageOptions}>
          <Pressable style={styles.manageCard} onPress={() => undefined}>
            <View style={styles.manageHeader}>
              <Text style={styles.manageTitle}>Manage {MANAGED_OPTION_CONFIG[managedOptionType].title}</Text>
              <Pressable style={styles.manageCloseButton} onPress={closeManageOptions}>
                <FontAwesome6 name="xmark" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {managedOptionError && !managedOptionUsage ? (
              <View style={styles.manageErrorCard}>
                <Text style={styles.manageErrorTitle}>Could not save {MANAGED_OPTION_CONFIG[managedOptionType].singularLabel}</Text>
                <Text style={styles.manageErrorText}>{managedOptionError}</Text>
              </View>
            ) : null}

            <View style={styles.manageInputRow}>
              <TextInput
                value={managedOptionName}
                onChangeText={setManagedOptionName}
                placeholder={`Type the ${MANAGED_OPTION_CONFIG[managedOptionType].singularLabel} name here`}
                placeholderTextColor="#98a2b3"
                style={styles.manageInput}
                maxLength={100}
              />
              <View style={styles.manageInputActions}>
                {editingManagedOptionId ? (
                  <Pressable style={styles.manageCancelEditButton} onPress={resetManagedOptionEditing}>
                    <FontAwesome6 name="xmark" size={16} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
                {!managedOptionUsage || !pendingDeleteOption ? (
                  <Pressable
                    style={[
                      styles.manageSaveButton,
                      managedOptionName.trim().length === 0 ? styles.saveActionDisabled : null,
                    ]}
                    disabled={managedOptionName.trim().length === 0 || isManagedOptionSubmitting}
                    onPress={() => void handleSaveManagedOption()}
                  >
                    <Text style={styles.manageSaveButtonLabel}>
                      {editingManagedOptionId ? 'Save changes' : `Create ${MANAGED_OPTION_CONFIG[managedOptionType].singularLabel}`}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <ScrollView style={styles.manageList} contentContainerStyle={styles.manageListContent} nestedScrollEnabled>
              {isManagedOptionLoading ? (
                <Text style={styles.manageEmptyLabel}>Loading {MANAGED_OPTION_CONFIG[managedOptionType].title.toLowerCase()}...</Text>
              ) : getOptionsForType(managedOptionType).length === 0 ? (
                <Text style={styles.manageEmptyLabel}>{MANAGED_OPTION_CONFIG[managedOptionType].emptyLabel}</Text>
              ) : (
                getOptionsForType(managedOptionType).map((option) => (
                  <View key={option.id} style={styles.manageRow}>
                    <Text style={styles.manageRowName}>{option.name}</Text>
                    <View style={styles.manageRowActions}>
                      <Pressable
                        style={styles.manageRowAction}
                        onPress={() => {
                          setManagedOptionName(option.name)
                          setEditingManagedOptionId(option.id)
                          setManagedOptionError(null)
                          setManagedOptionUsage(null)
                          setPendingDeleteOption(null)
                          setManagedOptionConfirmState(null)
                        }}
                      >
                        <FontAwesome6 name="pen-to-square" size={14} color={colors.textPrimary} />
                        <Text style={styles.manageRowActionLabel}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.manageRowAction}
                        onPress={() => void handleDeleteManagedOption(managedOptionType, option)}
                      >
                        <FontAwesome6 name="trash-can" size={14} color={colors.error} />
                        <Text style={styles.manageRowDeleteLabel}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {managedOptionUsage && pendingDeleteOption ? (
              <View style={styles.usageCard}>
                <Text style={styles.usageTitle}>
                  Used in {managedOptionUsage.usageCount} record{managedOptionUsage.usageCount === 1 ? '' : 's'}
                </Text>
                <View style={styles.usageList}>
                  {managedOptionUsage.records.map((record) => (
                    <View key={`${record.contextLabel}-${record.raceId}`} style={styles.usageListRow}>
                      <Text style={styles.usageListName}>{record.raceName}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={styles.usageDeleteButton}
                  onPress={() => {
                    if (pendingDeleteOption) {
                      setManagedOptionConfirmState({
                        kind: 'detach-delete',
                        optionType: managedOptionType,
                        option: pendingDeleteOption,
                      })
                    }
                  }}
                >
                  <Text style={styles.usageDeleteButtonLabel}>Remove from these records and delete</Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={managedOptionConfirmState != null} transparent animationType="fade" onRequestClose={() => setManagedOptionConfirmState(null)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setManagedOptionConfirmState(null)}>
          <Pressable style={styles.confirmCard} onPress={() => undefined}>
            <Text style={styles.confirmTitle}>
              {managedOptionConfirmState?.kind === 'detach-delete' ? 'Remove associations and delete?' : 'Delete option?'}
            </Text>
            <Text style={styles.confirmText}>
              {managedOptionConfirmState?.kind === 'detach-delete'
                ? `This will remove "${managedOptionConfirmState.option.name}" from the listed records and then delete it.`
                : `Delete "${managedOptionConfirmState?.option.name ?? ''}"? This action cannot be undone.`}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.cancelAction} onPress={() => setManagedOptionConfirmState(null)}>
                <Text style={styles.cancelActionLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDeleteButton, isManagedOptionSubmitting ? styles.saveActionDisabled : null]}
                onPress={() => void handleConfirmManagedOptionAction()}
                disabled={isManagedOptionSubmitting}
              >
                <Text style={styles.confirmDeleteButtonLabel}>
                  {managedOptionConfirmState?.kind === 'detach-delete' ? 'Remove and delete' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  addButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#f97316',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 24, 40, 0.08)',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelAction: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.12)',
    paddingHorizontal: 14,
  },
  cancelActionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveAction: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primaryButton,
    paddingHorizontal: 14,
  },
  saveActionDisabled: {
    opacity: 0.7,
  },
  saveActionLabel: {
    color: colors.primaryButtonText,
    fontSize: 14,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.28)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 95, 0.06)',
    padding: 16,
  },
  errorContent: {
    flex: 1,
    gap: 4,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  tabButton: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ea580c',
  },
  tabButtonLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  tabButtonLabelActive: {
    color: '#ea580c',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 18,
    paddingTop: 26,
    paddingBottom: 36,
  },
  formFields: {
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldLabelInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requiredMark: {
    color: colors.error,
  },
  fieldInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldInputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  fieldInputError: {
    borderColor: colors.error,
  },
  fieldErrorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  selectTrigger: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
  },
  managedFieldRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  managedFieldTrigger: {
    flex: 1,
  },
  manageFieldButton: {
    width: 38,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
  },
  selectTriggerLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  selectTriggerPlaceholder: {
    color: '#98a2b3',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f97316',
    backgroundColor: '#ffffff',
  },
  checkboxCheckedOrange: {
    borderColor: '#f97316',
    backgroundColor: '#f97316',
  },
  checkboxCheckedBlack: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  selectorBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(16, 24, 40, 0.22)',
  },
  selectorCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 10,
  },
  manageCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 18,
    gap: 18,
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  manageTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  manageCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  manageErrorCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 95, 0.28)',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 95, 0.06)',
    padding: 14,
  },
  manageErrorTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  manageErrorText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  manageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageInput: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  manageInputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageCancelEditButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.12)',
    backgroundColor: colors.cardBackground,
  },
  manageSaveButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 14,
  },
  manageSaveButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  manageList: {
    maxHeight: 280,
  },
  manageListContent: {
    gap: 10,
  },
  manageEmptyLabel: {
    color: '#98a2b3',
    fontSize: 14,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 24, 40, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  manageRowName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  manageRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  manageRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manageRowActionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  manageRowDeleteLabel: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  usageCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.22)',
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    padding: 14,
  },
  usageTitle: {
    color: '#9a3412',
    fontSize: 15,
    fontWeight: '800',
  },
  usageList: {
    gap: 8,
  },
  usageListRow: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  usageListName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  usageDeleteButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  usageDeleteButtonLabel: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 18,
    gap: 16,
  },
  confirmTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  confirmText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmDeleteButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.error,
    paddingHorizontal: 14,
  },
  confirmDeleteButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerCard: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    padding: 16,
    gap: 16,
  },
  pickerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  pickerColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
    gap: 8,
  },
  pickerLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 220,
  },
  pickerOption: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  pickerOptionLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerOptionLabelActive: {
    color: colors.warning,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  selectorOption: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorOptionActive: {
    backgroundColor: 'rgba(255, 244, 229, 0.95)',
  },
  selectorOptionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectorOptionLabelActive: {
    color: colors.warning,
  },
})
