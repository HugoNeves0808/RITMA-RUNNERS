ALTER TABLE user_races
    ADD COLUMN shoe_id UUID,
    ADD COLUMN official_time INTEGER,
    ADD COLUMN chip_time INTEGER,
    ADD COLUMN pace_per_km INTEGER,
    ADD COLUMN general_classification INTEGER,
    ADD COLUMN is_general_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN age_group_classification INTEGER,
    ADD COLUMN is_age_group_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN team_classification INTEGER,
    ADD COLUMN is_team_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN pre_race_confidence VARCHAR(30),
    ADD COLUMN race_difficulty VARCHAR(30),
    ADD COLUMN final_satisfaction VARCHAR(30),
    ADD COLUMN pain_injuries TEXT,
    ADD COLUMN analysis_notes TEXT,
    ADD COLUMN would_repeat_this_race BOOLEAN;

UPDATE user_races ur
SET shoe_id = urr.shoe_id,
    official_time = urr.official_time,
    chip_time = urr.chip_time,
    pace_per_km = urr.pace_per_km,
    general_classification = urr.general_classification,
    is_general_classification_podium = urr.is_general_classification_podium,
    age_group_classification = urr.age_group_classification,
    is_age_group_classification_podium = urr.is_age_group_classification_podium,
    team_classification = urr.team_classification,
    is_team_classification_podium = urr.is_team_classification_podium
FROM user_race_results urr
WHERE urr.user_race_id = ur.id;

UPDATE user_races ur
SET pre_race_confidence = ura.pre_race_confidence,
    race_difficulty = ura.race_difficulty,
    final_satisfaction = ura.final_satisfaction,
    pain_injuries = ura.pain_injuries,
    analysis_notes = ura.analysis_notes,
    would_repeat_this_race = ura.would_repeat_this_race
FROM user_race_analysis ura
WHERE ura.user_race_id = ur.id;

ALTER TABLE user_races
    ADD CONSTRAINT fk_user_races_shoe
        FOREIGN KEY (shoe_id) REFERENCES user_shoes(id) ON DELETE SET NULL,
    ADD CONSTRAINT chk_user_races_official_time_non_negative
        CHECK (official_time IS NULL OR official_time >= 0),
    ADD CONSTRAINT chk_user_races_chip_time_non_negative
        CHECK (chip_time IS NULL OR chip_time >= 0),
    ADD CONSTRAINT chk_user_races_pace_per_km_non_negative
        CHECK (pace_per_km IS NULL OR pace_per_km >= 0),
    ADD CONSTRAINT chk_user_races_general_classification_positive
        CHECK (general_classification IS NULL OR general_classification > 0),
    ADD CONSTRAINT chk_user_races_age_group_classification_positive
        CHECK (age_group_classification IS NULL OR age_group_classification > 0),
    ADD CONSTRAINT chk_user_races_team_classification_positive
        CHECK (team_classification IS NULL OR team_classification > 0);

CREATE INDEX idx_user_races_shoe_id ON user_races (shoe_id);

DROP INDEX IF EXISTS idx_user_race_results_shoe_id;

DROP TRIGGER IF EXISTS trg_user_race_results_set_updated_at ON user_race_results;
DROP TRIGGER IF EXISTS trg_user_race_analysis_set_updated_at ON user_race_analysis;

DROP TABLE user_race_results;
DROP TABLE user_race_analysis;
