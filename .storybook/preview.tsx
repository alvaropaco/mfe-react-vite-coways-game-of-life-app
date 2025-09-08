import React from 'react';
import type { Preview } from "@storybook/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { http, HttpResponse, delay } from 'msw';

// Initialize MSW
initialize({ onUnhandledRequest: 'warn', serviceWorker: { url: '/mockServiceWorker.js' } });

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

// Helper to build handlers for a variety of URL shapes (absolute/relative and case variants)
function buildHandlers(prefix: string) {
  const base = (path: string) => `${prefix}${path}`;
  return [
    // Upload -> returns new id
    http.post(base('/api/boards'), async ({ request }) => {
      const body = await request.json();
      if(Array.isArray((body as any)?.grid)){
        grid = (body as any).grid;
        currentBoardId = "mock-" + Math.random().toString(36).slice(2,8);
      }
      return HttpResponse.json(currentBoardId);
    }),

    // Update grid (mutates) - lowercase path used by api-client
    http.put(base('/api/boards/:id'), async ({ request }) => {
      const body = await request.json();
      if(Array.isArray((body as any)?.grid)){
        grid = (body as any).grid as boolean[][];
      }
      return HttpResponse.json({
        id: currentBoardId,
        generation: 0,
        width: grid[0].length,
        height: grid.length,
        aliveCount: aliveCount(grid),
        grid
      });
    }),

    // Get board
    http.get(base('/api/boards/:id'), () => {
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
    http.get(base('/api/boards/:id/next'), () => {
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
    http.get(base('/api/boards/:id/steps/:n'), ({ params }) => {
      const nSteps = Number((params as any).n || 0);
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
    http.post(base('/api/boards/:id/advance'), ({ request }) => {
      const url = new URL(request.url, 'http://localhost');
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
    }),

    // Uppercase path variants used by the api-client
    http.get(base('/api/Boards/:id'), () => {
      return HttpResponse.json({
        id: currentBoardId,
        generation: 0,
        width: grid[0].length,
        height: grid.length,
        aliveCount: aliveCount(grid),
        grid
      });
    }),
    http.get(base('/api/Boards/:id/next'), () => {
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
    http.get(base('/api/Boards/:id/steps/:n'), ({ params }) => {
      const nSteps = Number((params as any).n || 0);
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
    http.post(base('/api/Boards/:id/advance'), ({ request }) => {
      const url = new URL(request.url, 'http://localhost');
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
    }),
    // Uppercase PUT variant (not used today but provided for completeness)
    http.put(base('/api/Boards/:id'), async ({ request }) => {
      const body = await request.json();
      if(Array.isArray((body as any)?.grid)){
        grid = (body as any).grid as boolean[][];
      }
      return HttpResponse.json({
        id: currentBoardId,
        generation: 0,
        width: grid[0].length,
        height: grid.length,
        aliveCount: aliveCount(grid),
        grid
      });
    }),
    // Fallback: catch any API call we didn't explicitly handle to avoid 404s in tests
    http.all(base('/api/:rest*'), ({ request }) => {
      // Best-effort generic response; helps stories that only need buttons to render
      // and avoids failing the whole test run due to an unrelated 404
      console.warn('[MSW fallback]', request.method, request.url);
      return HttpResponse.json({ ok: true });
    })
  ];
}

const handlers = [
  ...buildHandlers(''),
  ...buildHandlers('http://localhost:6006'),
  ...buildHandlers('http://127.0.0.1:6006'),
  ...buildHandlers('http://localhost:8080'),
  ...buildHandlers('http://127.0.0.1:8080')
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
