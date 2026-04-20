import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { pt } from './locales/pt'

export const SUPPORTED_LANGUAGES = ['en', 'pt'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'ritma:language'

function normalizeLanguage(value: string | null | undefined): Language | null {
  if (!value) {
    return null
  }

  const lower = value.toLowerCase()
  if (lower === 'pt' || lower.startsWith('pt-')) {
    return 'pt'
  }

  if (lower === 'en' || lower.startsWith('en-')) {
    return 'en'
  }

  return null
}

export function resolveInitialLanguage(): Language {
  const stored = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
  if (stored) {
    return stored
  }

  const browser = normalizeLanguage(navigator.language)
  return browser ?? 'en'
}

const trainingTranslationsEn = {
  navigation: {
    trainings: 'Trainings',
  },
  pages: {
    trainings: 'Trainings',
  },
  trainings: {
    title: 'Trainings',
    loading: 'Loading trainings',
    actions: {
      add: 'Add Training',
      addShort: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save changes',
      manageTypes: 'Manage training types',
    },
    status: {
      scheduled: 'Scheduled',
      planned: 'Planned',
      done: 'Done',
    },
    sections: {
      byRace: 'Trainings by race cycle',
      list: 'Trainings list',
    },
    filters: {
      title: 'Filters',
      search: 'Search',
      searchPlaceholder: 'Search training',
      status: 'Training status',
      types: 'Training type',
      association: 'Association',
      associatedOnly: 'Only linked to races',
      individualOnly: 'Only individual',
      collapse: 'Collapse {{section}}',
      expand: 'Expand {{section}}',
    },
    table: {
      dateTime: 'Date / time',
      name: 'Name',
      type: 'Training type',
      notes: 'Notes',
      status: 'Status',
      series: 'Series',
      done: 'Done',
      actions: 'Actions',
      noSeries: 'No series',
      seriesValue: 'Every {{interval}} week(s) until {{until}}',
      itemsCount_one: '{{count}} training',
      itemsCount_other: '{{count}} trainings',
    },
    fields: {
      date: 'Date',
      time: 'Time',
      name: 'Name',
      type: 'Training type',
      notes: 'Notes',
      associatedRace: 'Associate race',
      recurrence: 'Turn into series',
      recurrenceInterval: 'Every how many weeks',
      recurrenceUntil: 'Until when',
      recurrenceDays: 'Weekdays',
    },
    placeholders: {
      name: 'Example: 8x400 series',
      type: 'Select training type',
      notes: 'Training notes',
      associatedRace: 'Select race',
    },
    drawer: {
      addTitle: 'Add training',
      editTitle: 'Edit training',
      recurrenceHint: 'Series creates new occurrences on creation. While editing, this configuration only applies to this item.',
    },
    weekdays: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    },
    empty: {
      none: 'No trainings yet.',
      filtered: 'No trainings match the current filters.',
      noTrainingsInRaceBlock: 'There are no trainings in this race block.',
    },
    stale: {
      rowHint: 'This training date has passed and still needs an update.',
      headerHint: 'Some past trainings are still marked as planned.',
      headerCta_one: '{{count}} training needs update',
      headerCta_other: '{{count}} trainings need update',
      modalTitle: 'Pending training updates',
      modalMessage: 'Some past trainings are still planned.',
      modalDescription: 'You can review the list below and mark them all as done in one go.',
      updateAll_one: 'Mark {{count}} training as done',
      updateAll_other: 'Mark {{count}} trainings as done',
    },
    delete: {
      title: 'Delete training?',
      body: 'This will permanently delete "{{name}}".',
      bodySeries: 'Choose whether you want to delete only "{{name}}" or the whole series.',
      deleteOnlyThis: 'Delete only this training',
      deleteWholeSeries: 'Delete whole series',
    },
    types: {
      title: 'Training types',
      placeholder: 'Enter the training type name',
    },
    errors: {
      loadTitle: 'Unable to load trainings',
      load: 'Unable to load trainings right now.',
      save: 'Unable to save this training right now.',
      update: 'Unable to update this training right now.',
      delete: 'Unable to delete this training right now.',
      typeSaveTitle: 'Unable to save the training type',
      typeSave: 'Unable to save the training type right now.',
      typeDelete: 'Unable to delete the training type right now.',
    },
  },
}

