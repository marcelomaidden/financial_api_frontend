import type { ApiErrorBody } from './types'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

/** Erro de uma chamada à API. `status` é 0 quando não houve resposta (rede). */
export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export type QueryParams = Record<string, string | number | undefined | null>

export function buildUrl(path: string, params: QueryParams = {}): string {
  const url = new URL(baseUrl.replace(/\/$/, '') + path, window.location.origin)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).status === 'number' &&
    typeof (value as ApiErrorBody).message === 'string'
  )
}

export async function getJson<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiRequestError(0, 'Não foi possível conectar à API.')
  }

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    const message = isErrorBody(body) ? body.message : `Erro ${response.status} ao consultar a API.`
    throw new ApiRequestError(response.status, message)
  }

  return (await response.json()) as T
}
