import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
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
import { createRace } from '../services/racesTableService'
import {
  getRaceStatusColor,
  RACE_STATUS_OPTIONS,
} from '../types/raceFilters'
import type { RaceCreateOptions, CreateRacePayload } from '../types/racesTable'
import styles from './AddRaceDrawer.module.css'

const { TextArea } = Input

type AddRaceDrawerProps = {
  createOptions: RaceCreateOptions
  onCreated: () => void
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

const ANALYSIS_SELECT_OPTIONS = [
  { value: 'VERY_LOW', label: 'Very low' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'VERY_HIGH', label: 'Very high' },
]

const INITIAL_FORM_VALUES: Partial<AddRaceFormValues> = {
  raceStatus: 'REGISTERED',
  isValidForCategoryRanking: true,
  isGeneralClassificationPodium: false,
  isAgeGroupClassificationPodium: false,
  isTeamClassificationPodium: false,
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

function formatSecondsAsPace(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
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

function hasUnsavedChanges(values: AddRaceFormValues) {
  const allKeys = new Set([
    ...Object.keys(INITIAL_FORM_VALUES),
    ...Object.keys(values),
  ])

  return Array.from(allKeys).some((key) => {
    const currentValue = normalizeValue(values[key as keyof AddRaceFormValues])
    const initialValue = normalizeValue(INITIAL_FORM_VALUES[key as keyof AddRaceFormValues])
    return currentValue !== initialValue
  })
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

export function AddRaceDrawer({ createOptions, onCreated }: AddRaceDrawerProps) {
  const { token } = useAuth()
  const [form] = Form.useForm<AddRaceFormValues>()
  const [isOpen, setIsOpen] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearFieldError = (fieldName: keyof AddRaceFormValues) => {
    form.setFields([{ name: fieldName, errors: [] }])
  }

  const setFieldError = (fieldName: keyof AddRaceFormValues, message: string | null) => {
    form.setFields([{ name: fieldName, errors: message ? [message] : [] }])
  }

  const closeDrawer = () => {
    setIsOpen(false)
    setIsDiscardModalOpen(false)
    setError(null)
    form.resetFields()
  }

  const handleClose = () => {
    const values = form.getFieldsValue(true) as AddRaceFormValues
    if (!hasUnsavedChanges(values)) {
      closeDrawer()
      return
    }

    setIsDiscardModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!token) {
      return
    }

    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      setError(null)

      const officialTimeSeconds = parseTimeToSeconds(values.officialTime, 'duration', 'Official time')
      const chipTimeSeconds = parseTimeToSeconds(values.chipTime, 'duration', 'Chip time')
      const pacePerKmSeconds = parseTimeToSeconds(values.pacePerKm, 'pace', 'Pace per KM')

      const payload: CreateRacePayload = {
        race: {
          raceStatus: values.raceStatus,
          raceDate: values.raceDate ? values.raceDate.format('YYYY-MM-DD') : null,
          raceTime: values.raceTime ? values.raceTime.format('HH:mm:ss') : null,
          name: values.name.trim(),
          location: values.location?.trim() ? values.location.trim() : null,
          teamId: values.teamId ?? null,
          circuitId: values.circuitId ?? null,
          raceTypeId: values.raceTypeId ?? null,
          realKm: values.realKm ?? null,
          elevation: values.elevation ?? null,
          isValidForCategoryRanking: values.isValidForCategoryRanking ?? true,
        },
        results: {
          officialTimeSeconds,
          chipTimeSeconds,
          pacePerKmSeconds,
          shoeId: values.shoeId ?? null,
          generalClassification: values.generalClassification ?? null,
          isGeneralClassificationPodium: values.isGeneralClassificationPodium ?? false,
          ageGroupClassification: values.ageGroupClassification ?? null,
          isAgeGroupClassificationPodium: values.isAgeGroupClassificationPodium ?? false,
          teamClassification: values.teamClassification ?? null,
          isTeamClassificationPodium: values.isTeamClassificationPodium ?? false,
        },
        analysis: {
          preRaceConfidence: values.preRaceConfidence ?? null,
          raceDifficulty: values.raceDifficulty ?? null,
          finalSatisfaction: values.finalSatisfaction ?? null,
          painInjuries: values.painInjuries?.trim() ? values.painInjuries.trim() : null,
          analysisNotes: values.analysisNotes?.trim() ? values.analysisNotes.trim() : null,
          wouldRepeatThisRace: values.wouldRepeatThisRace ?? null,
        },
      }

      await createRace(payload, token)
      closeDrawer()
      onCreated()
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

  return (
    <>
      <Button
        type="primary"
        className={styles.trigger}
        icon={<FontAwesomeIcon icon={faPlus} />}
        aria-label="Add race"
        onClick={() => setIsOpen(true)}
      />

      <Drawer
        title="Add race"
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
              Save race
            </Button>
          </Space>
        )}
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Could not create the race"
            description={error}
            className={styles.alert}
          />
        ) : null}

        <Form
          form={form}
          layout="vertical"
          initialValues={INITIAL_FORM_VALUES}
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
                    <Form.Item<AddRaceFormValues>
                      label={renderInfoLabel(
                        'Race status',
                        'Use In list for races you are tracking but do not have a confirmed date for yet. In list races stay hidden from the table by default and only appear when you filter by the In list status.',
                      )}
                      name="raceStatus"
                      rules={[{ required: true, message: 'Race status is required.' }]}
                    >
                      <Select
                        options={RACE_STATUS_OPTIONS.map((status) => ({
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
                      />
                    </Form.Item>

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
                        <TimePicker format="HH:mm:ss" className={styles.fullWidth} />
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

                      <Form.Item<AddRaceFormValues> label="Race type" name="raceTypeId" className={styles.rowItem}>
                        <Select
                          allowClear
                          placeholder="Select race type"
                          options={createOptions.raceTypes.map((raceType) => ({
                            value: raceType.id,
                            label: raceType.name,
                          }))}
                        />
                      </Form.Item>
                    </div>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Team', 'Optional team linked to this race entry.')} name="teamId" className={styles.rowItem}>
                        <Select
                          allowClear
                          placeholder="Select team"
                          options={createOptions.teams.map((team) => ({
                            value: team.id,
                            label: team.name,
                          }))}
                        />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Circuit', 'Optional circuit or championship this race belongs to.')} name="circuitId" className={styles.rowItem}>
                        <Select
                          allowClear
                          placeholder="Select circuit"
                          options={createOptions.circuits.map((circuit) => ({
                            value: circuit.id,
                            label: circuit.name,
                          }))}
                        />
                      </Form.Item>
                    </div>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Real KM', 'Actual race distance in kilometres, using decimals when needed.')} name="realKm" className={styles.rowItem}>
                        <InputNumber min={0} max={999.99} precision={2} step={0.01} className={styles.fullWidth} placeholder="21.10" />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Elevation', 'Total elevation gain of the race, usually in meters.')} name="elevation" className={styles.rowItem}>
                        <InputNumber min={0} className={styles.fullWidth} placeholder="250" />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> name="isValidForCategoryRanking" valuePropName="checked">
                      <Checkbox>Valid for category ranking</Checkbox>
                    </Form.Item>
                  </div>
                ),
              },
              {
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

                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Chip time', 'Net finish time measured from crossing the start line to crossing the finish line.')} name="chipTime" className={styles.rowItem}>
                        <Input
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="00:00:00"
                          onChange={(event) => {
                            form.setFieldValue('chipTime', formatDigitTimeInput(event.target.value, 'duration'))
                          }}
                        />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> label={renderInfoLabel('Pace per KM', 'Average pace per kilometre. It is calculated automatically from chip time and distance, but you can also adjust it manually.')} name="pacePerKm">
                      <Input
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="00:00"
                        onChange={(event) => {
                          form.setFieldValue('pacePerKm', formatDigitTimeInput(event.target.value, 'pace'))
                        }}
                      />
                    </Form.Item>

                    <Form.Item<AddRaceFormValues> label={renderInfoLabel('Shoe', 'Optional shoe used in this race result.')} name="shoeId">
                      <Select
                        allowClear
                        placeholder="Select shoe"
                        options={createOptions.shoes.map((shoe) => ({
                          value: shoe.id,
                          label: shoe.name,
                        }))}
                      />
                    </Form.Item>

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
              },
              {
                key: 'analysis',
                label: 'Race analysis',
                children: (
                  <div className={styles.tabPane}>
                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Pre-race confidence', 'How confident you felt before the race started.')} name="preRaceConfidence" className={styles.rowItem}>
                        <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label={renderInfoLabel('Race difficulty', 'Your perception of how hard the race felt overall.')} name="raceDifficulty" className={styles.rowItem}>
                        <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> label={renderInfoLabel('Final satisfaction', 'Your final satisfaction with the race and your performance.')} name="finalSatisfaction">
                      <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                    </Form.Item>

                    <Form.Item<AddRaceFormValues> label="Pain / injuries" name="painInjuries">
                      <TextArea rows={3} placeholder="Notes about pain or injuries during the race" />
                    </Form.Item>

                    <Form.Item<AddRaceFormValues> label="Analysis notes" name="analysisNotes">
                      <TextArea rows={5} placeholder="Post-race thoughts, what went well, what to improve..." />
                    </Form.Item>

                    <Form.Item<AddRaceFormValues> name="wouldRepeatThisRace" valuePropName="checked">
                      <Checkbox>I would repeat this race</Checkbox>
                    </Form.Item>
                  </div>
                ),
              },
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
      </Drawer>
    </>
  )
}
