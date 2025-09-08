// @ts-expect-error Remote module types are provided at runtime via Module Federation; these declarations are for tooling only.
declare module 'board_mfe/Board' {
  import React from 'react'
  const Board: React.ComponentType<unknown>
  export default Board
}

// @ts-expect-error Remote module types are provided at runtime via Module Federation; these declarations are for tooling only.
declare module 'controls_mfe/Controls' {
  import React from 'react'
  const Controls: React.ComponentType<unknown>
  export default Controls
}