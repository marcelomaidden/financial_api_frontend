import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
import { OwnerAvatar } from './OwnerAvatar'
import { PartialWarning } from './PartialWarning'
import { TransactionRow } from './TransactionRow'

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

describe('TransactionRow', () => {
  function renderRow(props: Partial<Parameters<typeof TransactionRow>[0]> = {}) {
    render(
      <ul>
        <TransactionRow income={false} description="Mercado" amount="R$ 30,00" {...props} />
      </ul>,
    )
    return screen.getByRole('listitem')
  }

  it('mostra a saída com ícone, "−" e valor vermelho', () => {
    const row = renderRow()
    expect(within(row).getByRole('img', { name: 'Saída' })).toBeInTheDocument()
    expect(within(row).getByText('Mercado')).toBeInTheDocument()
    const amount = row.querySelector('span.text-red-600')!
    expect(amount).toHaveTextContent('− R$ 30,00')
    expect(row.querySelector('span.text-green-600')).toBeNull()
  })

  it('mostra a entrada com ícone e valor verdes, sem "−"', () => {
    const row = renderRow({ income: true, description: 'Salário', amount: 'R$ 100,00' })
    expect(within(row).getByRole('img', { name: 'Entrada' })).toBeInTheDocument()
    const amount = row.querySelector('span.text-green-600')!
    expect(amount).toHaveTextContent('R$ 100,00')
    expect(amount).not.toHaveTextContent('−')
    expect(row.querySelector('span.text-red-600')).toBeNull()
  })

  it('mostra detail sob a descrição, aside antes do valor e amountNote sob o valor', () => {
    const row = renderRow({
      detail: '05/11/2026',
      aside: <span>Cartão Nubank</span>,
      amountNote: 'US$ 58,00',
    })
    expect(within(row).getByText('05/11/2026')).toBeInTheDocument()
    expect(within(row).getByText('Cartão Nubank')).toBeInTheDocument()
    const note = within(row).getByText('US$ 58,00')
    expect(note).toBeInTheDocument()
    // A nota fica fora do <span> do valor: o texto do valor não a inclui.
    expect(row.querySelector('span.text-red-600')).not.toHaveTextContent('US$')
  })

  it('troca o ícone de direção pelo conteúdo de leading', () => {
    const row = renderRow({ leading: <span data-testid="avatar">M</span> })
    expect(within(row).getByTestId('avatar')).toBeInTheDocument()
    expect(within(row).queryByRole('img', { name: 'Saída' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('img', { name: 'Entrada' })).not.toBeInTheDocument()
  })

  it('mostra o valor neutro sem cor de entrada ou saída e sem "−"', () => {
    const row = renderRow({ neutral: true, description: 'Nubank', amount: 'R$ 500,50' })
    expect(row.querySelector('span.text-red-600')).toBeNull()
    expect(row.querySelector('span.text-green-600')).toBeNull()
    expect(row).not.toHaveTextContent('−')
    expect(within(row).getByText('R$ 500,50')).toHaveClass('font-medium')
  })

  it('mantém o sinal negativo que já vem no valor neutro', () => {
    const row = renderRow({ neutral: true, leading: <span>M</span>, amount: '-R$ 50,00' })
    expect(within(row).getByText('-R$ 50,00')).toBeInTheDocument()
    expect(row.querySelector('span.text-red-600')).toBeNull()
  })

  it('não cria detail, aside nem amountNote quando não são informados', () => {
    const row = renderRow()
    expect(row.querySelectorAll('span.text-xs')).toHaveLength(0)
  })
})
