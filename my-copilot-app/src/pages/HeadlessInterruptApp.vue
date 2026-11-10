<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
// Doc imports this component but never shows it; HARNESS empty placeholder (see the file).
import HeadlessInterruptPanel from "../components/v4/headless/HeadlessInterruptPanel.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); V4 runtime on 8149 -->
  <CopilotKitProvider runtime-url="http://localhost:8149/interrupt/api/copilotkit">
    <HeadlessInterruptPanel />
  </CopilotKitProvider>
</template>
