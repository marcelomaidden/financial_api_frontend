import { http, HttpResponse } from 'msw'
import { server } from '../test/server'

const origin = window.location.origin
const KEY = 'chave-secreta-123'

/** A chave é lida na carga do módulo, então cada caso recarrega os módulos com a variável desejada. */
async function loadApi(apiKey: string | undefined) {
  vi.resetModules()
  if (apiKey === undefined) vi.stubEnv('VITE_API_KEY', undefined as unknown as string)
  else vi.stubEnv('VITE_API_KEY', apiKey)
  return import('./endpoints')
}

/** Registra um handler que devolve `{}` e guarda o valor de X-API-Key recebido (null quando ausente). */
function captureKey(path: string, received: (string | null)[]) {
  server.use(
    http.get(`${origin}/api${path}`, ({ request }) => {
      received.push(request.headers.get('X-API-Key'))
      return HttpResponse.json({})
    }),
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('chave de API', () => {
  it('envia X-API-Key em todas as rotas quando VITE_API_KEY está configurada', async () => {
    const api = await loadApi(KEY)
    const received: (string | null)[] = []
    for (const path of [
      '/summary',
      '/accounts',
      '/credit-cards',
      '/loans',
      '/transactions',
      '/owners/m/accounts/c1/bills',
    ]) {
      captureKey(path, received)
    }

    await api.fetchSummary()
    await api.fetchAccounts()
    await api.fetchCreditCards()
    await api.fetchLoans()
    await api.fetchTransactions()
    await api.fetchBills('m', 'c1')

    expect(received).toEqual([KEY, KEY, KEY, KEY, KEY, KEY])
  })

  it('aplica trim na chave antes de enviar', async () => {
    const api = await loadApi(`  ${KEY}  `)
    const received: (string | null)[] = []
    captureKey('/accounts', received)
    await api.fetchAccounts()
    expect(received).toEqual([KEY])
  })

  it('não envia o cabeçalho quando VITE_API_KEY está ausente', async () => {
    const api = await loadApi(undefined)
    const received: (string | null)[] = []
    captureKey('/accounts', received)
    await api.fetchAccounts()
    expect(received).toEqual([null])
  })

  it.each(['', '   '])('não envia o cabeçalho quando VITE_API_KEY está em branco (%j)', async (value) => {
    const api = await loadApi(value)
    const received: (string | null)[] = []
    captureKey('/accounts', received)
    await api.fetchAccounts()
    expect(received).toEqual([null])
  })
})

describe('recusa de acesso (401)', () => {
  it('converte o 401 em ApiRequestError com a mensagem da API e sem a chave', async () => {
    const api = await loadApi(KEY)
    server.use(
      http.get(`${origin}/api/accounts`, () =>
        HttpResponse.json(
          { status: 401, error: 'Unauthorized', message: 'Chave de API ausente ou inválida' },
          { status: 401 },
        ),
      ),
    )

    const error = await api.fetchAccounts().catch((e: unknown) => e)
    expect(error).toMatchObject({
      name: 'ApiRequestError',
      status: 401,
      message: 'Chave de API ausente ou inválida',
    })
    expect((error as Error).message).not.toContain(KEY)
  })

  it('não inclui a chave na mensagem de erro de rede nem de corpo inesperado', async () => {
    const api = await loadApi(KEY)

    server.use(http.get(`${origin}/api/accounts`, () => HttpResponse.error()))
    const network = await api.fetchAccounts().catch((e: unknown) => e)
    expect((network as Error).message).not.toContain(KEY)

    server.use(http.get(`${origin}/api/accounts`, () => new HttpResponse('boom', { status: 500 })))
    const unexpected = await api.fetchAccounts().catch((e: unknown) => e)
    expect((unexpected as Error).message).not.toContain(KEY)
  })
})
