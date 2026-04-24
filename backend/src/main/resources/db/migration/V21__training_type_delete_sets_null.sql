ALTER TABLE user_custom_trainings
    ALTER COLUMN training_type_id DROP NOT NULL;

ALTER TABLE user_custom_trainings
    DROP CONSTRAINT IF EXISTS fk_user_custom_trainings_training_type;

ALTER TABLE user_custom_trainings
    ADD CONSTRAINT fk_user_custom_trainings_training_type
        FOREIGN KEY (training_type_id) REFERENCES user_custom_training_types(id) ON DELETE SET NULL;
