import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { within, userEvent, expect } from "@storybook/test";
import { fn } from "@storybook/test";

export type AppRootProps = {
  title?: string;
  description?: string;
  showLink?: boolean;
  linkHref?: string;
  notices?: string[];
  errorMessage?: string | null;
  onOpen?: () => void;
};

const box: React.CSSProperties = {
  maxWidth: 720,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

export function AppRoot({
  title = "Shell host – see the running app for full MFE integration.",
  description = "This host composes microfrontends via Module Federation.",
  showLink = true,
  linkHref = "http://localhost:5173",
  notices = [],
  errorMessage = null,
  onOpen,
}: AppRootProps) {
  return (
    <section style={box}>
      <h1 style={{ margin: 0 }} data-testid="shell-title">
        {title}
      </h1>
      <p style={{ marginTop: 8 }} data-testid="shell-desc">
        {description}
      </p>

      {errorMessage && (
        <div role="alert" data-testid="shell-alert" style={{ background: "#fee2e2", color: "#b91c1c", padding: 8, borderRadius: 6, marginTop: 8 }}>
          {errorMessage}
        </div>
      )}

      {notices.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Notices:</strong>
          <ul data-testid="shell-notices">
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {showLink && (
          <a href={linkHref} target="_blank" rel="noreferrer" data-testid="shell-link">
            Open Host
          </a>
        )}
        <button type="button" onClick={() => onOpen?.()} data-testid="shell-open-btn">
          Open Host (action)
        </button>
      </div>
    </section>
  );
}

const meta: Meta<typeof AppRoot> = {
  title: "Shell/Host",
  component: AppRoot,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Host do Shell que ilustra a composição de microfrontends e fluxos de interação básicos para testes.\n\nShell Host that illustrates microfrontend composition and basic interaction flows for testing.",
      },
    },
  },
  argTypes: {
    title: { control: "text", description: "Título exibido no host / Title displayed in the host" },
    description: { control: "text", description: "Descrição / Description text" },
    showLink: { control: "boolean", description: "Exibir link para abrir o host / Show link to open host" },
    linkHref: { control: "text", description: "URL do host a ser aberto / Host URL to open" },
    notices: { control: "object", description: "Lista de avisos / List of notices" },
    errorMessage: { control: "text", description: "Mensagem de erro opcional / Optional error message" },
    onOpen: { action: "open", description: "Callback ao clicar no botão Open Host / Callback when clicking the Open Host button" },
  },
  args: {
    title: "Shell host – see the running app for full MFE integration.",
    description: "This host composes microfrontends via Module Federation.",
    showLink: true,
    linkHref: "http://localhost:5173",
    notices: [],
    errorMessage: null,
    onOpen: fn(),
  },
  tags: ["autodocs", "interaction"],
};
export default meta;

type Story = StoryObj<typeof AppRoot>;

export const Info_Default: Story = {
  name: "Info (default)",
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão informativo do Shell Host.\n\nDefault informative state of the Shell Host.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("shell-title")).toBeInTheDocument();
    await expect(canvas.getByTestId("shell-desc")).toBeInTheDocument();
  },
};

export const WithLink_Localhost: Story = {
  name: "With link (localhost)",
  args: {
    showLink: true,
    linkHref: "http://localhost:5173",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Exibe o link para abrir o host local da aplicação.\n\nShows a link to open the application's local host.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByTestId("shell-link") as HTMLAnchorElement;
    await expect(link).toBeInTheDocument();
    await expect(link.getAttribute("href")).toBe(args.linkHref);
    await expect(link.textContent).toMatch(/Open Host/i);
  },
};

export const WithMFEsList: Story = {
  name: "With MFEs list",
  args: {
    notices: ["Board MFE loaded", "Controls MFE loaded", "API healthy"],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Apresenta uma lista de microfrontends e avisos do host.\n\nPresents a list of microfrontends and host notices.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const ul = canvas.getByTestId("shell-notices");
    await expect(ul.querySelectorAll("li").length).toBe(args.notices?.length ?? 0);
  },
};

export const CTA_InvokesOnOpen: Story = {
  name: "CTA invokes onOpen",
  args: {
    onOpen: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Botão de ação dispara o callback 'onOpen'.\n\nAction button triggers the 'onOpen' callback.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByTestId("shell-open-btn");
    await userEvent.click(btn);
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
  },
};

export const ErrorBanner: Story = {
  name: "Error banner",
  args: {
    errorMessage: "Falha ao carregar MFEs. Tente novamente. / Failed to load MFEs. Please retry.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Mostra um banner de erro quando o host não consegue carregar os MFEs.\n\nShows an error banner when the host fails to load MFEs.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("shell-alert")).toBeInTheDocument();
  },
};
