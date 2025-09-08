import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Board from 'board_mfe/Board'
import Controls from 'controls_mfe/Controls'

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } })

function App(){
  return (
    <QueryClientProvider client={qc}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,padding:16}}>
        <div><h1>Conway's Game of Life</h1><Board /></div>
        <div><Controls /></div>
      </div>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
