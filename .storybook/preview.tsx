import React from 'react';
import type { Preview } from "@storybook/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { http, HttpResponse } from 'msw';

// Initialize MSW
initialize();

// In-memory mock board state for stories
let currentBoardId = "mock-board-1";
let grid: boolean[][] = Array.from({length: 10}, () => Array.from({length: 10}, () => false));
// seed a simple blinker
grid[1][2] = true; grid[2][2] = true; grid[3][2] = true;

function nextState(g:boolean[][]){
  const h=g.length,w=g[0].length;
  const n = Array.from({length:h},()=>Array.from({length:w},()=>false));
  for(let r=0;r<h;r++){
    for(let c=0;c<w;c++){
      let neigh=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(dr===0 && dc===0) continue;
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<h&&nc>=0&&nc<w&&g[nr][nc]) neigh++;
      }
      n[r][c] = g[r][c] ? (neigh===2 || neigh===3) : (neigh===3);
    }
  }
  return n;
}
function aliveCount(g:boolean[][]){ return g.flat().filter(Boolean).length; }

const handlers = [
  // Upload -> returns new id
  http.post("http://localhost:8080/api/boards", async ({ request }) => {
    const body = await request.json();
    if(Array.isArray(body?.grid)){
      grid = body.grid;
      currentBoardId = "mock-" + Math.random().toString(36).slice(2,8);
    }
    return HttpResponse.json(currentBoardId);
  }),

  // Get board
  http.get("http://localhost:8080/api/boards/:id", () => {
    return HttpResponse.json({
      id: currentBoardId,
      generation: 0,
      width: grid[0].length,
      height: grid.length,
      aliveCount: aliveCount(grid),
      grid
    });
  }),

  // Next (non-mutating)
  http.get("http://localhost:8080/api/boards/:id/next", () => {
    const n = nextState(grid);
    return HttpResponse.json({
      id: currentBoardId,
      generation: 1,
      width: n[0].length,
      height: n.length,
      aliveCount: aliveCount(n),
      grid: n
    });
  }),

  // Steps (non-mutating)
  http.get("http://localhost:8080/api/boards/:id/steps/:n", ({ params }) => {
    const nSteps = Number(params.n || 0);
    let cur = grid;
    for(let i=0;i<nSteps;i++) cur = nextState(cur);
    return HttpResponse.json({
      id: currentBoardId,
      generation: nSteps,
      width: cur[0].length,
      height: cur.length,
      aliveCount: aliveCount(cur),
      grid: cur
    });
  }),

  // Advance (mutates)
  http.post("http://localhost:8080/api/boards/:id/advance", ({ request }) => {
    const url = new URL(request.url);
    const steps = Number(url.searchParams.get("steps") || "1");
    for(let i=0;i<steps;i++) grid = nextState(grid);
    return HttpResponse.json({
      id: currentBoardId,
      generation: steps,
      width: grid[0].length,
      height: grid.length,
      aliveCount: aliveCount(grid),
      grid
    });
  })
];

const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 0 }
  }
});

const preview: Preview = {
  decorators: [
    mswDecorator,
    (Story) => (
      <QueryClientProvider client={qc}>
        <Story />
      </QueryClientProvider>
    )
  ],
  parameters: {
    msw: { handlers }
  }
};

export default preview;
