const DEFAULT_RACE_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  '10 km Race': 'defaultRaceTypes.10k',
  '15 km Race': 'defaultRaceTypes.15k',
  'Half Marathon': 'defaultRaceTypes.halfMarathon',
  Marathon: 'defaultRaceTypes.marathon',
}

type TranslateFn = (key: string) => string

export function translateRaceTypeName(name: string | null | undefined, t: TranslateFn) {
  if (!name) {
    return name ?? null
  }

  const translationKey = DEFAULT_RACE_TYPE_TRANSLATION_KEYS[name]
  return translationKey ? t(translationKey) : name
}
