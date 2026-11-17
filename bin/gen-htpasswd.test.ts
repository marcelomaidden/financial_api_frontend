// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = join(import.meta.dirname, 'gen-htpasswd')
const PASSWORD = 'a b"c$d\'e'

let dir: string
let htpasswd: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'gen-htpasswd-'))
  htpasswd = join(dir, '.htpasswd')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** Roda o script só com as variáveis informadas (o resto do ambiente não vaza para o teste). */
function run(env: Record<string, string>) {
  const result = spawnSync(script, {
    env: { PATH: process.env.PATH ?? '', HTPASSWD_PATH: htpasswd, ...env },
    encoding: 'utf8',
  })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

/** Calcula o apr1 da senha com o sal do hash, como o nginx faz ao conferir o login. */
function apr1(password: string, salt: string) {
  const result = spawnSync('openssl', ['passwd', '-apr1', '-salt', salt, '-stdin'], {
    input: `${password}\n`,
    encoding: 'utf8',
  })
  return result.stdout.trim()
}

describe('gen-htpasswd', () => {
  it('grava usuario:hash apr1 com permissão 0600', () => {
    const { status } = run({ BASIC_AUTH_USER: 'marcelo', BASIC_AUTH_PASSWORD: 'segredo123' })
    expect(status).toBe(0)
    const [user, hash] = readFileSync(htpasswd, 'utf8').trim().split(/:(.*)/s)
    expect(user).toBe('marcelo')
    expect(hash).toMatch(/^\$apr1\$/)
    expect(statSync(htpasswd).mode & 0o777).toBe(0o600)
  })

  it('aceita senha com espaços, aspas e $, e o hash confere só com essa senha', () => {
    expect(run({ BASIC_AUTH_USER: 'marcelo', BASIC_AUTH_PASSWORD: PASSWORD }).status).toBe(0)
    const hash = readFileSync(htpasswd, 'utf8').trim().split(/:(.*)/s)[1]
    const salt = hash.split('$')[2]
    expect(apr1(PASSWORD, salt)).toBe(hash)
    expect(apr1('outra senha', salt)).not.toBe(hash)
  })

  it('recria o arquivo quando a senha muda', () => {
    run({ BASIC_AUTH_USER: 'marcelo', BASIC_AUTH_PASSWORD: 'senha-antiga' })
    const antes = readFileSync(htpasswd, 'utf8')
    run({ BASIC_AUTH_USER: 'marcelo', BASIC_AUTH_PASSWORD: 'senha-nova' })
    const depois = readFileSync(htpasswd, 'utf8')
    expect(depois).not.toBe(antes)
    expect(depois.trim().split('\n')).toHaveLength(1)
    const hash = depois.trim().split(/:(.*)/s)[1]
    expect(apr1('senha-nova', hash.split('$')[2])).toBe(hash)
  })

  it('não exibe a senha nem o usuário na saída em caso de sucesso', () => {
    const { output } = run({ BASIC_AUTH_USER: 'usuario-sigiloso', BASIC_AUTH_PASSWORD: 'senha-sigilosa' })
    expect(output).not.toContain('senha-sigilosa')
    expect(output).not.toContain('usuario-sigiloso')
  })

  describe('falha fechada', () => {
    const casos: [string, Record<string, string>, string][] = [
      ['usuário ausente', { BASIC_AUTH_PASSWORD: 'senha-sigilosa' }, 'BASIC_AUTH_USER'],
      ['senha ausente', { BASIC_AUTH_USER: 'usuario-sigiloso' }, 'BASIC_AUTH_PASSWORD'],
      ['usuário em branco', { BASIC_AUTH_USER: '   ', BASIC_AUTH_PASSWORD: 'senha-sigilosa' }, 'BASIC_AUTH_USER'],
      ['senha vazia', { BASIC_AUTH_USER: 'usuario-sigiloso', BASIC_AUTH_PASSWORD: '' }, 'BASIC_AUTH_PASSWORD'],
      ['senha só com espaços', { BASIC_AUTH_USER: 'usuario-sigiloso', BASIC_AUTH_PASSWORD: '  ' }, 'BASIC_AUTH_PASSWORD'],
      ['usuário com dois-pontos', { BASIC_AUTH_USER: 'usuario:sigiloso', BASIC_AUTH_PASSWORD: 'senha-sigilosa' }, 'BASIC_AUTH_USER'],
      ['senha com quebra de linha', { BASIC_AUTH_USER: 'usuario-sigiloso', BASIC_AUTH_PASSWORD: 'senha\nsigilosa' }, 'BASIC_AUTH_PASSWORD'],
    ]

    it.each(casos)('%s: sai com erro, cita a variável e não cria o arquivo', (_nome, env, variavel) => {
      const { status, output } = run(env)
      expect(status).toBe(1)
      expect(output).toContain(variavel)
      expect(existsSync(htpasswd)).toBe(false)
      for (const segredo of ['usuario-sigiloso', 'usuario:sigiloso', 'senha-sigilosa']) {
        expect(output).not.toContain(segredo)
      }
    })
  })
})
