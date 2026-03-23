import { FontAwesome6 } from '@expo/vector-icons'
import { useState } from 'react'
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
import { createRace } from '../services/racesTableService'
import { RACE_STATUS_OPTIONS } from '../types/raceFilters'
import type { CreateRacePayload, RaceTypeOption } from '../types/racesTable'

type AddRaceModalProps = {
  token: string
  raceTypes: RaceTypeOption[]
  onCreated: () => void
}

type AddRaceTab = 'race' | 'results' | 'analysis'

type AddRaceFormState = {
  raceStatus: string
  raceDate: string
  raceTime: string
  name: string
  location: string
  raceTypeId: string
  realKm: string
  elevation: string
  isValidForCategoryRanking: boolean
  officialTime: string
  chipTime: string
  pacePerKm: string
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
type DateDraft = { year: number; month: number; day: number }
type TimeDraft = { hour: number; minute: number; second: number }

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
  raceTypeId: '',
  realKm: '',
  elevation: '',
  isValidForCategoryRanking: true,
  officialTime: '',
  chipTime: '',
  pacePerKm: '',
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

    return (hours * 3600) + (minutes * 60) + seconds
  }

  if (mode === 'pace' && parts.length === 2) {
    const [minutes, seconds] = parts.map((part) => Number(part))
    if ([minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Pace must use MM:SS.')
    }

    return (minutes * 60) + seconds
  }

  throw new Error(mode === 'duration' ? 'Duration must use HH:MM:SS.' : 'Pace must use MM:SS.')
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

export function AddRaceModal({ token, raceTypes, onCreated }: AddRaceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AddRaceTab>('race')
  const [formState, setFormState] = useState<AddRaceFormState>(INITIAL_FORM_STATE)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false)
  const [isRaceTypeSelectorOpen, setIsRaceTypeSelectorOpen] = useState(false)
  const [selectorField, setSelectorField] = useState<AnalysisField | null>(null)
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false)
  const [isTimeSelectorOpen, setIsTimeSelectorOpen] = useState(false)
  const [dateDraft, setDateDraft] = useState<DateDraft>(() => parseDateDraft(''))
  const [timeDraft, setTimeDraft] = useState<TimeDraft>(() => parseTimeDraft(''))

  const closeModal = () => {
    setIsOpen(false)
    setActiveTab('race')
    setFormState(INITIAL_FORM_STATE)
    setErrorMessage(null)
    setIsStatusSelectorOpen(false)
    setIsRaceTypeSelectorOpen(false)
    setSelectorField(null)
    setIsDateSelectorOpen(false)
    setIsTimeSelectorOpen(false)
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
    if (!formState.raceDate.trim()) {
      setErrorMessage('Race date is required.')
      setActiveTab('race')
      return
    }

    if (!formState.name.trim()) {
      setErrorMessage('Race name is required.')
      setActiveTab('race')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)

      const payload: CreateRacePayload = {
        race: {
          raceStatus: formState.raceStatus,
          raceDate: formState.raceDate.trim(),
          raceTime: formState.raceTime.trim() ? formState.raceTime.trim() : null,
          name: formState.name.trim(),
          location: formState.location.trim() ? formState.location.trim() : null,
          raceTypeId: formState.raceTypeId || null,
          realKm: parseNumber(formState.realKm),
          elevation: parseNumber(formState.elevation),
          isValidForCategoryRanking: formState.isValidForCategoryRanking,
        },
        results: {
          officialTimeSeconds: parseTimeToSeconds(formState.officialTime, 'duration'),
          chipTimeSeconds: parseTimeToSeconds(formState.chipTime, 'duration'),
          pacePerKmSeconds: parseTimeToSeconds(formState.pacePerKm, 'pace'),
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
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create this race right now.')
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

  const renderField = (
    label: string,
    value: string,
    onChangeText: (nextValue: string) => void,
    placeholder: string,
    options?: { multiline?: boolean; keyboardType?: 'default' | 'numeric'; required?: boolean }
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {options?.required ? <Text style={styles.requiredMark}>* </Text> : null}
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98a2b3"
        style={[styles.fieldInput, options?.multiline ? styles.fieldInputMultiline : null]}
        multiline={options?.multiline}
        keyboardType={options?.keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  )

  const renderSelectorField = (label: string, value: string, onPress: () => void, placeholder: string) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectTrigger} onPress={onPress}>
        <Text style={[styles.selectTriggerLabel, !value ? styles.selectTriggerPlaceholder : null]}>
          {value || placeholder}
        </Text>
        <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  )

  const renderRequiredSelectorField = (label: string, value: string, onPress: () => void, placeholder: string) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        <Text style={styles.requiredMark}>* </Text>
        {label}
      </Text>
      <Pressable style={styles.selectTrigger} onPress={onPress}>
        <Text style={[styles.selectTriggerLabel, !value ? styles.selectTriggerPlaceholder : null]}>
          {value || placeholder}
        </Text>
        <FontAwesome6 name="angle-down" size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  )

  const analysisValueLabel = selectorField
    ? ANALYSIS_OPTIONS.find((option) => option.value === formState[selectorField])?.label ?? ''
    : ''

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
                  'Race status',
                  RACE_STATUS_OPTIONS.find((option) => option.value === formState.raceStatus)?.label ?? '',
                  () => setIsStatusSelectorOpen(true),
                  'Select race status',
                )}
                {renderRequiredSelectorField(
                  'Race date',
                  formState.raceDate,
                  () => {
                    setDateDraft(parseDateDraft(formState.raceDate))
                    setIsDateSelectorOpen(true)
                  },
                  'Select date',
                )}
                {renderSelectorField(
                  'Race time',
                  formState.raceTime,
                  () => {
                    setTimeDraft(parseTimeDraft(formState.raceTime))
                    setIsTimeSelectorOpen(true)
                  },
                  'Select time',
                )}
                {renderField('Race name', formState.name, (value) => setFormState((current) => ({ ...current, name: value })), 'Lisbon Half Marathon', { required: true })}
                {renderField('Location', formState.location, (value) => setFormState((current) => ({ ...current, location: value })), 'Lisbon')}
                {renderSelectorField(
                  'Race type',
                  raceTypes.find((raceType) => raceType.id === formState.raceTypeId)?.name ?? '',
                  () => setIsRaceTypeSelectorOpen(true),
                  'Select race type',
                )}
                {renderField('Real KM', formState.realKm, (value) => setFormState((current) => ({ ...current, realKm: value })), '21.10', { keyboardType: 'numeric' })}
                {renderField('Elevation', formState.elevation, (value) => setFormState((current) => ({ ...current, elevation: value })), '250', { keyboardType: 'numeric' })}
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
                {renderField('Official time', formState.officialTime, (value) => setFormState((current) => ({ ...current, officialTime: value })), 'HH:MM:SS')}
                {renderField('Chip time', formState.chipTime, (value) => setFormState((current) => ({ ...current, chipTime: value })), 'HH:MM:SS')}
                {renderField('Pace per KM', formState.pacePerKm, (value) => setFormState((current) => ({ ...current, pacePerKm: value })), 'MM:SS')}
                {renderField('General classification', formState.generalClassification, (value) => setFormState((current) => ({ ...current, generalClassification: value })), '1', { keyboardType: 'numeric' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isGeneralClassificationPodium: !current.isGeneralClassificationPodium }))}>
                  <View style={[styles.checkbox, formState.isGeneralClassificationPodium ? styles.checkboxCheckedBlack : null]}>
                    {formState.isGeneralClassificationPodium ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>General classification podium</Text>
                </Pressable>
                {renderField('Age group classification', formState.ageGroupClassification, (value) => setFormState((current) => ({ ...current, ageGroupClassification: value })), '1', { keyboardType: 'numeric' })}
                <Pressable style={styles.checkboxRow} onPress={() => setFormState((current) => ({ ...current, isAgeGroupClassificationPodium: !current.isAgeGroupClassificationPodium }))}>
                  <View style={[styles.checkbox, formState.isAgeGroupClassificationPodium ? styles.checkboxCheckedBlack : null]}>
                    {formState.isAgeGroupClassificationPodium ? <FontAwesome6 name="check" size={10} color="#ffffff" /> : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Age group podium</Text>
                </Pressable>
                {renderField('Team classification', formState.teamClassification, (value) => setFormState((current) => ({ ...current, teamClassification: value })), '1', { keyboardType: 'numeric' })}
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
                  'Pre-race confidence',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.preRaceConfidence)?.label ?? '',
                  () => setSelectorField('preRaceConfidence'),
                  'Select value',
                )}
                {renderSelectorField(
                  'Race difficulty',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.raceDifficulty)?.label ?? '',
                  () => setSelectorField('raceDifficulty'),
                  'Select value',
                )}
                {renderSelectorField(
                  'Final satisfaction',
                  ANALYSIS_OPTIONS.find((option) => option.value === formState.finalSatisfaction)?.label ?? '',
                  () => setSelectorField('finalSatisfaction'),
                  'Select value',
                )}
                {renderField('Pain / injuries', formState.painInjuries, (value) => setFormState((current) => ({ ...current, painInjuries: value })), 'Notes about pain or injuries', { multiline: true })}
                {renderField('Analysis notes', formState.analysisNotes, (value) => setFormState((current) => ({ ...current, analysisNotes: value })), 'Post-race thoughts and notes', { multiline: true })}
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
                    setFormState((current) => ({ ...current, raceStatus: option.value }))
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
                setFormState((current) => ({ ...current, raceDate: formatDateDraft(dateDraft) }))
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
                setFormState((current) => ({ ...current, raceTime: formatTimeDraft(timeDraft) }))
                setIsTimeSelectorOpen(false)
              }}>
                <Text style={styles.saveActionLabel}>Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isRaceTypeSelectorOpen} transparent animationType="fade" onRequestClose={() => setIsRaceTypeSelectorOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setIsRaceTypeSelectorOpen(false)}>
          <View style={styles.selectorCard}>
            <Pressable
              style={[styles.selectorOption, !formState.raceTypeId ? styles.selectorOptionActive : null]}
              onPress={() => {
                setFormState((current) => ({ ...current, raceTypeId: '' }))
                setIsRaceTypeSelectorOpen(false)
              }}
            >
              <Text style={[styles.selectorOptionLabel, !formState.raceTypeId ? styles.selectorOptionLabelActive : null]}>
                No race type
              </Text>
            </Pressable>
            {raceTypes.map((raceType) => {
              const isActive = raceType.id === formState.raceTypeId
              return (
                <Pressable
                  key={raceType.id}
                  style={[styles.selectorOption, isActive ? styles.selectorOptionActive : null]}
                  onPress={() => {
                    setFormState((current) => ({ ...current, raceTypeId: raceType.id }))
                    setIsRaceTypeSelectorOpen(false)
                  }}
                >
                  <Text style={[styles.selectorOptionLabel, isActive ? styles.selectorOptionLabelActive : null]}>
                    {raceType.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={selectorField != null} transparent animationType="fade" onRequestClose={() => setSelectorField(null)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setSelectorField(null)}>
          <View style={styles.selectorCard}>
            <Pressable
              style={[styles.selectorOption, !analysisValueLabel ? styles.selectorOptionActive : null]}
              onPress={() => {
                if (selectorField) {
                  setFormState((current) => ({ ...current, [selectorField]: '' }))
                }
                setSelectorField(null)
              }}
            >
              <Text style={[styles.selectorOptionLabel, !analysisValueLabel ? styles.selectorOptionLabelActive : null]}>
                No value
              </Text>
            </Pressable>
            {ANALYSIS_OPTIONS.map((option) => {
              const isActive = selectorField ? formState[selectorField] === option.value : false
              return (
                <Pressable
                  key={option.value}
                  style={[styles.selectorOption, isActive ? styles.selectorOptionActive : null]}
                  onPress={() => {
                    if (selectorField) {
                      setFormState((current) => ({ ...current, [selectorField]: option.value }))
                    }
                    setSelectorField(null)
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
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 24, 40, 0.08)',
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
    paddingBottom: 36,
  },
  formFields: {
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
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
