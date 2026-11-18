import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AccountsPage } from './pages/AccountsPage'
import { BillDetailPage } from './pages/BillDetailPage'
import { LoansPage } from './pages/LoansPage'
import { OverviewPage } from './pages/OverviewPage'
import { TransactionsPage } from './pages/TransactionsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="bills/:id" element={<BillDetailPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
      </Route>
    </Routes>
  )
}
