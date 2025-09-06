import type { Meta, StoryObj } from "@storybook/react";
import Board from "./Board";

const meta: Meta<typeof Board> = {
  title: "Board/Board (Container)",
  component: Board
};
export default meta;
type Story = StoryObj<typeof Board>;

export const Default: Story = {};
