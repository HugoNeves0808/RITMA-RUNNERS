import { faBolt, faChartLine, faCompassDrafting, faFlagCheckered, faLink, faRobot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Select, Tabs, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { useLanguage } from '../../contexts/LanguageContext'
import styles from './FutureGoalsPage.module.css'

const { Paragraph } = Typography

export function FutureGoalsPage() {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()
  const languageOptions = [
    { value: 'en', label: <span>🇬🇧 {t('settings.preferences.languageEnglish')}</span> },
    { value: 'pt', label: <span>🇵🇹 {t('settings.preferences.languagePortuguese')}</span> },
  ] as const
  const items = [
    {
      key: 'what-is-ritma',
      label: t('futureGoals.tabs.whatIsRitma'),
      children: (
        <div className={styles.tabContent}>
          <Paragraph className={styles.paragraph}>
            {t('futureGoals.whatIs.paragraph1')}
          </Paragraph>
          <Paragraph className={styles.paragraph}>
            {t('futureGoals.whatIs.paragraph2')}
          </Paragraph>
          <div className={styles.futureGrid}>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faFlagCheckered} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.whatIs.cards.raceFocused.title')}</strong>
                <p>{t('futureGoals.whatIs.cards.raceFocused.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faChartLine} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.whatIs.cards.performanceHistory.title')}</strong>
                <p>{t('futureGoals.whatIs.cards.performanceHistory.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faCompassDrafting} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.whatIs.cards.runnerJourney.title')}</strong>
                <p>{t('futureGoals.whatIs.cards.runnerJourney.description')}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'future-plans',
      label: t('futureGoals.tabs.futurePlans'),
      children: (
        <div className={styles.tabContent}>
          <Paragraph className={styles.paragraph}>
            {t('futureGoals.plans.paragraph1')}
          </Paragraph>
          <div className={styles.futureGrid}>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faBolt} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.trainingPlanning.title')}</strong>
                <p>{t('futureGoals.plans.cards.trainingPlanning.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faLink} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.platformSync.title')}</strong>
                <p>{t('futureGoals.plans.cards.platformSync.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faRobot} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.smarterSupport.title')}</strong>
                <p>{t('futureGoals.plans.cards.smarterSupport.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faChartLine} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.advancedStats.title')}</strong>
                <p>{t('futureGoals.plans.cards.advancedStats.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faFlagCheckered} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.progressionAnalysis.title')}</strong>
                <p>{t('futureGoals.plans.cards.progressionAnalysis.description')}</p>
              </div>
            </div>
            <div className={styles.futureCard}>
              <FontAwesomeIcon icon={faCompassDrafting} className={styles.futureIcon} />
              <div>
                <strong>{t('futureGoals.plans.cards.preparationTools.title')}</strong>
                <p>{t('futureGoals.plans.cards.preparationTools.description')}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.fixedLanguage}>
        <Select
          aria-label={t('common.language')}
          className={styles.languageSelect}
          value={language}
          onChange={setLanguage}
          options={[...languageOptions]}
        />
      </div>
      <div className={styles.fixedAction}>
        <Button className={styles.primaryButton} type="primary">
          <Link to={ROUTES.login}>{t('futureGoals.backToLogin')}</Link>
        </Button>
      </div>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <img src="/images/ritma-logo.png" alt="RITMA RUNNERS" className={styles.logo} />
        </div>
        <Tabs items={items} className={styles.tabs} />
      </div>
    </div>
  )
}
