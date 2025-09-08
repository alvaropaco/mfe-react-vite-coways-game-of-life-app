import React from 'react'
import { useAdvanceMutation, useBoard, usePreviewNext, useUpdateGridMutation } from '@gol/api-client'

function useBoardId(){
  const [id, setId] = React.useState<string|null>(()=>localStorage.getItem('boardId'))
  React.useEffect(()=>{
    setId(localStorage.getItem('boardId') || null)
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>
      const nextId = custom?.detail ?? localStorage.getItem('boardId')
      setId(nextId)
    }
    window.addEventListener('gol:boardIdChanged', handler as EventListener)
    return () => window.removeEventListener('gol:boardIdChanged', handler as EventListener)
  },[])
  return id
}

function makeEmpty(h: number, w: number): boolean[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => false))
}

const ControlsButtons = React.memo(function ControlsButtons({
  onNext,
  onAdvanceN,
  advancePending,
  playing,
  togglePlay,
  onReset,
  resetPending,
}: {
  onNext: () => void
  onAdvanceN: (n: number) => void
  advancePending: boolean
  playing: boolean
  togglePlay: () => void
  onReset: () => void
  resetPending: boolean
}){
  const [steps, setSteps] = React.useState(1)

  const onAdvanceClick = React.useCallback(()=>{
    onAdvanceN(Math.max(1, steps))
  }, [onAdvanceN, steps])

  return (
    <div style={{display:'grid',gap:8}}>
      <button onClick={onNext} disabled={advancePending}>Next</button>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="number" min={1} value={steps} onChange={e=>setSteps(Math.max(1, Number(e.target.value)))} style={{width:80}} />
        <button onClick={onAdvanceClick} disabled={advancePending}>Advance N</button>
      </div>
      <button onClick={togglePlay}>{playing?'Stop':'Play'}</button>
      <button onClick={onReset} disabled={resetPending}>Reset</button>
    </div>
  )
})

const PreviewPanel = React.memo(function PreviewPanel({ aliveNext, isError, errorMessage }: { aliveNext?: number, isError?: boolean, errorMessage?: string }){
  return (
    <div style={{marginTop:16}}>
      <strong>Preview Next</strong>
      {isError && <div style={{color:'#b00'}}>Preview failed: {errorMessage}</div>}
      <div style={{fontSize:12,color:'#666'}}>Alive next: {aliveNext ?? '...'}</div>
    </div>
  )
})

const StatusPanel = React.memo(function StatusPanel({ generation, aliveCount }: { generation?: number, aliveCount?: number }){
  return (
    <div style={{marginTop:16,fontSize:12,color:'#666'}}>Current: Gen {generation} • Alive {aliveCount}</div>
  )
})

export default function Controls(){
  const [interacted, setInteracted] = React.useState(false)
  React.useEffect(()=>{
    const onInteracted = () => setInteracted(true)
    window.addEventListener('gol:boardInteracted', onInteracted)
    return () => window.removeEventListener('gol:boardInteracted', onInteracted)
  },[])

  const boardId = useBoardId()
  const { data, error: boardError, isLoading: boardLoading } = useBoard(boardId ?? undefined)
  const preview = usePreviewNext(boardId ?? undefined)
  const advance = useAdvanceMutation(boardId ?? '')
  const update = useUpdateGridMutation(boardId ?? '')

  const advanceRef = React.useRef(advance)
  React.useEffect(()=>{ advanceRef.current = advance }, [advance])
  const updateRef = React.useRef(update)
  React.useEffect(()=>{ updateRef.current = update }, [update])

  const [playing, setPlaying] = React.useState(false)
  const [manualAdvancing, setManualAdvancing] = React.useState(false)

  const hRef = React.useRef<number>(20)
  const wRef = React.useRef<number>(20)
  React.useEffect(()=>{
    if(data?.height) hRef.current = data.height
    if(data?.width) wRef.current = data.width
  }, [data?.height, data?.width])

  const onNext = React.useCallback(()=>{
    setManualAdvancing(true)
    advanceRef.current.mutateAsync(1).finally(()=>{
      setTimeout(()=> setManualAdvancing(false), 120)
    })
  }, [])

  const onAdvanceN = React.useCallback((n: number)=>{
    setManualAdvancing(true)
    advanceRef.current.mutateAsync(n).finally(()=>{
      setTimeout(()=> setManualAdvancing(false), 120)
    })
  }, [])

  const togglePlay = React.useCallback(()=>{
    setPlaying(p=>!p)
  }, [])

  const onReset = React.useCallback(()=>{
    if(!boardId) return
    updateRef.current.mutate(makeEmpty(hRef.current, wRef.current))
  }, [boardId])

  React.useEffect(()=>{
    if(!playing || !boardId) return
    const h = setInterval(()=> advanceRef.current.mutate(1), 500)
    return ()=> clearInterval(h)
  }, [playing, boardId])

  const LoadingPanel = React.useMemo(()=> (
    <div style={{border:'1px solid #e5e5e5', padding:16, borderRadius:8}}>
      <h2>Controls</h2>
      <div>Loading controls...</div>
    </div>
  ), [])

  if(!boardId && !interacted) return <div>Create a board on the left.</div>
  if(!boardId && interacted) return LoadingPanel
  if(boardLoading) return LoadingPanel
  if(boardError) return <div style={{color:'#b00'}}>Failed to load board: {(boardError as Error).message}</div>

  const advanceDisabled = playing || manualAdvancing

  return (
    <div style={{border:'1px solid #e5e5e5', padding:16, borderRadius:8}}>
      <h2>Controls</h2>
      <ControlsButtons
        onNext={onNext}
        onAdvanceN={onAdvanceN}
        advancePending={advanceDisabled}
        playing={playing}
        togglePlay={togglePlay}
        onReset={onReset}
        resetPending={update.isPending}
      />
      {advance.isError && <div style={{color:'#b00'}}>Advance failed: {(advance.error as Error).message}</div>}
      {update.isError && <div style={{color:'#b00'}}>Reset failed: {(update.error as Error).message}</div>}
      <PreviewPanel
        aliveNext={preview.data?.aliveCount}
        isError={preview.isError}
        errorMessage={(preview.error as Error | undefined)?.message}
      />
      <StatusPanel generation={data?.generation} aliveCount={data?.aliveCount} />
    </div>
  )
}
