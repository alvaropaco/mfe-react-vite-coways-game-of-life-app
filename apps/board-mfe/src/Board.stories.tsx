import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Board from "./Board";
import { within, userEvent, expect, waitFor } from "@storybook/test";
import { http, HttpResponse, delay } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const withCleanStorage = (Story: React.FC) => {
  localStorage.removeItem("boardId");
  return <Story />;
};

const withFreshQueryClient = (Story: React.FC) => {
  const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 0 } } });
  return (
    <QueryClientProvider client={qc}>
      <Story />
    </QueryClientProvider>
  );
};

const withBoardId = (id = "test-board-1") => (Story: React.FC) => {
  localStorage.setItem("boardId", id);
  return <Story />;
};

const meta: Meta = {
  title: "Board/Board (Container)",
  component: Board as any,
  decorators: [withCleanStorage, withFreshQueryClient],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Container do tabuleiro que orquestra fetch, mutações e atualizações otimistas usando TanStack Query.\n\nBoard container that orchestrates fetching, mutations, and optimistic updates using TanStack Query.",
      },
    },
  },
  tags: ["autodocs", "interaction"],
};
export default meta;

type Story = StoryObj<typeof Board>;

export const Loading_NoBoard: Story = {
  name: "Loading (no boardId)",
  render: () => <Board />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Loading board/i)).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "Sem boardId no localStorage, o componente inicia a criação de um novo board e exibe o estado de loading.\n\nWithout a boardId in localStorage, the component kicks off board creation and shows a loading state.",
      },
    },
  },
};

export const Loaded_WithBoard: Story = {
  name: "Loaded with board",
  decorators: [withBoardId("test-loaded")],
  render: () => <Board />,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "test-loaded", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "test-loaded", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Board ID: test-loaded/i)).toBeInTheDocument();
    await expect(await canvas.findByText(/Alive: 0/i)).toBeInTheDocument();
  },
};

export const Error_BoardLoad: Story = {
  name: "Error: board load fails",
  decorators: [withBoardId("bad-id")],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
        http.get("/api/boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
      ],
    },
  },
  render: () => <Board />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Failed to load board/i)).toBeInTheDocument();
  },
};

export const Update_Error_ShowsBanner: Story = {
  name: "Error: update shows banner and rollback",
  decorators: [withBoardId("test-upd-err")],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "test-upd-err", generation: 0, width: 5, height: 5, aliveCount: 0, grid: Array.from({ length: 5 }, () => Array(5).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "test-upd-err", generation: 0, width: 5, height: 5, aliveCount: 0, grid: Array.from({ length: 5 }, () => Array(5).fill(false)) })
        ),
        http.put("/api/Boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
        http.put("/api/boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
      ],
    },
  },
  render: () => <Board />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstCell = await canvas.findByTestId("cell-0-0");
    await userEvent.click(firstCell);
    await expect(await within(canvasElement).findByText(/Failed to update board/i)).toBeInTheDocument();
    await waitFor(async () => {
      await expect(within(canvasElement).getByText(/Alive: 0/i)).toBeInTheDocument();
    });
  },
};

export const Upload_CreatesNewBoard: Story = {
  name: "Upload creates new board when absent",
  render: () => <Board />,
  parameters: {
    msw: {
      handlers: [
        http.post("/api/boards", async ({ request }) => {
          const body = await request.json();
          const g = Array.isArray((body as any)?.grid)
            ? (body as any).grid
            : Array.from({ length: 6 }, () => Array(6).fill(false));
          return HttpResponse.json("new-board-123");
        }),
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "new-board-123", generation: 0, width: 6, height: 6, aliveCount: 0, grid: Array.from({ length: 6 }, () => Array(6).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "new-board-123", generation: 0, width: 6, height: 6, aliveCount: 0, grid: Array.from({ length: 6 }, () => Array(6).fill(false)) })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Board ID: new-board-123/i)).toBeInTheDocument();
    await expect(await canvas.findByText(/Alive: 0/i)).toBeInTheDocument();
  },
};

export const Toggle_Optimistic_IncrementsAlive: Story = {
  name: "Toggle cell → optimistic Alive+1",
  decorators: [withBoardId("test-opt")],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "test-opt", generation: 0, width: 5, height: 5, aliveCount: 0, grid: Array.from({ length: 5 }, () => Array(5).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "test-opt", generation: 0, width: 5, height: 5, aliveCount: 0, grid: Array.from({ length: 5 }, () => Array(5).fill(false)) })
        ),
        http.put("/api/Boards/:id", async () => {
          await delay(500);
          return HttpResponse.json({ id: "test-opt", generation: 0, width: 5, height: 5, aliveCount: 1, grid: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r === 0 && c === 0)) });
        }),
        http.put("/api/boards/:id", async () => {
          await delay(500);
          return HttpResponse.json({ id: "test-opt", generation: 0, width: 5, height: 5, aliveCount: 1, grid: Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => r === 0 && c === 0)) });
        }),
      ],
    },
  },
  render: () => <Board />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstCell = await canvas.findByTestId("cell-0-0");
    await userEvent.click(firstCell);
    await waitFor(async () => {
      await expect(within(canvasElement).getByText(/Alive: 1/i)).toBeInTheDocument();
    });
  },
};
