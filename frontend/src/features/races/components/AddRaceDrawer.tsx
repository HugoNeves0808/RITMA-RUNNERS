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
} from 'antd'
import { useAuth } from '../../auth'
import { createRace } from '../services/racesTableService'
import { RACE_STATUS_OPTIONS } from '../types/raceFilters'
import type { CreateRacePayload, RaceTypeOption } from '../types/racesTable'
import styles from './AddRaceDrawer.module.css'

const { TextArea } = Input

type AddRaceDrawerProps = {
  raceTypes: RaceTypeOption[]
  onCreated: () => void
}

type AddRaceFormValues = {
  raceStatus: string
  raceDate: dayjs.Dayjs
  raceTime?: dayjs.Dayjs
  name: string
  location?: string
  raceTypeId?: string
  realKm?: number
  elevation?: number
  isValidForCategoryRanking?: boolean
  officialTime?: string
  chipTime?: string
  pacePerKm?: string
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

function parseTimeToSeconds(value: string | undefined, mode: 'duration' | 'pace') {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parts = normalized.split(':')
  if (mode === 'duration' && parts.length === 3) {
    const [hours, minutes, seconds] = parts.map((part) => Number(part))
    if ([hours, minutes, seconds].some((part) => Number.isNaN(part) || part < 0)) {
      throw new Error('Race time fields must use HH:MM:SS.')
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

  throw new Error(mode === 'duration' ? 'Race time fields must use HH:MM:SS.' : 'Pace must use MM:SS.')
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

export function AddRaceDrawer({ raceTypes, onCreated }: AddRaceDrawerProps) {
  const { token } = useAuth()
  const [form] = Form.useForm<AddRaceFormValues>()
  const [isOpen, setIsOpen] = useState(false)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const payload: CreateRacePayload = {
        race: {
          raceStatus: values.raceStatus,
          raceDate: values.raceDate.format('YYYY-MM-DD'),
          raceTime: values.raceTime ? values.raceTime.format('HH:mm:ss') : null,
          name: values.name.trim(),
          location: values.location?.trim() ? values.location.trim() : null,
          raceTypeId: values.raceTypeId ?? null,
          realKm: values.realKm ?? null,
          elevation: values.elevation ?? null,
          isValidForCategoryRanking: values.isValidForCategoryRanking ?? true,
        },
        results: {
          officialTimeSeconds: parseTimeToSeconds(values.officialTime, 'duration'),
          chipTimeSeconds: parseTimeToSeconds(values.chipTime, 'duration'),
          pacePerKmSeconds: parseTimeToSeconds(values.pacePerKm, 'pace'),
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
        >
          <Tabs
            items={[
              {
                key: 'race',
                label: 'Race data',
                children: (
                  <div className={styles.tabPane}>
                    <Form.Item<AddRaceFormValues>
                      label="Race status"
                      name="raceStatus"
                      rules={[{ required: true, message: 'Race status is required.' }]}
                    >
                      <Select
                        options={RACE_STATUS_OPTIONS.map((status) => ({
                          value: status.value,
                          label: status.label,
                        }))}
                      />
                    </Form.Item>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues>
                        label="Race date"
                        name="raceDate"
                        className={styles.rowItem}
                        rules={[{ required: true, message: 'Race date is required.' }]}
                      >
                        <DatePicker format="YYYY-MM-DD" className={styles.fullWidth} />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Race time" name="raceTime" className={styles.rowItem}>
                        <TimePicker format="HH:mm:ss" className={styles.fullWidth} />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues>
                      label="Race name"
                      name="name"
                      rules={[{ required: true, message: 'Race name is required.' }]}
                    >
                      <Input placeholder="Lisbon Half Marathon" />
                    </Form.Item>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label="Location" name="location" className={styles.rowItem}>
                        <Input placeholder="Lisbon" />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Race type" name="raceTypeId" className={styles.rowItem}>
                        <Select
                          allowClear
                          placeholder="Select race type"
                          options={raceTypes.map((raceType) => ({
                            value: raceType.id,
                            label: raceType.name,
                          }))}
                        />
                      </Form.Item>
                    </div>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label="Real KM" name="realKm" className={styles.rowItem}>
                        <InputNumber min={0} step={0.01} className={styles.fullWidth} placeholder="21.10" />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Elevation" name="elevation" className={styles.rowItem}>
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
                      <Form.Item<AddRaceFormValues> label="Official time" name="officialTime" className={styles.rowItem}>
                        <Input placeholder="HH:MM:SS" />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Chip time" name="chipTime" className={styles.rowItem}>
                        <Input placeholder="HH:MM:SS" />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> label="Pace per KM" name="pacePerKm">
                      <Input placeholder="MM:SS" />
                    </Form.Item>

                    <div className={styles.row}>
                      <Form.Item<AddRaceFormValues> label="General classification" name="generalClassification" className={styles.rowItem}>
                        <InputNumber min={1} className={styles.fullWidth} />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Age group classification" name="ageGroupClassification" className={styles.rowItem}>
                        <InputNumber min={1} className={styles.fullWidth} />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> label="Team classification" name="teamClassification">
                      <InputNumber min={1} className={styles.fullWidth} />
                    </Form.Item>

                    <div className={styles.checkboxGrid}>
                      <Form.Item<AddRaceFormValues> name="isGeneralClassificationPodium" valuePropName="checked">
                        <Checkbox>General classification podium</Checkbox>
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> name="isAgeGroupClassificationPodium" valuePropName="checked">
                        <Checkbox>Age group podium</Checkbox>
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> name="isTeamClassificationPodium" valuePropName="checked">
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
                      <Form.Item<AddRaceFormValues> label="Pre-race confidence" name="preRaceConfidence" className={styles.rowItem}>
                        <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                      </Form.Item>

                      <Form.Item<AddRaceFormValues> label="Race difficulty" name="raceDifficulty" className={styles.rowItem}>
                        <Select allowClear options={ANALYSIS_SELECT_OPTIONS} />
                      </Form.Item>
                    </div>

                    <Form.Item<AddRaceFormValues> label="Final satisfaction" name="finalSatisfaction">
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
