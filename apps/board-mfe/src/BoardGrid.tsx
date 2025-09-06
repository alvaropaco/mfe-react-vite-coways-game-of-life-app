import React from 'react'
type Props = { grid: boolean[][]; onToggle: (r:number,c:number)=>void }
const cell: React.CSSProperties = { width:18, height:18, border:'1px solid #ddd', cursor:'pointer' }
export const BoardGrid = React.memo(function BoardGrid({grid,onToggle}:Props){
  return (
    <div style={{display:'inline-block'}}>
      {grid.map((row, r) => (
        <div key={r} style={{display:'flex'}}>
          {row.map((alive, c) => (
            <div key={c} onClick={()=>onToggle(r,c)} style={{...cell, background: alive ? '#222' : '#fff'}} />
          ))}
        </div>
      ))}
    </div>
  )
})
