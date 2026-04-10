ALTER TABLE user_races
    DROP COLUMN IF EXISTS is_general_classification_podium,
    DROP COLUMN IF EXISTS is_age_group_classification_podium,
    DROP COLUMN IF EXISTS is_team_classification_podium;
