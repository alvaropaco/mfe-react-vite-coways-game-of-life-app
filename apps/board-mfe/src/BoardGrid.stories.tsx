import type { Meta, StoryObj } from "@storybook/react";
import { BoardGrid } from "./BoardGrid";

const meta: Meta<typeof BoardGrid> = {
  title: "Board/BoardGrid",
  component: BoardGrid,
  args: {
    grid: Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => Math.random() > 0.7)
    ),
    onToggle: () => {}
  }
};
export default meta;
type Story = StoryObj<typeof BoardGrid>;

export const Default: Story = {};

export const Dense: Story = {
  args: {
    grid: Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => Math.random() > 0.4)
    )
  }
};
