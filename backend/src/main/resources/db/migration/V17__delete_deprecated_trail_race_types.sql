-- Remove deprecated race types globally.
-- Any user_races referencing these types will have race_type_id set to NULL
-- via fk_user_races_race_type ON DELETE SET NULL.

DELETE FROM user_race_types
WHERE lower(btrim(name)) IN (
  'long trail',
  'short trail',
  'ultra marathon',
  'ultra marathons'
);

