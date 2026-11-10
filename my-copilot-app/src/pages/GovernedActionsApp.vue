<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import GovernedActionApproval from "../components/v4/governed/GovernedActionApproval.vue";
import GovernedActionTool from "../components/v4/governed/GovernedActionTool.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); page shows no backend, so the shared quickstart runtime 8140 (agent default -> 8141) -->
  <CopilotKitProvider runtime-url="http://localhost:8140/api/copilotkit">
    <GovernedActionApproval />
    <GovernedActionTool />
    <CopilotChat />
  </CopilotKitProvider>
</template>
