import { faAngleDown, faAngleUp, faPenToSquare, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Space,
  Tabs,
  TimePicker,
  Tooltip,
  message,
} from 'antd'
import { useAuth } from '../../auth'
import {
  createManagedRaceOption,
  createRace,
  fetchManagedRaceOptions,
  updateRaceTableItem,
  updateManagedRaceOption,
} from '../services/racesTableService'
import {
  getRaceStatusColor,
  getRaceStatusLabel,
  RACE_STATUS_OPTIONS,
} from '../types/raceFilters'
import { translateRaceTypeName } from '../../../utils/raceTypeLocalization'
import type {
  ManagedRaceOptionType,
  RaceCreateOptions,
  CreateRacePayload,
  RaceDetailResponse,
  RaceTypeOption,
} from '../types/racesTable'
import styles from './AddRaceDrawer.module.css'

const { TextArea } = Input

type AddRaceDrawerProps = {
  createOptions: RaceCreateOptions
  onCreated: (payload?: CreateRacePayload) => void | Promise<void>
  onCreateOptionsChange?: (nextOptions: RaceCreateOptions) => void
  mode?: 'create' | 'edit'
  triggerLabel?: string
  triggerIconOnly?: boolean
  triggerClassName?: string
  manageOptionTriggerType?: ManagedRaceOptionType
  forceManageOptionType?: ManagedRaceOptionType | null
  onManageOptionModalClose?: () => void
  hideTrigger?: boolean
  open?: boolean
  raceId?: string | null
  initialRace?: RaceDetailResponse | null
  raceStatusOverride?: string | null
  raceStatusOverrideLabel?: string | null
  isLoadingInitialRace?: boolean
  onClose?: () => void
}

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
  ageGroupClassification?: number
  teamClassification?: number
  preRaceConfidence?: string
  raceDifficulty?: string
  finalSatisfaction?: string
  painInjuries?: string
  analysisNotes?: string
}

type DrawerInitialValues = Partial<AddRaceFormValues>
type DrawerTabKey = 'race' | 'results' | 'classifications' | 'analysis'

const ANALYSIS_SELECT_OPTIONS = [
  { value: 'VERY_LOW', labelKey: 'races.addEdit.analysisScale.veryLow' },
  { value: 'LOW', labelKey: 'races.addEdit.analysisScale.low' },
  { value: 'MEDIUM', labelKey: 'races.addEdit.analysisScale.medium' },
  { value: 'HIGH', labelKey: 'races.addEdit.analysisScale.high' },
  { value: 'VERY_HIGH', labelKey: 'races.addEdit.analysisScale.veryHigh' },
] as const

