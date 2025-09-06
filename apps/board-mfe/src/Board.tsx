import React from 'react'
import { useEffect, useState } from 'react'
import { BoardGrid } from './BoardGrid'
import { useBoard, useUploadMutation, useUpdateGridMutation } from '@gol/api-client'
import type { UploadBoardRequest, BoardStateResponse } from '@gol/types'
import { useQueryClient } from '@tanstack/react-query'

const DEFAULT_SIZE = 20
const empty = (n=DEFAULT_SIZE)=>Array.from({length:n},()=>Array.from({length:n},()=>false))

function ensureGrid(grid: boolean[][] | null | undefined, h?: number, w?: number): boolean[][] {
  if (grid && Array.isArray(grid)) return grid
  const height = h ?? DEFAULT_SIZE
  const width = w ?? DEFAULT_SIZE
  return Array.from({ length: height }, () => Array.from({ length: width }, () => false))
}

function countAlive(grid: boolean[][]): number {
  let total = 0
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]
    for (let c = 0; c < row.length; c++) if (row[c]) total++
  }
  return total
}

export default function Board(): JSX.Element {
  const [boardId, setBoardId] = useState<string|null>(()=>localStorage.getItem('boardId'))
  const upload = useUploadMutation()
  const { data, isLoading, error } = useBoard(boardId ?? undefined)
  const update = useUpdateGridMutation(boardId!)
  const qc = useQueryClient()

  useEffect(()=>{
    (async()=>{
      if(!boardId && !upload.isPending){
        const req: UploadBoardRequest = { grid: empty() }
        try {
          const id = await upload.mutateAsync(req)
          localStorage.setItem('boardId', id)
          // Notify other MFEs immediately
          try { window.dispatchEvent(new CustomEvent('gol:boardIdChanged', { detail: id })) } catch { /* noop */ void 0 }
          setBoardId(id)
        } catch { /* Swallow here; UI will show upload.error if needed */ void 0 }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  const onToggle = React.useCallback(async (r: number, c: number) => {
    // Immediately notify interaction so Controls can show UI without reload
    try { window.dispatchEvent(new Event('gol:boardInteracted')) } catch { /* noop */ void 0 }
    if (!data || !boardId) return;
    const base = ensureGrid(data.grid, data.height, data.width)
    const clone = base.map(row => row.slice());
    clone[r][c] = !clone[r][c];

    // Optimistic update: cache patch for current board
    const key = ['board', boardId]
    const previous = qc.getQueryData<BoardStateResponse>(key)
    const optimistic: BoardStateResponse | undefined = previous ? { ...previous, grid: clone, aliveCount: countAlive(clone) } : undefined
    if (optimistic) qc.setQueryData(key, optimistic)

    try {
      await update.mutateAsync(clone) // Mantém o mesmo boardId
    } catch {
      // Rollback
      if (previous) qc.setQueryData(key, previous)
    }
  }, [data, boardId, qc, update])

  if(!boardId) return (<div>Loading board...</div>)
  if(isLoading) return (<div>Loading board...</div>)
  if(error) return (<div style={{color:'#b00'}}>Failed to load board: {(error as Error).message}</div>)
  if(!data) return (<div>No board data.</div>)

  const grid = ensureGrid(data.grid, data.height, data.width)

  return (
    <div>
      <BoardGrid grid={grid} onToggle={onToggle} />
      {upload.isError && <div style={{color:'#b00', marginTop:8}}>Failed to create board: {(upload.error as Error).message}</div>}
      {update.isError && <div style={{color:'#b00', marginTop:8}}>Failed to update board: {(update.error as Error).message}</div>}
      <div style={{marginTop:8,color:'#666'}}>Board ID: {boardId} • Gen: {data.generation} • Alive: {data.aliveCount}</div>
    </div>
  )
}
