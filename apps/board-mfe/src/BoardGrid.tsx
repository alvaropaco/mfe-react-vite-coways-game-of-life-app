import React from 'react'
export type BoardGridProps = { grid: boolean[][]; onToggle: (r:number,c:number)=>void }
const cell: React.CSSProperties = { width:18, height:18, border:'1px solid #ddd', cursor:'pointer' }

export function BoardGridBase({grid,onToggle}: BoardGridProps){
  return (
    <div style={{display:'inline-block'}} data-testid="board-grid">
      {grid.map((row, r) => (
        <div key={r} style={{display:'flex'}} data-testid={`row-${r}`}>
          {row.map((alive, c) => (
            <div
              key={c}
              onClick={()=>onToggle(r,c)}
              data-testid={`cell-${r}-${c}`}
              data-alive={alive ? 'true' : 'false'}
              style={{...cell, background: alive ? '#222' : '#fff'}}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export const BoardGrid = React.memo(BoardGridBase)