const trainingTranslationsPt = {
  navigation: {
    trainings: 'Treinos',
  },
  pages: {
    trainings: 'Treinos',
  },
  trainings: {
    title: 'Treinos',
    loading: 'A carregar treinos',
    actions: {
      add: 'Adicionar Treino',
      addShort: 'Adicionar',
      edit: 'Editar',
      delete: 'Apagar',
      save: 'Guardar alterações',
      manageTypes: 'Gerir tipos de treino',
    },
    status: {
      scheduled: 'Agendado',
      planned: 'Planeado',
      done: 'Realizado',
    },
    sections: {
      byRace: 'Treinos por ciclo de prova',
      list: 'Lista de treinos',
    },
    filters: {
      title: 'Filtros',
      search: 'Pesquisar',
      searchPlaceholder: 'Pesquisar treino',
      status: 'Estado do treino',
      types: 'Tipo de treino',
      association: 'Associação',
      associatedOnly: 'Apenas associados a prova',
      individualOnly: 'Apenas individuais',
      collapse: 'Fechar {{section}}',
      expand: 'Abrir {{section}}',
    },
    table: {
      dateTime: 'Data / hora',
      name: 'Nome',
      type: 'Tipo de treino',
      notes: 'Notas',
      status: 'Estado',
      series: 'Série',
      done: 'Realizado',
      actions: 'Ações',
      noSeries: 'Sem série',
      seriesValue: 'A cada {{interval}} semana(s) até {{until}}',
      itemsCount_one: '{{count}} treino',
      itemsCount_other: '{{count}} treinos',
    },
    fields: {
      date: 'Data',
      time: 'Hora',
      name: 'Nome',
      type: 'Tipo de treino',
      notes: 'Notas',
      associatedRace: 'Associar à prova',
      recurrence: 'Tornar série',
      recurrenceInterval: 'De quantas em quantas semanas',
      recurrenceUntil: 'Até quando',
      recurrenceDays: 'Dias da semana',
    },
    placeholders: {
      name: 'Ex: Série de 8x400',
      type: 'Selecionar tipo de treino',
      notes: 'Notas do treino',
      associatedRace: 'Selecionar prova',
    },
    drawer: {
      addTitle: 'Adicionar treino',
      editTitle: 'Editar treino',
      recurrenceHint: 'A série cria ocorrências novas na criação. Na edição, esta configuração aplica-se apenas a este registo.',
    },
    weekdays: {
      mon: 'Seg',
      tue: 'Ter',
      wed: 'Qua',
      thu: 'Qui',
      fri: 'Sex',
      sat: 'Sáb',
      sun: 'Dom',
    },
    empty: {
      none: 'Ainda não existem treinos.',
      filtered: 'Nenhum treino corresponde aos filtros atuais.',
      noTrainingsInRaceBlock: 'Nao existem treinos neste bloco de prova.',
    },
    stale: {
      rowHint: 'A data deste treino ja passou e ainda precisa de update.',
      headerHint: 'Existem treinos passados que ainda estao como planeado.',
      headerCta_one: '{{count}} treino precisa de update',
      headerCta_other: '{{count}} treinos precisam de update',
      modalTitle: 'Updates pendentes de treinos',
      modalMessage: 'Existem treinos passados que ainda estao planeados.',
      modalDescription: 'Podes rever a lista abaixo e marca-los todos como realizados de uma so vez.',
      updateAll_one: 'Marcar {{count}} treino como realizado',
      updateAll_other: 'Marcar {{count}} treinos como realizados',
    },
    delete: {
      title: 'Apagar treino?',
      body: 'Isto vai apagar permanentemente "{{name}}".',
      bodySeries: 'Escolhe se queres apagar só "{{name}}" ou a série inteira.',
      deleteOnlyThis: 'Apagar só este treino',
      deleteWholeSeries: 'Apagar série inteira',
    },
    types: {
      title: 'Tipos de treino',
      placeholder: 'Escreve o nome do tipo de treino',
    },
    errors: {
      loadTitle: 'Não foi possível carregar os treinos',
      load: 'Não foi possível carregar os treinos agora.',
      save: 'Não foi possível guardar o treino agora.',
      update: 'Não foi possível atualizar o treino agora.',
      delete: 'Não foi possível apagar o treino agora.',
      typeSaveTitle: 'Não foi possível guardar o tipo de treino',
      typeSave: 'Não foi possível guardar o tipo de treino agora.',
      typeDelete: 'Não foi possível apagar o tipo de treino agora.',
    },
  },
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en, ...trainingTranslationsEn, navigation: { ...en.navigation, ...trainingTranslationsEn.navigation }, pages: { ...en.pages, ...trainingTranslationsEn.pages } } },
      pt: { translation: { ...pt, ...trainingTranslationsPt, navigation: { ...pt.navigation, ...trainingTranslationsPt.navigation }, pages: { ...pt.pages, ...trainingTranslationsPt.pages } } },
    },
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n

