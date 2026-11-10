<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import "@copilotkit/vue/styles.css";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); V1 runtime on 8146 registers "my-agent" -->
  <CopilotKitProvider runtime-url="http://localhost:8146/api/copilotkit">
    <CopilotChat agent-id="my-agent" />
  </CopilotKitProvider>
</template>
