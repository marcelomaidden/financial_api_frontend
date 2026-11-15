import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from './ErrorMessage'
import { Loading } from './Loading'
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
