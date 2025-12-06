import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './app/providers/AuthContext'
import { ToastProvider } from './components/ui/Toast/ToastProvider'
import { SidebarProvider } from './components/admin/SidebarContext'
import Login from './app/routes/public/Login/Login'
import Register from './app/routes/public/Register/Register'
import Dashboard from './app/routes/admin/Dashboard/Dashboard'
import CadastrarPessoa from './app/routes/admin/CadastrarPessoa/CadastrarPessoa'
import ListarPessoas from './app/routes/admin/ListarPessoas/ListarPessoas'
import ListarAusencias from './app/routes/admin/ListarAusencias/ListarAusencias'
import AdicionarAusencia from './app/routes/admin/AdicionarAusencia/AdicionarAusencia'
import ListarAreas from './app/routes/admin/ListarAreas/ListarAreas'
import CadastrarArea from './app/routes/admin/CadastrarArea/CadastrarArea'
import DetalhesArea from './app/routes/admin/DetalhesArea/DetalhesArea'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/Dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/cadastrar-pessoa" 
            element={
              <ProtectedRoute>
                <CadastrarPessoa />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/editar-pessoa/:id" 
            element={
              <ProtectedRoute>
                <CadastrarPessoa />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/listar-pessoas" 
            element={
              <ProtectedRoute>
                <ListarPessoas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/listar-ausencias" 
            element={
              <ProtectedRoute>
                <ListarAusencias />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/adicionar-ausencia" 
            element={
              <ProtectedRoute>
                <AdicionarAusencia />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/editar-ausencia/:id" 
            element={
              <ProtectedRoute>
                <AdicionarAusencia />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/escala/areas" 
            element={
              <ProtectedRoute>
                <ListarAreas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/escala/areas/adicionar" 
            element={
              <ProtectedRoute>
                <CadastrarArea />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/escala/areas/:id" 
            element={
              <ProtectedRoute>
                <DetalhesArea />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/Dashboard/escala/areas/editar/:id" 
            element={
              <ProtectedRoute>
                <CadastrarArea />
              </ProtectedRoute>
            } 
          />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
