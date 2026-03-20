import { faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Drawer, Select, Space } from 'antd'
import { useMemo, useState } from 'react'
import type { RaceFilterOptions, RaceFilters } from '../types/raceFilters'
import {
  countActiveRaceFilters,
  EMPTY_RACE_FILTERS,
  getRaceStatusColor,
  RACE_STATUS_OPTIONS,
} from '../types/raceFilters'
import styles from './RacesFiltersButton.module.css'

type RacesFiltersButtonProps = {
  filters: RaceFilters
  options: RaceFilterOptions
  isLoading: boolean
  onChange: (filters: RaceFilters) => void
}

export function RacesFiltersButton({
  filters,
  options,
  isLoading,
  onChange,
}: RacesFiltersButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeFiltersCount = countActiveRaceFilters(filters)

  const raceTypeOptions = useMemo(
    () => options.raceTypes.map((raceType) => ({ value: raceType.id, label: raceType.name })),
    [options.raceTypes],
  )

  return (
    <>
      <Button
        className={styles.trigger}
        icon={<FontAwesomeIcon icon={faFilter} />}
        aria-label={activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Filters'}
        onClick={() => setIsOpen(true)}
      />

      <Drawer
        title="Race filters"
        open={isOpen}
        width={360}
        onClose={() => setIsOpen(false)}
        destroyOnHidden={false}
        extra={(
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faRotateLeft} />}
            aria-label="Clear filters"
            onClick={() => onChange({ ...EMPTY_RACE_FILTERS, search: filters.search })}
          />
        )}
      >
        <Space direction="vertical" size={18} className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>Race status</span>
            <Select
              mode="multiple"
              allowClear
              value={filters.statuses}
              options={RACE_STATUS_OPTIONS.map((status) => ({
                value: status.value,
                label: (
                  <span className={styles.statusOption}>
                    <span
                      className={styles.statusDot}
                      style={{ backgroundColor: getRaceStatusColor(status.value) }}
                    />
                    <span>{status.label}</span>
                  </span>
                ),
              }))}
              placeholder="Select statuses"
              onChange={(value) => onChange({ ...filters, statuses: value })}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Race types</span>
            <Select
              mode="multiple"
              allowClear
              loading={isLoading}
              value={filters.raceTypeIds}
              options={raceTypeOptions}
              placeholder="Select race types"
              onChange={(value) => onChange({ ...filters, raceTypeIds: value })}
            />
          </label>
        </Space>
      </Drawer>
    </>
  )
}
