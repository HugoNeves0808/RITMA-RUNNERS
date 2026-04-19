export {
  createTraining,
  createTrainingType,
  deleteTraining,
  deleteTrainingType,
  fetchTrainingCreateOptions,
  fetchTrainingFilterOptions,
  fetchTrainingTable,
  fetchTrainingTypes,
  updateTraining,
  updateTrainingCompletion,
  updateTrainingType,
} from './services/trainingsService'
export { EMPTY_TRAINING_FILTERS } from './types/trainings'
export type {
  AssociatedRaceOption,
  TrainingCreateOptions,
  TrainingFilterOptions,
  TrainingFilters,
  TrainingRequest,
  TrainingStatus,
  TrainingTableItem,
  TrainingTypeOption,
} from './types/trainings'