const INITIAL_FORM_VALUES: Partial<AddRaceFormValues> = {
  isValidForCategoryRanking: true,
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
  .sort((left, right) => CREATE_RACE_STATUS_ORDER.indexOf(left.value as typeof CREATE_RACE_STATUS_ORDER[number]) - CREATE_RACE_STATUS_ORDER.indexOf(right.value as typeof CREATE_RACE_STATUS_ORDER[number]))

const MANAGED_OPTION_CONFIG: Record<ManagedRaceOptionType, {
  titleKey: string
  labelKey: string
  selectPlaceholderKey: string
  emptyLabelKey: string
  emptyActionLabelKey: string
}> = {
  'race-types': {
    titleKey: 'pages.raceTypes',
    labelKey: 'races.addEdit.manageOptions.labels.raceType',
    selectPlaceholderKey: 'races.addEdit.selectPlaceholders.raceType',
    emptyLabelKey: 'races.addEdit.manageOptions.empty.raceTypes',
    emptyActionLabelKey: 'races.addEdit.manageOptions.emptyAction.raceTypes',
  },
  teams: {
    titleKey: 'pages.teams',
    labelKey: 'races.addEdit.manageOptions.labels.team',
    selectPlaceholderKey: 'races.addEdit.selectPlaceholders.team',
    emptyLabelKey: 'races.addEdit.manageOptions.empty.teams',
    emptyActionLabelKey: 'races.addEdit.manageOptions.emptyAction.teams',
  },
  circuits: {
    titleKey: 'pages.circuits',
    labelKey: 'races.addEdit.manageOptions.labels.circuit',
    selectPlaceholderKey: 'races.addEdit.selectPlaceholders.circuit',
    emptyLabelKey: 'races.addEdit.manageOptions.empty.circuits',
    emptyActionLabelKey: 'races.addEdit.manageOptions.emptyAction.circuits',
  },
  shoes: {
    titleKey: 'pages.shoes',
    labelKey: 'races.addEdit.manageOptions.labels.shoe',
    selectPlaceholderKey: 'races.addEdit.selectPlaceholders.shoe',
    emptyLabelKey: 'races.addEdit.manageOptions.empty.shoes',
    emptyActionLabelKey: 'races.addEdit.manageOptions.emptyAction.shoes',
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

const FIELD_TAB_MAP: Partial<Record<keyof AddRaceFormValues, DrawerTabKey>> = {
  raceStatus: 'race',
  raceDate: 'race',
  raceTime: 'race',
  name: 'race',
  location: 'race',
  teamId: 'race',
  circuitId: 'race',
  raceTypeId: 'race',
  realKm: 'results',
  elevation: 'results',
  isValidForCategoryRanking: 'race',
  officialTime: 'results',
  chipTime: 'results',
  pacePerKm: 'results',
  shoeId: 'results',
  generalClassification: 'classifications',
  ageGroupClassification: 'classifications',
  teamClassification: 'classifications',
  preRaceConfidence: 'analysis',
  raceDifficulty: 'analysis',
  finalSatisfaction: 'analysis',
  painInjuries: 'analysis',
  analysisNotes: 'analysis',
}

function getOptionTypeKey(optionType: ManagedRaceOptionType) {
  if (optionType === 'race-types') {
    return 'raceTypes'
  }

  return optionType
}

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

    if (minutes > 59 || seconds > 59) {
      throw new Error(`${fieldLabel ?? 'Time'} must use valid HH:MM:SS values.`)
    }

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (mode === 'pace' && parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error(`${fieldLabel ?? 'Pace'} must use MM:SS.`)
    }

    if (seconds > 59) {
      throw new Error(`${fieldLabel ?? 'Pace'} must use valid MM:SS values.`)
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration'
    ? `${fieldLabel ?? 'Time'} must use HH:MM:SS.`
    : `${fieldLabel ?? 'Pace'} must use MM:SS.`)
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

function shouldShowClassificationsTab(raceStatus: string | undefined) {
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

function parseDurationParts(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const parts = normalized.split(':').map((part) => Number(part))
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part) || part < 0)) {
    return { hours: 0, minutes: 0, seconds: 0 }
  }

  const [hours, minutes, seconds] = parts
  return { hours, minutes, seconds }
}

function formatDurationSegment(value: number) {
  return String(Math.max(0, value)).padStart(2, '0')
}

function buildDurationValue(hours: number, minutes: number, seconds: number) {
  return `${formatDurationSegment(hours)}:${formatDurationSegment(minutes)}:${formatDurationSegment(seconds)}`
}

function clampDurationValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function adjustDurationValue(
  currentValue: string | undefined,
  part: 'hours' | 'minutes' | 'seconds',
  delta: 1 | -1,
) {
  const parts = parseDurationParts(currentValue)

  if (part === 'hours') {
    return buildDurationValue(clampDurationValue(parts.hours + delta, 0, 99), parts.minutes, parts.seconds)
  }

  if (part === 'minutes') {
    return buildDurationValue(parts.hours, clampDurationValue(parts.minutes + delta, 0, 59), parts.seconds)
  }

  return buildDurationValue(parts.hours, parts.minutes, clampDurationValue(parts.seconds + delta, 0, 59))
}

function setDurationSegment(
  currentValue: string | undefined,
  part: 'hours' | 'minutes' | 'seconds',
  nextRawValue: string,
) {
  const parts = parseDurationParts(currentValue)
  const digitsOnly = nextRawValue.replace(/\D/g, '').slice(0, 2)
  const parsedValue = digitsOnly.length > 0 ? Number(digitsOnly) : 0

  if (part === 'hours') {
    return buildDurationValue(clampDurationValue(parsedValue, 0, 99), parts.minutes, parts.seconds)
  }

  if (part === 'minutes') {
    return buildDurationValue(parts.hours, clampDurationValue(parsedValue, 0, 59), parts.seconds)
  }

  return buildDurationValue(parts.hours, parts.minutes, clampDurationValue(parsedValue, 0, 59))
}

function formatPaceTextInput(rawValue: string | undefined) {
  const digits = (rawValue ?? '').replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
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

    const [, minutes, seconds] = parts.map((part) => Number(part))
    return minutes > 59 || seconds > 59
      ? `${fieldLabel} must use valid HH:MM:SS values.`
      : null
  }

  if (parts.length !== 2) {
    return null
  }

  const [, seconds] = parts.map((part) => Number(part))
  return seconds > 59
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
    ageGroupClassification: race.results.ageGroupClassification ?? undefined,
    teamClassification: race.results.teamClassification ?? undefined,
    preRaceConfidence: race.analysis.preRaceConfidence ?? undefined,
    raceDifficulty: race.analysis.raceDifficulty ?? undefined,
    finalSatisfaction: race.analysis.finalSatisfaction ?? undefined,
    painInjuries: race.analysis.painInjuries ?? undefined,
    analysisNotes: race.analysis.analysisNotes ?? undefined,
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
      ageGroupClassification: showResultsTab ? (values.ageGroupClassification ?? null) : null,
      teamClassification: showResultsTab ? (values.teamClassification ?? null) : null,
    },
    analysis: {
      preRaceConfidence: showAnalysisTab && shouldShowPreRaceConfidence(normalizedStatus) ? (values.preRaceConfidence ?? null) : null,
      raceDifficulty: showAnalysisTab && shouldShowRaceDifficulty(normalizedStatus) ? (values.raceDifficulty ?? null) : null,
      finalSatisfaction: showAnalysisTab && shouldShowFinalSatisfaction(normalizedStatus) ? (values.finalSatisfaction ?? null) : null,
      painInjuries: showAnalysisTab && shouldShowPainInjuries(normalizedStatus) && values.painInjuries?.trim()
        ? values.painInjuries.trim()
        : null,
      analysisNotes: showAnalysisTab && values.analysisNotes?.trim() ? values.analysisNotes.trim() : null,
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

type DurationComposerProps = {
  value?: string
  onChange?: (value: string) => void
}

function DurationComposer({ value, onChange }: DurationComposerProps) {
  const { t } = useTranslation()
  const [draftValue, setDraftValue] = useState(value ?? '00:00:00')
  const [focusedSegment, setFocusedSegment] = useState<'hours' | 'minutes' | 'seconds' | null>(null)
  const parts = parseDurationParts(draftValue)

  useEffect(() => {
    if ((value ?? '00:00:00') !== draftValue) {
      setDraftValue(value ?? '00:00:00')
    }
  }, [draftValue, value])

  const emitChange = (nextValue: string) => {
    setDraftValue(nextValue)
    startTransition(() => {
      onChange?.(nextValue)
    })
  }

  const handleAdjust = (part: 'hours' | 'minutes' | 'seconds', delta: 1 | -1) => {
    emitChange(adjustDurationValue(draftValue, part, delta))
  }
  const handleManualInput = (part: 'hours' | 'minutes' | 'seconds', nextRawValue: string, max: number) => {
    const parsedValue = Number.parseInt(nextRawValue, 10)
    const safeValue = Number.isNaN(parsedValue) ? 0 : clampDurationValue(parsedValue, 0, max)
    emitChange(setDurationSegment(draftValue, part, String(safeValue)))
  }

  return (
    <div className={`${styles.durationComposer} ${focusedSegment ? styles.durationComposerFocused : ''}`}>
      <div className={styles.durationColumn}>
        <span className={styles.durationUnitLabel}>{t('races.addEdit.duration.hoursShort')}</span>
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('hours', 1)} aria-label={t('races.addEdit.duration.increaseHours')}>
          <FontAwesomeIcon icon={faAngleUp} />
        </button>
        <input
          type="number"
          min={0}
          max={99}
          className={`${styles.durationValueInput} ${focusedSegment === 'hours' ? styles.durationValueInputActive : ''}`}
          value={formatDurationSegment(parts.hours)}
          onChange={(event) => handleManualInput('hours', event.target.value, 99)}
          onFocus={(event) => {
            setFocusedSegment('hours')
            event.target.select()
          }}
          onBlur={() => setFocusedSegment(null)}
          aria-label={t('races.addEdit.duration.hours')}
        />
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('hours', -1)} aria-label={t('races.addEdit.duration.decreaseHours')}>
          <FontAwesomeIcon icon={faAngleDown} />
        </button>
      </div>

      <span className={styles.durationDivider}>:</span>

      <div className={styles.durationColumn}>
        <span className={styles.durationUnitLabel}>{t('races.addEdit.duration.minutesShort')}</span>
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('minutes', 1)} aria-label={t('races.addEdit.duration.increaseMinutes')}>
          <FontAwesomeIcon icon={faAngleUp} />
        </button>
        <input
          type="number"
          min={0}
          max={59}
          className={`${styles.durationValueInput} ${focusedSegment === 'minutes' ? styles.durationValueInputActive : ''}`}
          value={formatDurationSegment(parts.minutes)}
          onChange={(event) => handleManualInput('minutes', event.target.value, 59)}
          onFocus={(event) => {
            setFocusedSegment('minutes')
            event.target.select()
          }}
          onBlur={() => setFocusedSegment(null)}
          aria-label={t('races.addEdit.duration.minutes')}
        />
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('minutes', -1)} aria-label={t('races.addEdit.duration.decreaseMinutes')}>
          <FontAwesomeIcon icon={faAngleDown} />
        </button>
      </div>

      <span className={styles.durationDivider}>:</span>

      <div className={styles.durationColumn}>
        <span className={styles.durationUnitLabel}>{t('races.addEdit.duration.secondsShort')}</span>
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('seconds', 1)} aria-label={t('races.addEdit.duration.increaseSeconds')}>
          <FontAwesomeIcon icon={faAngleUp} />
        </button>
        <input
          type="number"
          min={0}
          max={59}
          className={`${styles.durationValueInput} ${focusedSegment === 'seconds' ? styles.durationValueInputActive : ''}`}
          value={formatDurationSegment(parts.seconds)}
          onChange={(event) => handleManualInput('seconds', event.target.value, 59)}
          onFocus={(event) => {
            setFocusedSegment('seconds')
            event.target.select()
          }}
          onBlur={() => setFocusedSegment(null)}
          aria-label={t('races.addEdit.duration.seconds')}
        />
        <button type="button" className={styles.durationAdjustButton} onMouseDown={(event) => event.preventDefault()} onClick={() => handleAdjust('seconds', -1)} aria-label={t('races.addEdit.duration.decreaseSeconds')}>
          <FontAwesomeIcon icon={faAngleDown} />
        </button>
      </div>
    </div>
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
    return 'Future Races keeps this entry lightweight while you are only tracking a race you want to do.'
  }

  return ''
}

