import { build, createBuilder, createServer, InlineConfig } from "vite";
import { OsmosApp } from "../core/app";
import baseReact from "@vitejs/plugin-react";
import router from "./plugins/router";
import reactServer from "./plugins/react/react-server";
import { fileURLToPath } from "mlly";
import { reactSSR } from "./plugins/react/react-ssr";
import { join } from "pathe";
import { reactClient } from "./plugins/react/react-client";

export function createViteConfig(osmos: OsmosApp): InlineConfig {
  return {
    configFile: false,
    appType: "custom",
    base: "/_osmos",
    root: process.cwd(),
    plugins: [
      baseReact(),
      reactServer({
        outDir: join(osmos.options.buildDir, "dist", "react-server"),
        entry: fileURLToPath(
          new URL("../runtime/rsc/handler.js", import.meta.url),
        ),
      }),
      reactSSR({
        outDir: join(osmos.options.buildDir, "dist", "ssr"),
        entry: fileURLToPath(
          new URL("../runtime/ssr/handler.js", import.meta.url),
        ),
      }),
      reactClient({
        outDir: join(osmos.options.buildDir, "dist", "client"),
        entry: fileURLToPath(
          new URL("../runtime/client/entry.js", import.meta.url),
        ),
      }),
      router(osmos.router),
    ],
    cacheDir: `${osmos.options.rootDir}/node_modules/.cache/osmos`, // TODO: Use specific cacheDir option
    server: {
      middlewareMode: true,
      fs: {
        allow: [osmos.options.workspaceDir],
      },
    },
  };
}

export async function createViteDevServer(osmos: OsmosApp) {
  osmos.logger.debug("Creating Vite development server");

  const config = createViteConfig(osmos);
  const server = await createServer(config);

  osmos.callHook("vite:dev:init", server);

  return server;
}

export async function buildVite(osmos: OsmosApp) {
  const config = createViteConfig(osmos);
  const builder = await createBuilder(config);

  // __vite_rsc_manager.buildStep = "scan";
  // await builder.build(builder.environments.rsc);
  // await builder.build(builder.environments.ssr);

  __vite_rsc_manager.buildStep = "scan";
  await builder.build(builder.environments.rsc);
  await builder.build(builder.environments.client);
  await builder.build(builder.environments.ssr);

  __vite_rsc_manager.buildStep = "build";
  await builder.build(builder.environments.rsc);

  return build(config);
}