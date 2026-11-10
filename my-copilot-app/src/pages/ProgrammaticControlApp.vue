<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import AgentTrigger from "../components/v1/AgentTrigger.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); V1 runtime on 8146 registers "sales" pointed at the
       quickstart backend, because the page's only backend code (_common.py) is helpers with no imports, no app and
       undefined MODEL / WORKSPACE / SLUG / get_forwarded_headers. -->
  <CopilotKitProvider runtime-url="http://localhost:8146/api/copilotkit">
    <AgentTrigger />
  </CopilotKitProvider>
</template>
