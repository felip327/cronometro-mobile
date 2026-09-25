// src/App.jsx
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [dados, setDados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function buscarDados() {
      try {
        setCarregando(true)
        // Busca os registros da nuvem (Supabase)
        const { data, error } = await supabase
          .from('sessoes_estudo')
          .select('*')
          .order('id', { ascending: false })

        if (error) throw error
        setDados(data)
      } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err.message)
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }

    buscarDados()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-6 border-b border-gray-800 pb-4">
          <h1 className="text-2xl font-bold text-emerald-400">Dados da Nuvem ☁️</h1>
          <p className="text-sm text-gray-400">Supabase • Sincronização em Tempo Real</p>
        </header>

        {carregando && (
          <div className="text-center py-8 text-gray-400 animate-pulse">
            Carregando dados da nuvem...
          </div>
        )}

        {erro && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200 mb-4 text-sm">
            Erro ao carregar dados: {erro}
          </div>
        )}

        {!carregando && !erro && (
          <div className="space-y-3">
            {dados.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Nenhum registro encontrado.</p>
            ) : (
              dados.map((sessao) => (
                <div
                  key={sessao.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-emerald-300">
                      {sessao.tipo === 'focus'
                        ? '🎯 Sessão de Foco'
                        : sessao.tipo === 'short_break'
                        ? '☕ Pausa Curta'
                        : '🌙 Pausa Longa'}
                    </span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 font-mono">
                      {sessao.duracao_minutos} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                    <span>{sessao.concluida ? '✅ Concluída' : '⏳ Não concluída'}</span>
                    <span>
                      {sessao.finalizada_em
                        ? new Date(sessao.finalizada_em).toLocaleDateString('pt-BR')
                        : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
