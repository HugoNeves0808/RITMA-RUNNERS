UPDATE user_race_types existing
SET name = '10 km Race',
    target_km = 10.00
WHERE lower(existing.name) = '10km race'
  AND NOT EXISTS (
    SELECT 1
    FROM user_race_types conflict
    WHERE conflict.user_id = existing.user_id
      AND conflict.id <> existing.id
      AND lower(conflict.name) = '10 km race'
  );

UPDATE user_races race
SET race_type_id = replacement.id
FROM user_race_types legacy
JOIN user_race_types replacement
  ON replacement.user_id = legacy.user_id
 AND lower(replacement.name) = '10 km race'
WHERE race.race_type_id = legacy.id
  AND lower(legacy.name) = '10km race'
  AND replacement.id <> legacy.id;

DELETE FROM user_race_types legacy
WHERE lower(legacy.name) = '10km race'
  AND EXISTS (
    SELECT 1
    FROM user_race_types replacement
    WHERE replacement.user_id = legacy.user_id
      AND replacement.id <> legacy.id
      AND lower(replacement.name) = '10 km race'
  );

INSERT INTO user_race_types (user_id, name, target_km)
SELECT DISTINCT user_id, '15 km Race', 15.00
FROM user_race_types source
WHERE NOT EXISTS (
    SELECT 1
    FROM user_race_types existing
    WHERE existing.user_id = source.user_id
      AND lower(existing.name) = '15 km race'
);

UPDATE user_race_types
SET archived = TRUE
WHERE lower(name) IN ('long trail', 'short trail', 'ultra marathon');
