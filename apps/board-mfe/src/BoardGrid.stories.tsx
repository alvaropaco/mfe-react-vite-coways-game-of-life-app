import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { fn } from "@storybook/test";
import { BoardGrid, BoardGridBase } from "./BoardGrid";

type Props = React.ComponentProps<typeof BoardGrid>;
const makeGrid = (
  h: number,
  w: number,
  predicate: (r: number, c: number) => boolean
): boolean[][] => Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => predicate(r, c)));

const meta: Meta = {
  title: "Board/BoardGrid",
  component: BoardGridBase,
  parameters: {
    docs: {
      description: {
        component:
          "BoardGrid é um componente apresentacional controlado que renderiza uma grade NxN de células clicáveis. Use a prop 'grid' para controlar o estado e 'onToggle(r,c)' para reagir a cliques.\n\nBoardGrid is a controlled presentational component that renders an NxN grid of clickable cells. Use the 'grid' prop to control state and 'onToggle(r,c)' to react to clicks.",
      },
    },
    layout: "centered",
  },
  argTypes: {
    onToggle: { action: "toggled", description: "Invocado ao clicar em uma célula / Invoked when a cell is clicked" },
    grid: { control: false, description: "Matriz de booleanos representando células vivas/mortas / Boolean matrix for alive/dead cells" },
  },
  args: {
    grid: makeGrid(10, 10, () => Math.random() > 0.7),
    onToggle: fn(),
  },
  tags: ["autodocs", "interaction"],
};
export default meta;

type Story = StoryObj<Props>;

export const Default: Story = {};

export const Dense: Story = {
  args: {
    grid: makeGrid(10, 10, () => Math.random() > 0.4),
  },
};

export const Empty10x10: Story = {
  args: {
    grid: makeGrid(10, 10, () => false),
  },
};

export const Full10x10: Story = {
  args: {
    grid: makeGrid(10, 10, () => true),
  },
};

export const Rect15x10: Story = {
  args: {
    grid: makeGrid(15, 10, (r, c) => (r + c) % 3 === 0),
  },
};

export const InteractiveControlled: Story = {
  render: (args) => {
    const [grid, setGrid] = React.useState<boolean[][]>(args.grid ?? makeGrid(10, 10, () => false));
    const onToggle = (r: number, c: number) => {
      setGrid((prev) => {
        const next = prev.map((row) => row.slice());
        next[r][c] = !next[r][c];
        return next;
      });
      args.onToggle?.(r, c);
    };
    return <BoardGrid grid={grid} onToggle={onToggle} />;
  },
  args: {
    grid: makeGrid(10, 10, () => false),
  },
};

export const ClickCallsOnToggle: Story = {
  args: {
    grid: makeGrid(5, 5, () => false),
    onToggle: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const firstCell = canvas.getByTestId("cell-0-0");
    await userEvent.click(firstCell);
    expect(args.onToggle).toHaveBeenCalledTimes(1);
    expect(args.onToggle).toHaveBeenCalledWith(0, 0);
  },
};

export const RendersAllCells: Story = {
  name: "Renders expected number of cells",
  args: { grid: makeGrid(4, 7, () => false) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (let r = 0; r < 4; r++) {
      expect(canvas.getByTestId(`row-${r}`)).toBeTruthy();
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        expect(canvas.getByTestId(`cell-${r}-${c}`)).toBeTruthy();
      }
    }
  },
};
