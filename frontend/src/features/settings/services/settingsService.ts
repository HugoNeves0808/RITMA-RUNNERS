import { buildApiUrl, ApiError } from '../../../services/apiClient'

function getFilenameFromDisposition(header: string | null, fallback: string) {
  if (!header) {
    return fallback
  }

  const match = header.match(/filename="?([^"]+)"?/)
  return match?.[1] ?? fallback
}

export async function downloadSettingsExport(format: 'json' | 'sql' | 'xlsx', token: string) {
  const response = await fetch(buildApiUrl(`/api/settings/data/export/${format}`), {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Client-Platform': 'web',
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Unable to export your data right now.')
  }

  return {
    blob: await response.blob(),
    filename: getFilenameFromDisposition(response.headers.get('content-disposition'), `ritma-export.${format}`),
  }
}

export async function importSettingsData(file: File, token: string) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(buildApiUrl('/api/settings/data/import'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Client-Platform': 'web',
    },
    body: formData,
  })

  if (!response.ok) {
    let message = 'Unable to import your data right now.'
    try {
      const payload = await response.json() as { message?: string }
      if (payload.message) {
        message = payload.message
      }
    } catch {
      // Ignore JSON parsing issues and keep fallback message.
    }

    throw new ApiError(response.status, message)
  }
}
