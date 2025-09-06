import type { Meta, StoryObj } from "@storybook/react";
import Controls from "./Controls";

const meta: Meta<typeof Controls> = {
  title: "Controls/Controls (Container)",
  component: Controls
};
export default meta;
type Story = StoryObj<typeof Controls>;

export const Default: Story = {};
