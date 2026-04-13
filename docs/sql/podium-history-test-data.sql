-- Podium history test data for the seeded local accounts:
-- user@ritma.com / pass1234
-- admin@ritma.com / pass1234
-- Safe to rerun: the script upserts the support entities and the races by fixed UUID.

INSERT INTO user_teams (id, user_id, name, archived)
SELECT
    '10000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'RITMA Elite',
    FALSE
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_circuits (id, user_id, name, archived)
SELECT
    '20000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'Lisbon Road Series',
    FALSE
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_shoes (id, user_id, name, archived)
SELECT
    '30000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'Adios Pro Test Pair',
    FALSE
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_race_types (id, user_id, name, archived, target_km)
SELECT
    '40000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'Half Marathon',
    FALSE,
    21.10
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE,
    target_km = EXCLUDED.target_km;

INSERT INTO user_race_types (id, user_id, name, archived, target_km)
SELECT
    '40000000-0000-0000-0000-000000000002'::uuid,
    u.id,
    '10 km Race',
    FALSE,
    10.00
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE,
    target_km = EXCLUDED.target_km;

INSERT INTO user_race_types (id, user_id, name, archived, target_km)
SELECT
    '40000000-0000-0000-0000-000000000003'::uuid,
    u.id,
    'Trail 15 km',
    FALSE,
    15.00
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE,
    target_km = EXCLUDED.target_km;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '50000000-0000-0000-0000-000000000001'::uuid, u.id, 'COMPLETED'::race_status, DATE '2026-04-06', TIME '09:00',
    'Meia Maratona da Ponte', 'Lisboa',
    '10000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000001'::uuid,
    21.08, 110, FALSE, TRUE, 4725, 4702, 223, 1, NULL, 2,
    'High', 'Hard', 'Very happy', 'None',
    'Strong race. Use this one to validate a general podium and a team podium on the same race.'
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '50000000-0000-0000-0000-000000000002'::uuid, u.id, 'COMPLETED'::race_status, DATE '2026-02-15', TIME '10:30',
    'Trilho das Vinhas', 'Palmela',
    '10000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000003'::uuid, '30000000-0000-0000-0000-000000000001'::uuid,
    15.03, 420, FALSE, TRUE, 4638, 4619, 307, NULL, 2, NULL,
    'Medium', 'Hard', 'Happy', 'Mild calf tightness',
    'Use this race to validate a standalone age-group podium.'
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '50000000-0000-0000-0000-000000000003'::uuid, u.id, 'COMPLETED'::race_status, DATE '2025-11-08', TIME '18:00',
    'Sao Silvestre do Porto', 'Porto',
    '10000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000001'::uuid,
    10.01, 55, FALSE, TRUE, 2258, 2242, 224, NULL, NULL, 1,
    'High', 'Medium', 'Very happy', 'None',
    'Use this one to validate an older team podium.'
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '50000000-0000-0000-0000-000000000004'::uuid, u.id, 'COMPLETED'::race_status, DATE '2025-06-22', TIME '08:45',
    '10K da Marginal', 'Oeiras',
    '10000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000001'::uuid,
    10.00, 34, FALSE, TRUE, 2199, 2188, 219, 3, 1, 3,
    'High', 'Medium', 'Very happy', 'None',
    'Use this race to validate that one result can appear as general, age-group, and team podium entries separately.'
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '50000000-0000-0000-0000-000000000005'::uuid, u.id, 'COMPLETED'::race_status, DATE '2025-04-13', TIME '09:10',
    'Corrida das Descobertas', 'Lisboa',
    '10000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid,
    '40000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000001'::uuid,
    10.00, 18, FALSE, TRUE, 2348, 2339, 234, 4, NULL, NULL,
    'Medium', 'Easy', 'Happy', 'None',
    'Use this race to validate a 4th-place podium entry.'
FROM users u
WHERE lower(u.email) = 'user@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_teams (id, user_id, name, archived)
SELECT
    '11000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'RITMA Admin Squad',
    FALSE
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_circuits (id, user_id, name, archived)
SELECT
    '21000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'Admin Test Circuit',
    FALSE
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_shoes (id, user_id, name, archived)
SELECT
    '31000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    'Admin Race Shoe',
    FALSE
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE;

