<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import AgentExperience from "../components/tool-rendering/AgentExperience.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" 404s on Vite (FINDINGS.md); group V2 runtime on 8147, /tools path = the tool-rendering backend. -->
  <CopilotKitProvider runtime-url="http://localhost:8147/tools/api/copilotkit"><AgentExperience /></CopilotKitProvider>
</template>
