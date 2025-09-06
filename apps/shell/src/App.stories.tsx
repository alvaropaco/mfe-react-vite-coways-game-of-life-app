import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

const AppRoot = () => <div>Shell host – see the running app for full MFE integration.</div>;

const meta: Meta<typeof AppRoot> = {
  title: "Shell/Host",
  component: AppRoot
};
export default meta;
type Story = StoryObj<typeof AppRoot>;

export const Info: Story = {};
