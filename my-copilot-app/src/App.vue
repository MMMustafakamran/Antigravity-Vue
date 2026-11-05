<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DashboardAgent from "./components/DashboardAgent.vue";
</script>

<template>
  <!-- HARNESS: the doc has runtime-url="/api/copilotkit" (404 on Vite, FINDINGS.md). The quickstart absolute URL is used instead, on harness port 8140 (doc: 8200). -->
  <CopilotKitProvider runtime-url="http://localhost:8140/api/copilotkit">
    <DashboardAgent />
  </CopilotKitProvider>
</template>
