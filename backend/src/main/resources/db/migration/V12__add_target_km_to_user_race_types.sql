ALTER TABLE user_race_types
ADD COLUMN target_km NUMERIC(6,2);

ALTER TABLE user_race_types
ADD CONSTRAINT chk_user_race_types_target_km_non_negative
CHECK (target_km IS NULL OR target_km >= 0);
