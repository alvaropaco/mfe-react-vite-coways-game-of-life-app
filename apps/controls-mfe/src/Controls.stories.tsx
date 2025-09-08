import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Controls from "./Controls";
import { within, userEvent, expect, waitFor, screen } from "@storybook/test";
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

function FireInteractedOnce() {
  React.useEffect(() => {
    const id = setTimeout(() => {
      const ev = new Event("gol:boardInteracted");
      window.dispatchEvent(ev);
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return <Controls />;
}

const meta: Meta<typeof Controls> = {
  title: "Controls/Controls",
  component: Controls,
  decorators: [withCleanStorage, withFreshQueryClient],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Control panel for Conway's Game of Life: advance steps, autoplay, and reset.",
      },
    },
    chromatic: { pauseAnimationAtEnd: true },
  },
  tags: ["autodocs", "interaction"],
};
export default meta;

type Story = StoryObj<typeof Controls>;

export const NoBoard_Default: Story = {
  name: "Empty state (no board yet)",
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Create a board on the left\./i)
    ).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "When no boardId is present in localStorage and the user never interacted, the component prompts to create a board.\n",
      },
    },
  },
};

export const Interacted_NoBoard_Loading: Story = {
  name: "Interacted → Loading panel",
  render: () => <FireInteractedOnce />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Loading controls/i)
    ).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story:
          "After a synthetic interaction event without a boardId, the component shows the loading panel.",
      },
    },
  },
};

const withBoardId = (id = "mock-board-1") => (Story: React.FC) => {
  const Wrapper: React.FC = () => {
    React.useEffect(() => {
      localStorage.setItem("boardId", id);
      const ev = new CustomEvent<string>("gol:boardIdChanged", { detail: id });
      const t = setTimeout(() => window.dispatchEvent(ev), 0);
      return () => clearTimeout(t);
    }, []);
    return <Story />;
  };
  return <Wrapper />;
};

export const Loaded_WithBoard: Story = {
  name: "Loaded with board",
  decorators: [withBoardId()],
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("button", { name: /Next/i })
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole("button", { name: /Advance N/i })
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole("button", { name: /Play/i })
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole("button", { name: /Reset/i })
    ).toBeInTheDocument();
  },
};

export const AdvanceN_Steps5: Story = {
  name: "Advance N (5 steps)",
  decorators: [withBoardId()],
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "5");

    const advBtn = await canvas.findByRole("button", { name: /Advance N/i });
    await userEvent.click(advBtn);

    await expect(advBtn).toBeDisabled();
    await waitFor(() => expect(advBtn).not.toBeDisabled(), { timeout: 1000 });
  },
};

export const Play_Toggle_DisablesAdvance: Story = {
  name: "Play/Stop toggles and disables advance",
  decorators: [withBoardId()],
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const playBtn = await canvas.findByRole("button", { name: /Play/i });
    await userEvent.click(playBtn);

    await expect(
      await canvas.findByRole("button", { name: /Stop/i })
    ).toBeInTheDocument();

    await waitFor(() => expect(canvas.getByRole("button", { name: /Next/i })).toBeDisabled());
    await waitFor(() => expect(canvas.getByRole("button", { name: /Advance N/i })).toBeDisabled());

    const stopBtn = await canvas.findByRole("button", { name: /Stop/i });
    await userEvent.click(stopBtn);
    await waitFor(() => expect(canvas.getByRole("button", { name: /Next/i })).not.toBeDisabled());
    await waitFor(() => expect(canvas.getByRole("button", { name: /Advance N/i })).not.toBeDisabled());
  },
};

export const Reset_DisabledDuringPending: Story = {
  name: "Reset: disabled while pending",
  decorators: [withBoardId()],
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const resetBtn = await canvas.findByRole("button", { name: /Reset/i });
    await userEvent.click(resetBtn);
    await expect(resetBtn).toBeDisabled();
    await waitFor(() => expect(resetBtn).not.toBeDisabled(), { timeout: 1200 });
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
        http.get("/api/Boards/:id/next", () => HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })),
        http.get("/api/boards/:id/next", () => HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })),
      ],
    },
  },
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Failed to load board/i)).toBeInTheDocument();
  },
};

export const Error_Advance: Story = {
  name: "Error: advance fails",
  decorators: [withBoardId()],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "mock", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/Boards/:id/next", () =>
          HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "mock", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/boards/:id/next", () =>
          HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.post("/api/Boards/:id/advance", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
        http.post("/api/boards/:id/advance", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
      ],
    },
  },
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const next = await canvas.findByRole("button", { name: /Next/i });
    await userEvent.click(next);
    await expect(await canvas.findByText(/Advance failed/i)).toBeInTheDocument();
  },
};

export const Error_Reset: Story = {
  name: "Error: reset fails",
  decorators: [withBoardId()],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/Boards/:id", () =>
          HttpResponse.json({ id: "mock", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/Boards/:id/next", () =>
          HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/boards/:id", () =>
          HttpResponse.json({ id: "mock", generation: 0, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.get("/api/boards/:id/next", () =>
          HttpResponse.json({ id: "mock", generation: 1, width: 10, height: 10, aliveCount: 0, grid: Array.from({ length: 10 }, () => Array(10).fill(false)) })
        ),
        http.put("/api/boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
        http.put("/api/Boards/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
      ],
    },
  },
  render: () => <Controls />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const reset = await canvas.findByRole("button", { name: /Reset/i });
    await userEvent.click(reset);
    await expect(await canvas.findByText(/Reset failed/i)).toBeInTheDocument();
  },
};
