import { faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Drawer, Select, Space } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceFilterOptions, RaceFilters } from '../types/raceFilters'
import {
  countActiveRaceFilters,
  EMPTY_RACE_FILTERS,
  getRaceStatusColor,
  getRaceStatusLabel,
  RACE_STATUS_OPTIONS,
} from '../types/raceFilters'
import { translateRaceTypeName } from '../../../utils/raceTypeLocalization'
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
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const activeFiltersCount = countActiveRaceFilters(filters)

  const raceTypeOptions = useMemo(
    () => options.raceTypes.map((raceType) => ({
      value: raceType.id,
      label: translateRaceTypeName(raceType.name, t) ?? raceType.name,
    })),
    [options.raceTypes, t],
  )

  return (
    <>
      <Button
        className={styles.trigger}
        icon={<FontAwesomeIcon icon={faFilter} />}
        aria-label={activeFiltersCount > 0
          ? t('races.filtersDrawer.triggerAriaWithCount', { count: activeFiltersCount })
          : t('races.filtersDrawer.triggerAria')}
        onClick={() => setIsOpen(true)}
      />

      <Drawer
        title={t('races.filtersDrawer.title')}
        open={isOpen}
        width={360}
        onClose={() => setIsOpen(false)}
        destroyOnHidden={false}
        extra={(
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faRotateLeft} />}
            aria-label={t('races.filtersDrawer.clear')}
            onClick={() => onChange({ ...EMPTY_RACE_FILTERS, search: filters.search })}
          />
        )}
      >
        <Space direction="vertical" size={18} className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>{t('races.filtersDrawer.statusLabel')}</span>
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
                    <span>{getRaceStatusLabel(status.value, t)}</span>
                  </span>
                ),
              }))}
              placeholder={t('races.filtersDrawer.statusPlaceholder')}
              onChange={(value) => onChange({ ...filters, statuses: value })}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{t('races.filtersDrawer.typesLabel')}</span>
            <Select
              mode="multiple"
              allowClear
              loading={isLoading}
              value={filters.raceTypeIds}
              options={raceTypeOptions}
              placeholder={t('races.filtersDrawer.typesPlaceholder')}
              onChange={(value) => onChange({ ...filters, raceTypeIds: value })}
            />
          </label>
        </Space>
      </Drawer>
    </>
  )
}
