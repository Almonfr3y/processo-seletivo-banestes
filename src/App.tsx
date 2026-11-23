/**
 * Raiz da aplicação: provedor de dados + rotas.
 *
 *   /                 → lista de clientes
 *   /clientes/novo    → cadastro de cliente
 *   /clientes/:id     → detalhes do cliente
 */

import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { DadosProvider } from './context/DadosProvider';
import { PaginaCliente } from './pages/PaginaCliente';
import { PaginaClientes } from './pages/PaginaClientes';
import { PaginaNaoEncontrada } from './pages/PaginaNaoEncontrada';
import { PaginaNovoCliente } from './pages/PaginaNovoCliente';

export default function App() {
  return (
    <DadosProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PaginaClientes />} />
            {/* "novo" vem antes de ":id" por clareza; o React Router já prioriza rotas fixas */}
            <Route path="clientes/novo" element={<PaginaNovoCliente />} />
            <Route path="clientes/:id" element={<PaginaCliente />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DadosProvider>
  );
}