export function AddRaceDrawer({
  createOptions,
  onCreated,
  onCreateOptionsChange,
  mode = 'create',
  triggerLabel,
  triggerIconOnly = false,
  triggerClassName,
  manageOptionTriggerType,
  forceManageOptionType = null,
  onManageOptionModalClose,
  hideTrigger = false,
  open,
  raceId = null,
  initialRace = null,
  raceStatusOverride = null,
  raceStatusOverrideLabel = null,
  isLoadingInitialRace = false,
  onClose,
}: AddRaceDrawerProps) {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [form] = Form.useForm<AddRaceFormValues>()
  const effectiveTriggerLabel = triggerLabel ?? t('races.page.addRace')
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
  const [activeTabKey, setActiveTabKey] = useState<DrawerTabKey>('race')
  const [tabErrorKeys, setTabErrorKeys] = useState<DrawerTabKey[]>([])
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const baseInitialFormValues = useMemo(() => buildDrawerInitialValues(initialRace), [initialRace])
  const initialFormValues = useMemo(
    () => ({
      ...baseInitialFormValues,
      raceStatus: raceStatusOverride ?? baseInitialFormValues.raceStatus,
    }),
    [baseInitialFormValues, raceStatusOverride],
  )
  const isEditMode = mode === 'edit'
  const currentRaceStatus = Form.useWatch('raceStatus', form) ?? initialFormValues.raceStatus
  const selectedTeamId = Form.useWatch('teamId', form) ?? initialFormValues.teamId
  const watchedPacePerKm = Form.useWatch('pacePerKm', form) ?? initialFormValues.pacePerKm
  const hasSelectedStatus = isEditMode || Boolean(currentRaceStatus)
  const hasSelectedTeam = Boolean(selectedTeamId)
  const showDistanceFields = shouldShowDistanceFields(currentRaceStatus)
  const showResultsTab = shouldShowResultsTab(currentRaceStatus)
  const showClassificationsTab = shouldShowClassificationsTab(currentRaceStatus)
  const showAnalysisTab = shouldShowAnalysisTab(currentRaceStatus)
  const showShoeInRaceData = shouldShowShoeInRaceData(currentRaceStatus)
  const showPreRaceConfidence = shouldShowPreRaceConfidence(currentRaceStatus)
  const showRaceDifficulty = shouldShowRaceDifficulty(currentRaceStatus)
  const showFinalSatisfaction = shouldShowFinalSatisfaction(currentRaceStatus)
  const showPainInjuries = shouldShowPainInjuries(currentRaceStatus)
  const shouldPromptRaceDateForStatusOverride = Boolean(
    isEditMode
    && raceStatusOverride
    && isRaceDateRequired(raceStatusOverride)
    && !initialFormValues.raceDate,
  )
  const raceDateStatusOverrideMessage = shouldPromptRaceDateForStatusOverride
    ? t('races.addEdit.overrideRaceDateMessage', { status: raceStatusOverrideLabel ?? raceStatusOverride })
    : null

  const visibleTabKeys = useMemo<DrawerTabKey[]>(() => {
    const keys: DrawerTabKey[] = ['race']

    if (showResultsTab) {
      keys.push('results')
    }

    if (showClassificationsTab) {
      keys.push('classifications')
    }

    if (showAnalysisTab) {
      keys.push('analysis')
    }

    return keys
  }, [showAnalysisTab, showClassificationsTab, showResultsTab])

  const handlePaceMetricChange = (nextValue: string) => {
    const formattedValue = formatPaceTextInput(nextValue)
    form.setFieldValue('pacePerKm', formattedValue || undefined)
  }

  useEffect(() => {
    setLocalCreateOptions(createOptions)
  }, [createOptions])

  useEffect(() => {
    if (!forceManageOptionType) {
      return
    }

    void openManageOptionsModal(forceManageOptionType)
  }, [forceManageOptionType])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveTabKey('race')
    setTabErrorKeys([])
    form.resetFields()
    form.setFieldsValue(initialFormValues)
    setError(null)

    if (raceDateStatusOverrideMessage) {
      form.setFields([{
        name: 'raceDate',
        errors: [raceDateStatusOverrideMessage],
      }])
    }
  }, [form, initialFormValues, isOpen, raceDateStatusOverrideMessage])

  useEffect(() => {
    setTabErrorKeys((current) => current.filter((tabKey) => visibleTabKeys.includes(tabKey)))

    if (!visibleTabKeys.includes(activeTabKey)) {
      setActiveTabKey('race')
    }
  }, [activeTabKey, visibleTabKeys])

  const syncCreateOptions = (nextOptions: RaceCreateOptions, options?: { propagateToParent?: boolean }) => {
    setLocalCreateOptions(nextOptions)

    if (options?.propagateToParent !== false) {
      onCreateOptionsChange?.(nextOptions)
    }
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

  const replaceOptionsForType = (
    optionType: ManagedRaceOptionType,
    nextValues: RaceTypeOption[],
    options?: { propagateToParent?: boolean },
  ) => {
    const nextOptions: RaceCreateOptions = {
      ...localCreateOptions,
      raceTypes: optionType === 'race-types' ? nextValues : localCreateOptions.raceTypes,
      teams: optionType === 'teams' ? nextValues : localCreateOptions.teams,
      circuits: optionType === 'circuits' ? nextValues : localCreateOptions.circuits,
      shoes: optionType === 'shoes' ? nextValues : localCreateOptions.shoes,
    }
    syncCreateOptions(nextOptions, options)
  }

  const resetManagedOptionState = () => {
    setManagedOptionName('')
    setManagedOptionTargetKm(null)
    setEditingManagedOptionId(null)
    setManagedOptionError(null)
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
      const latestOptions = await fetchManagedRaceOptions(optionType, token, true)
      replaceOptionsForType(optionType, latestOptions, { propagateToParent: false })
    } catch (loadError) {
      setManagedOptionError(loadError instanceof Error ? loadError.message : 'Could not load these options right now.')
    }
  }

  const closeManageOptionsModal = () => {
    setIsManageOptionsModalOpen(false)
    resetManagedOptionState()
    onManageOptionModalClose?.()
  }

  const clearFieldError = (fieldName: keyof AddRaceFormValues) => {
    form.setFields([{ name: fieldName, errors: [] }])
  }

  const setFieldError = (fieldName: keyof AddRaceFormValues, message: string | null) => {
    form.setFields([{ name: fieldName, errors: message ? [message] : [] }])
  }

  const refreshTabErrors = () => {
    const nextTabErrorKeys = new Set<DrawerTabKey>()

    form.getFieldsError().forEach((fieldError) => {
      if (fieldError.errors.length === 0) {
        return
      }

      const rawFieldName = fieldError.name[0]
      if (typeof rawFieldName !== 'string') {
        return
      }

      const mappedTab = FIELD_TAB_MAP[rawFieldName as keyof AddRaceFormValues]
      if (mappedTab && visibleTabKeys.includes(mappedTab)) {
        nextTabErrorKeys.add(mappedTab)
      }
    })

    setTabErrorKeys(Array.from(nextTabErrorKeys))
  }

  const renderTabLabel = (tabKey: DrawerTabKey, label: string) => (
    <span className={styles.tabLabel}>
      <span>{label}</span>
      {tabErrorKeys.includes(tabKey) ? (
        <span className={styles.tabWarningBadge} aria-label={t('races.addEdit.tabs.missingFieldsAria', { tab: label })}>
          !
        </span>
      ) : null}
    </span>
  )

  const closeDrawer = () => {
    if (!isControlled) {
      setInternalOpen(false)
    }

    onClose?.()
    setIsDiscardModalOpen(false)
    setError(null)
    closeManageOptionsModal()
  }

  const handleSaveManagedOption = async () => {
    if (!token) {
      return
    }

    try {
      setIsManagedOptionSubmitting(true)
      setManagedOptionError(null)

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

      replaceOptionsForType(managedOptionType, nextOptions, { propagateToParent: false })

      const linkedField = Object.entries(FIELD_OPTION_TYPES).find(([, value]) => value === managedOptionType)?.[0] as keyof AddRaceFormValues | undefined
      if (linkedField) {
        form.setFieldValue(linkedField, savedOption.id)
      }

      setManagedOptionName('')
      setManagedOptionTargetKm(null)
      setEditingManagedOptionId(null)

      if (!editingManagedOptionId) {
        void messageApi.success(t('races.addEdit.manageOptions.addSuccess', { label: t(MANAGED_OPTION_CONFIG[managedOptionType].labelKey) }))
      }
    } catch (saveError) {
      setManagedOptionError(saveError instanceof Error ? saveError.message : 'Could not save this option right now.')
    } finally {
      setIsManagedOptionSubmitting(false)
    }
  }

  const renderManagedSelect = (
    fieldName: 'raceTypeId' | 'teamId' | 'circuitId' | 'shoeId',
    label: ReactNode,
    optionType: ManagedRaceOptionType,
    className?: string,
    required = false,
  ) => {
    const config = MANAGED_OPTION_CONFIG[optionType]
    const optionTitle = t(config.titleKey)
    const optionLabel = t(config.labelKey)
    const options = getOptionsForType(optionType)

    return (
      <div className={`${styles.managedField} ${className ?? ''}`.trim()}>
        <Form.Item<AddRaceFormValues> label={label}>
          <div className={styles.managedFieldRow}>
            <Form.Item<AddRaceFormValues>
              name={fieldName}
              noStyle
              rules={required ? [{ required: true, message: t('races.addEdit.validation.required', { field: optionLabel }) }] : undefined}
            >
              <Select
                allowClear
                showSearch
                placeholder={t(config.selectPlaceholderKey)}
                optionFilterProp="label"
                notFoundContent={(
                  <div className={styles.selectEmptyState}>
                    <span className={styles.selectEmptyText}>{t(config.emptyLabelKey)}</span>
                    <button
                      type="button"
                      className={styles.selectEmptyAction}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        void openManageOptionsModal(optionType)
                      }}
                    >
                      {t(config.emptyActionLabelKey)}
                    </button>
                  </div>
                )}
                options={options.map((option) => ({
                  value: option.id,
                  label: optionType === 'race-types' ? translateRaceTypeName(option.name, t) : option.name,
                }))}
              />
            </Form.Item>
            <button
              type="button"
              className={styles.addManagedOptionButton}
              onClick={() => void openManageOptionsModal(optionType)}
              aria-label={t('races.addEdit.manageOptions.manageAria', { title: optionTitle.toLowerCase() })}
            >
              <FontAwesomeIcon icon={faPlus} />
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
      refreshTabErrors()

      if (isEditMode && !hasUnsavedChanges(values, initialFormValues)) {
        closeDrawer()
        return
      }

      setIsSubmitting(true)
      setError(null)

      const payload = buildRacePayload(values, isEditMode ? initialRace : null)

      if (isEditMode && raceId) {
        await updateRaceTableItem(raceId, payload, token)
      } else {
        await createRace(payload, token)
      }

      await onCreated(payload)
      closeDrawer()
    } catch (submitError) {
      refreshTabErrors()

      if (submitError instanceof Error && !('errorFields' in submitError)) {
        const fieldName = getFieldNameFromError(submitError.message)
        if (fieldName) {
          form.setFields([{ name: fieldName, errors: [submitError.message] }])
          refreshTabErrors()
          setError(null)
          return
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
      {messageContextHolder}
      {!isEditMode && !hideTrigger ? (
        <Button
          type={manageOptionTriggerType ? 'text' : 'primary'}
          className={triggerClassName ?? styles.trigger}
          icon={<FontAwesomeIcon icon={manageOptionTriggerType ? faPenToSquare : faPlus} />}
          aria-label={effectiveTriggerLabel}
          onClick={() => {
            if (manageOptionTriggerType) {
              void openManageOptionsModal(manageOptionTriggerType)
              return
            }

            setInternalOpen(true)
          }}
        >
          {triggerIconOnly ? null : effectiveTriggerLabel}
        </Button>
      ) : null}

      <Drawer
        title={isEditMode ? t('races.addEdit.editTitle') : t('races.addEdit.addTitle')}
        placement="right"
        width={560}
        open={isOpen}
        onClose={handleClose}
        zIndex={1200}
        className={styles.drawer}
        destroyOnHidden
        extra={(
          <Space>
            <Button className={styles.cancelButton} onClick={handleClose}>{t('common.cancel')}</Button>
            <Button className={styles.saveButton} type="primary" loading={isSubmitting} onClick={() => void handleSubmit()}>
              {isEditMode ? t('races.addEdit.actions.saveChanges') : t('races.addEdit.actions.saveRace')}
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

        {isEditMode && isLoadingInitialRace && !initialRace ? (
          <div className={styles.initialLoadingState}>
            <Spin size="large" />
            <span className={styles.initialLoadingText}>Loading race editor</span>
          </div>
        ) : (
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

            if ('teamId' in changedValues && !changedValues.teamId) {
              form.setFieldValue('teamClassification', undefined)
            }

            queueMicrotask(() => {
              refreshTabErrors()
            })
          }}
        >
          <Tabs
            key={i18n.resolvedLanguage}
            activeKey={activeTabKey}
            onChange={(key) => setActiveTabKey(key as DrawerTabKey)}
            items={[
              {
                key: 'race',
                label: renderTabLabel('race', t('races.addEdit.tabs.race')),
                forceRender: true,
                children: (
                  <div className={styles.tabPane}>
                    <div className={styles.statusHighlightCard}>
                      <div className={styles.statusHighlightHeader}>
                        <span className={styles.statusHighlightTitle}>
                          <span aria-hidden="true" className={styles.statusHighlightRequired}>*</span>
                          {t('races.addEdit.fields.raceStatus')}
                        </span>
                      </div>

                      <Form.Item<AddRaceFormValues>
                        name="raceStatus"
                        rules={[{ required: true, message: t('races.addEdit.statusRequired') }]}
                        className={styles.statusHighlightField}
                      >
                        <Select
                          placeholder={t('races.addEdit.selectStatusFirst')}
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
                                {status.value === 'IN_LIST'
                                  ? t('races.status.addToFuture')
                                  : getRaceStatusLabel(status.value, t)}
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
                        <Form.Item<AddRaceFormValues> name="isValidForCategoryRanking" hidden>
                          <Input />
                        </Form.Item>

                        {raceDateStatusOverrideMessage ? (
                          <div className={styles.statusHighlightHint}>
                            <span className={styles.statusHighlightHintIcon} aria-hidden="true">i</span>
                            <span>{raceDateStatusOverrideMessage}</span>
                          </div>
                        ) : null}

                        <div className={styles.row}>
                          <Form.Item noStyle dependencies={['raceStatus']}>
                            {({ getFieldValue }) => (
                              <Form.Item<AddRaceFormValues>
                                label={(
                                  <>
                                    {isRaceDateRequired(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                    {t('races.addEdit.fields.raceDate')}
                                  </>
                                )}
                                name="raceDate"
                                className={[
                                  styles.rowItem,
                                  raceDateStatusOverrideMessage ? styles.emphasizedField : '',
                                ].join(' ').trim()}
                                rules={[
                                  {
                                    validator: (_, value) => (
                                      !isRaceDateRequired(getFieldValue('raceStatus')) || value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error(t('races.addEdit.validation.required', { field: t('races.addEdit.fields.raceDate') })))
                                    ),
                                  },
                                ]}
                              >
                                <DatePicker format="YYYY-MM-DD" className={styles.fullWidth} />
                              </Form.Item>
                            )}
                          </Form.Item>

                          <Form.Item<AddRaceFormValues>
                            label={renderInfoLabel(t('races.addEdit.fields.raceTime'), t('races.addEdit.tooltips.raceTime'))}
                            name="raceTime"
                            className={styles.rowItem}
                          >
                            <TimePicker use12Hours format="hh:mm A" minuteStep={5} className={styles.fullWidth} />
                          </Form.Item>
                        </div>

                        <Form.Item<AddRaceFormValues>
                          label={t('races.addEdit.fields.raceName')}
                          name="name"
                          rules={[{ required: true, message: t('races.addEdit.validation.required', { field: t('races.addEdit.fields.raceName') }) }]}
                        >
                          <Input maxLength={150} placeholder={t('races.addEdit.placeholders.raceName')} />
                        </Form.Item>

                        <div className={styles.row}>
                          <Form.Item<AddRaceFormValues> label={t('races.addEdit.fields.location')} name="location" className={styles.rowItem}>
                            <Input maxLength={150} placeholder={t('races.addEdit.placeholders.location')} />
                          </Form.Item>

                          {renderManagedSelect(
                            'raceTypeId',
                            (
                              <>
                                <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
                                {renderInfoLabel(t('races.addEdit.fields.raceType'), t('races.addEdit.tooltips.raceType'))}
                              </>
                            ),
                            'race-types',
                            styles.rowItem,
                            true,
                          )}
                        </div>

                        <div className={styles.row}>
                          {renderManagedSelect('teamId', renderInfoLabel(t('races.addEdit.fields.team'), t('races.addEdit.tooltips.team')), 'teams', styles.rowItem)}

                          {renderManagedSelect('circuitId', renderInfoLabel(t('races.addEdit.fields.circuit'), t('races.addEdit.tooltips.circuit')), 'circuits', styles.rowItem)}
                        </div>

                        {showDistanceFields && !showResultsTab ? (
                          <div className={styles.row}>
                            <Form.Item noStyle dependencies={['raceStatus']}>
                              {({ getFieldValue }) => (
                                <Form.Item<AddRaceFormValues>
                                  label={(
                                    <>
                                      {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                      {renderInfoLabel(t('races.addEdit.fields.realKm'), t('races.addEdit.tooltips.realKm'))}
                                    </>
                                  )}
                                  name="realKm"
                                  className={styles.rowItem}
                                  rules={[
                                    {
                                      validator: (_, value) => (
                                        !isCompletedStatus(getFieldValue('raceStatus')) || value != null
                                          ? Promise.resolve()
                                          : Promise.reject(new Error(t('races.addEdit.validation.requiredWhenCompleted', { field: t('races.addEdit.fields.realKm') })))
                                      ),
                                    },
                                  ]}
                                >
                                  <InputNumber
                                    min={0}
                                    max={999999.99}
                                    precision={2}
                                    step={0.01}
                                    className={styles.fullWidth}
                                    placeholder={t('races.addEdit.placeholders.targetKm')}
                                    parser={(value) => parseDecimalNumberInput(value)}
                                  />
                                </Form.Item>
                              )}
                            </Form.Item>

                            <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.elevation'), t('races.addEdit.tooltips.elevation'))} name="elevation" className={styles.rowItem}>
                              <InputNumber min={0} className={styles.fullWidth} placeholder={t('races.addEdit.placeholders.elevation')} />
                            </Form.Item>
                          </div>
                        ) : null}

                        {showShoeInRaceData
                          ? renderManagedSelect('shoeId', renderInfoLabel(t('races.addEdit.fields.shoe'), t('races.addEdit.tooltips.shoeRaceData')), 'shoes', styles.rowItem)
                          : null}

                      </>
                    ) : (
                      <div className={styles.statusWaitingState}>
                        {t('races.addEdit.chooseStatusHint')}
                      </div>
                    )}
                  </div>
                ),
              },
              ...(showResultsTab ? [{
                key: 'results',
                label: renderTabLabel('results', t('races.addEdit.tabs.results')),
                forceRender: true,
                children: (
                  <div className={styles.tabPane}>
                    <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.officialTime'), t('races.addEdit.tooltips.officialTime'))} name="officialTime" className={styles.rowItem}>
                      <DurationComposer />
                    </Form.Item>

                    <Form.Item noStyle dependencies={['raceStatus']}>
                      {({ getFieldValue }) => (
                        <Form.Item<AddRaceFormValues>
                          label={(
                            <>
                              {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                              {renderInfoLabel(t('races.addEdit.fields.chipTime'), t('races.addEdit.tooltips.chipTime'))}
                            </>
                          )}
                          name="chipTime"
                          className={styles.rowItem}
                          rules={[
                            {
                              validator: (_, value) => (
                                !isCompletedStatus(getFieldValue('raceStatus')) || String(value ?? '').trim().length > 0
                                  ? Promise.resolve()
                                  : Promise.reject(new Error(t('races.addEdit.validation.requiredWhenCompleted', { field: t('races.addEdit.fields.chipTime') })))
                              ),
                            },
                          ]}
                        >
                          <DurationComposer />
                        </Form.Item>
                      )}
                    </Form.Item>

                    <Form.Item<AddRaceFormValues> name="pacePerKm" hidden>
                      <Input />
                    </Form.Item>

                    <div className={styles.row}>
                      <Form.Item noStyle dependencies={['raceStatus']}>
                        {({ getFieldValue }) => (
                          <Form.Item<AddRaceFormValues>
                            label={(
                              <>
                                {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                {renderInfoLabel(t('races.addEdit.fields.realKm'), t('races.addEdit.tooltips.realKm'))}
                              </>
                            )}
                            name="realKm"
                            className={styles.rowItem}
                            rules={[
                              {
                                validator: (_, value) => (
                                  !isCompletedStatus(getFieldValue('raceStatus')) || value != null
                                    ? Promise.resolve()
                                    : Promise.reject(new Error(t('races.addEdit.validation.requiredWhenCompleted', { field: t('races.addEdit.fields.realKm') })))
                                ),
                              },
                            ]}
                          >
                            <InputNumber
                              min={0}
                              max={999999.99}
                              precision={2}
                              step={0.01}
                              className={styles.fullWidth}
                              placeholder={t('races.addEdit.placeholders.targetKm')}
                              parser={(value) => parseDecimalNumberInput(value)}
                            />
                          </Form.Item>
                        )}
                      </Form.Item>

                      <Form.Item noStyle dependencies={['raceStatus']}>
                        {({ getFieldValue }) => (
                          <Form.Item<AddRaceFormValues>
                            label={(
                              <>
                                {isCompletedStatus(getFieldValue('raceStatus')) ? <span aria-hidden="true" style={{ color: '#ff4d4f', marginRight: 4 }}>*</span> : null}
                                {renderInfoLabel(t('races.addEdit.fields.pacePerKm'), t('races.addEdit.tooltips.pacePerKm'))}
                              </>
                            )}
                            name="pacePerKm"
                            className={styles.rowItem}
                            rules={[
                              {
                                validator: (_, value) => (
                                  !isCompletedStatus(getFieldValue('raceStatus')) || String(value ?? '').trim().length > 0
                                    ? Promise.resolve()
                                    : Promise.reject(new Error(t('races.addEdit.validation.requiredWhenCompleted', { field: t('races.addEdit.fields.pacePerKm') })))
                                ),
                              },
                            ]}
                          >
                            <Input
                              inputMode="numeric"
                              maxLength={5}
                              placeholder={t('races.addEdit.placeholders.targetTime')}
                              value={watchedPacePerKm}
                              onChange={(event) => handlePaceMetricChange(event.target.value)}
                            />
                          </Form.Item>
                        )}
                      </Form.Item>
                    </div>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues>
                        label={renderInfoLabel(t('races.addEdit.fields.elevation'), t('races.addEdit.tooltips.elevation'))}
                        name="elevation"
                        className={styles.rowItem}
                      >
                        <InputNumber min={0} className={styles.fullWidth} placeholder={t('races.addEdit.placeholders.elevation')} />
                      </Form.Item>

                      {renderManagedSelect('shoeId', renderInfoLabel(t('races.addEdit.fields.shoe'), t('races.addEdit.tooltips.shoeResult')), 'shoes', styles.rowItem)}
                    </div>
                  </div>
                ),
              }] : []),
              ...(showClassificationsTab ? [{
                key: 'classifications',
                label: renderTabLabel('classifications', t('races.addEdit.tabs.classifications')),
                forceRender: true,
                children: (
                  <div className={styles.tabPane}>
                    <div className={styles.row}>
                      <div className={styles.classificationBlock}>
                        <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.generalClassification'), t('races.addEdit.tooltips.generalClassification'))} name="generalClassification" className={styles.rowItem}>
                          <InputNumber min={1} className={styles.fullWidth} />
                        </Form.Item>
                      </div>

                      <div className={styles.classificationBlock}>
                        <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.ageGroupClassification'), t('races.addEdit.tooltips.ageGroupClassification'))} name="ageGroupClassification" className={styles.rowItem}>
                          <InputNumber min={1} className={styles.fullWidth} />
                        </Form.Item>
                      </div>
                    </div>

                    <div className={styles.classificationBlock}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.teamClassification'), t('races.addEdit.tooltips.teamClassification'))} name="teamClassification">
                        <InputNumber min={1} className={styles.fullWidth} disabled={!hasSelectedTeam} placeholder={hasSelectedTeam ? undefined : t('races.addEdit.placeholders.selectTeamFirst')} />
                      </Form.Item>
                    </div>
                  </div>
                ),
              }] : []),
              ...(showAnalysisTab ? [{
                key: 'analysis',
                label: renderTabLabel('analysis', t('races.addEdit.tabs.analysis')),
                forceRender: true,
                children: (
                  <div className={styles.tabPane}>
                    {showPreRaceConfidence || showRaceDifficulty ? (
                      <div className={styles.row}>
                        {showPreRaceConfidence ? (
                          <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.preRaceConfidence'), t('races.addEdit.tooltips.preRaceConfidence'))} name="preRaceConfidence" className={styles.rowItem}>
                            <Select
                              allowClear
                              options={ANALYSIS_SELECT_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
                            />
                          </Form.Item>
                        ) : null}

                        {showRaceDifficulty ? (
                          <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.raceDifficulty'), t('races.addEdit.tooltips.raceDifficulty'))} name="raceDifficulty" className={styles.rowItem}>
                            <Select
                              allowClear
                              options={ANALYSIS_SELECT_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
                            />
                          </Form.Item>
                        ) : null}
                      </div>
                    ) : null}

                    {showFinalSatisfaction ? (
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel(t('races.addEdit.fields.finalSatisfaction'), t('races.addEdit.tooltips.finalSatisfaction'))} name="finalSatisfaction">
                        <Select
                          allowClear
                          options={ANALYSIS_SELECT_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
                        />
                      </Form.Item>
                    ) : null}

                    {showPainInjuries ? (
                      <Form.Item<AddRaceFormValues> label={t('races.addEdit.fields.painInjuries')} name="painInjuries">
                        <TextArea rows={3} placeholder={t('races.addEdit.placeholders.painNotes')} />
                      </Form.Item>
                    ) : null}

                    <Form.Item<AddRaceFormValues> label={t('races.addEdit.fields.analysisNotes')} name="analysisNotes">
                      <TextArea rows={12} placeholder={t('races.addEdit.placeholders.postRaceNotes')} />
                    </Form.Item>

                  </div>
                ),
              }] : []),
            ]}
          />
        </Form>
        )}

        <Modal
          title={t('races.addEdit.discardTitle')}
          open={isDiscardModalOpen}
          zIndex={1300}
          okText={t('races.addEdit.actions.discard')}
          cancelText={t('races.addEdit.actions.keepEditing')}
          okButtonProps={{ danger: true }}
          cancelButtonProps={{ className: styles.cancelButton }}
          onOk={closeDrawer}
          onCancel={() => setIsDiscardModalOpen(false)}
        >
          <p>{t('races.addEdit.discardBody')}</p>
        </Modal>

      </Drawer>

      <Drawer
          className={styles.manageOptionsDialog}
          title={t('personalOptions.drawer.addTitle', { item: t(MANAGED_OPTION_CONFIG[managedOptionType].labelKey) })}
          open={isManageOptionsModalOpen}
          zIndex={1300}
          width={560}
          placement="right"
          destroyOnHidden
          onClose={closeManageOptionsModal}
          extra={(
            <Space>
              <Button className={styles.cancelButton} onClick={closeManageOptionsModal}>{t('common.cancel')}</Button>
              <Button
                type="primary"
                className={styles.saveButton}
                loading={isManagedOptionSubmitting}
                disabled={isManagedOptionSaveDisabled}
                onClick={() => void handleSaveManagedOption()}
              >
                {t('personalOptions.actions.addShort')}
              </Button>
            </Space>
          )}
        >
          <div className={styles.manageOptionsModal}>
            {managedOptionError ? (
              <Alert
                type="error"
                showIcon
                message={t('races.addEdit.manageOptions.saveError', { label: t(MANAGED_OPTION_CONFIG[managedOptionType].labelKey) })}
                description={managedOptionError}
              />
            ) : null}

            <div className={styles.manageOptionsForm}>
              <label className={styles.manageFieldGroup}>
                <span className={styles.manageFieldLabel}>
                  <span className={styles.requiredMark} aria-hidden="true">*</span>
                  <span>{t('personalOptions.fields.name')}</span>
                </span>
                <Input
                  value={managedOptionName}
                  maxLength={100}
                  placeholder={t(`personalOptions.options.${getOptionTypeKey(managedOptionType)}.inputPlaceholder`)}
                  onChange={(event) => setManagedOptionName(event.target.value)}
                />
              </label>

              {managedOptionType === 'race-types' ? (
                <label className={styles.manageFieldGroup}>
                  <span className={styles.manageFieldLabel}>
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
                    className={styles.manageTargetInput}
                    placeholder={t('personalOptions.fields.targetKm')}
                    value={managedOptionTargetKm ?? undefined}
                    parser={(value) => parseDecimalNumberInput(value)}
                    onChange={(value) => setManagedOptionTargetKm(typeof value === 'number' ? value : null)}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </Drawer>

    </>
  )
}