INSERT INTO user_race_types (id, user_id, name, archived, target_km)
SELECT
    '41000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    '10 km Race',
    FALSE,
    10.00
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    archived = FALSE,
    target_km = EXCLUDED.target_km;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '51000000-0000-0000-0000-000000000001'::uuid, u.id, 'COMPLETED'::race_status, DATE '2026-03-30', TIME '09:15',
    'Admin 10K Test Race', 'Braga',
    '11000000-0000-0000-0000-000000000001'::uuid, '21000000-0000-0000-0000-000000000001'::uuid,
    '41000000-0000-0000-0000-000000000001'::uuid, '31000000-0000-0000-0000-000000000001'::uuid,
    10.00, 40, FALSE, TRUE, 2322, 2314, 231, 2, 1, NULL,
    'High', 'Medium', 'Very happy', 'None',
    'Admin test race with general and age-group podiums.'
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '51000000-0000-0000-0000-000000000002'::uuid, u.id, 'COMPLETED'::race_status, DATE '2025-12-14', TIME '08:30',
    'Admin Team Podium Race', 'Coimbra',
    '11000000-0000-0000-0000-000000000001'::uuid, '21000000-0000-0000-0000-000000000001'::uuid,
    '41000000-0000-0000-0000-000000000001'::uuid, '31000000-0000-0000-0000-000000000001'::uuid,
    10.02, 22, FALSE, TRUE, 2380, 2372, 237, NULL, NULL, 3,
    'Medium', 'Easy', 'Happy', 'None',
    'Admin test race with a team podium.'
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;

INSERT INTO user_races (
    id, user_id, race_status, race_date, race_time, name, location, team_id, circuit_id, race_type_id, shoe_id,
    real_km, elevation, archived, is_valid_for_category_ranking, official_time, chip_time, pace_per_km,
    general_classification, age_group_classification, team_classification,
    pre_race_confidence, race_difficulty, final_satisfaction, pain_injuries, analysis_notes
)
SELECT
    '51000000-0000-0000-0000-000000000003'::uuid, u.id, 'COMPLETED'::race_status, DATE '2025-10-05', TIME '10:00',
    'Admin Autumn Run', 'Aveiro',
    '11000000-0000-0000-0000-000000000001'::uuid, '21000000-0000-0000-0000-000000000001'::uuid,
    '41000000-0000-0000-0000-000000000001'::uuid, '31000000-0000-0000-0000-000000000001'::uuid,
    10.00, 12, FALSE, TRUE, 2415, 2407, 240, NULL, NULL, 5,
    'Medium', 'Easy', 'Happy', 'None',
    'Admin test race with a 5th-place team podium entry.'
FROM users u
WHERE lower(u.email) = 'admin@ritma.com'
ON CONFLICT (id) DO UPDATE
SET user_id = EXCLUDED.user_id, race_status = EXCLUDED.race_status, race_date = EXCLUDED.race_date, race_time = EXCLUDED.race_time,
    name = EXCLUDED.name, location = EXCLUDED.location, team_id = EXCLUDED.team_id, circuit_id = EXCLUDED.circuit_id,
    race_type_id = EXCLUDED.race_type_id, shoe_id = EXCLUDED.shoe_id, real_km = EXCLUDED.real_km, elevation = EXCLUDED.elevation,
    archived = FALSE, is_valid_for_category_ranking = EXCLUDED.is_valid_for_category_ranking,
    official_time = EXCLUDED.official_time, chip_time = EXCLUDED.chip_time, pace_per_km = EXCLUDED.pace_per_km,
    general_classification = EXCLUDED.general_classification, age_group_classification = EXCLUDED.age_group_classification,
    team_classification = EXCLUDED.team_classification, pre_race_confidence = EXCLUDED.pre_race_confidence,
    race_difficulty = EXCLUDED.race_difficulty, final_satisfaction = EXCLUDED.final_satisfaction,
    pain_injuries = EXCLUDED.pain_injuries, analysis_notes = EXCLUDED.analysis_notes;
