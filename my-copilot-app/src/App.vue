<script setup lang="ts">
// HARNESS: one Vite app, one root per doc page, chosen by path (the docs' main.ts mounts ./App.vue).
// "/" keeps the original Frontend Tools root (pages/FrontendToolsApp.vue). Add one import + one route per page.
import FrontendToolsApp from "./pages/FrontendToolsApp.vue";
import PrebuiltComponentsApp from "./pages/PrebuiltComponentsApp.vue"; // V1
import SlotsApp from "./pages/SlotsApp.vue"; // V1
import HeadlessUiApp from "./pages/HeadlessUiApp.vue"; // V1
import ProgrammaticControlApp from "./pages/ProgrammaticControlApp.vue"; // V1
import InspectorApp from "./pages/InspectorApp.vue"; // V1
import SharedStateApp from "./pages/SharedStateApp.vue"; // V3
import RenderingInAppApp from "./pages/RenderingInAppApp.vue"; // V3
import StreamingApp from "./pages/StreamingApp.vue"; // V3
import AgentReadonlyApp from "./pages/AgentReadonlyApp.vue"; // V3
// V4: async so a page whose doc import is missing (headless) only breaks its own route.
import { defineAsyncComponent } from "vue"; // V4
const v4 = (l: () => Promise<any>) => defineAsyncComponent(l); // V4
const routes: Record<string, unknown> = {
  "/": FrontendToolsApp,
  "/hitl": v4(() => import("./pages/HitlApp.vue")), // V4
  "/use-interrupt": v4(() => import("./pages/UseInterruptApp.vue")), // V4
  "/headless-interrupts": v4(() => import("./pages/HeadlessInterruptApp.vue")), // V4
  "/governed-actions": v4(() => import("./pages/GovernedActionsApp.vue")), // V4
  "/webmcp": v4(() => import("./pages/WebmcpApp.vue")), // V4
  "/subagents": v4(() => import("./pages/SubagentsApp.vue")), // V4
  "/threads-drawer": v4(() => import("./pages/ThreadsDrawerApp.vue")), // V2 (async: a broken page only breaks its own route)
  "/headless-threads": v4(() => import("./pages/HeadlessThreadsApp.vue")), // V2
  "/tool-based": v4(() => import("./pages/ToolBasedApp.vue")), // V2
  "/tool-rendering": v4(() => import("./pages/ToolRenderingApp.vue")), // V2
  "/state-rendering": v4(() => import("./pages/StateRenderingApp.vue")), // V2
  "/mcp-apps": v4(() => import("./pages/McpAppsApp.vue")), // V2

  "/prebuilt-components": PrebuiltComponentsApp, // V1
  "/slots": SlotsApp, // V1
  "/headless-ui": HeadlessUiApp, // V1
  "/programmatic-control": ProgrammaticControlApp, // V1
  "/inspector": InspectorApp, // V1
  "/shared-state": SharedStateApp, // V3
  "/shared-state-rendering": RenderingInAppApp, // V3
  "/shared-state-streaming": StreamingApp, // V3
  "/shared-state-readonly": AgentReadonlyApp, // V3
};
const Root = routes[location.pathname.replace(/\/$/, "") || "/"] ?? FrontendToolsApp;
</script>
<template><component :is="Root" /></template>
