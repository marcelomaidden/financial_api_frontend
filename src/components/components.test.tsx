import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
import { OwnerAvatar } from './OwnerAvatar'
import { PartialWarning } from './PartialWarning'

describe('Loading', () => {
  it('indica o carregamento', () => {
    render(<Loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
  })
})

describe('ErrorMessage', () => {
  it('mostra a mensagem e chama onRetry ao clicar em "Tentar de novo"', async () => {
    const onRetry = vi.fn()
    render(<ErrorMessage message="Falhou" onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('não mostra o botão sem onRetry', () => {
    render(<ErrorMessage message="Falhou" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('PartialWarning', () => {
  it('lista as mensagens', () => {
    render(<PartialWarning messages={['luana: erro']} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Dados incompletos')
    expect(screen.getByText('luana: erro')).toBeInTheDocument()
  })

  it('não renderiza sem mensagens', () => {
    const { container } = render(<PartialWarning messages={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('OwnerAvatar', () => {
  it('mostra a inicial e expõe o nome no rótulo acessível e no hover', () => {
    render(<OwnerAvatar owner="luana" />)
    const avatar = screen.getByRole('img', { name: 'luana' })
    expect(avatar).toHaveTextContent('L')
    expect(avatar).toHaveAttribute('title', 'luana')
  })

  it('usa a mesma cor para o mesmo dono e cores diferentes entre donos conhecidos', () => {
    render(
      <>
        <OwnerAvatar owner="marcelo" />
        <OwnerAvatar owner="Marcelo" />
        <OwnerAvatar owner="luana" />
      </>,
    )
    const [a, b, c] = screen.getAllByRole('img')
    expect(a.className).toBe(b.className)
    expect(a.className).not.toBe(c.className)
  })

  it('usa a cor neutra para dono desconhecido, sem verde nem vermelho', () => {
    render(<OwnerAvatar owner="joana" />)
    const avatar = screen.getByRole('img', { name: 'joana' })
    expect(avatar).toHaveTextContent('J')
    expect(avatar.className).toContain('bg-slate-200')
    expect(avatar.className).not.toMatch(/green|red/)
  })

  it('com showName escreve o nome e tira o avatar da árvore de acessibilidade', () => {
    render(<OwnerAvatar owner="marcelo" showName />)
    expect(screen.getByText('marcelo')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
