<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import Canvas from "../components/v3/Canvas.vue"; // HARNESS: path (doc: ./components/Canvas.vue)
</script>

<template>
  <!-- HARNESS: runtime-url -> group V3 runtime on 8148 -->
  <CopilotKitProvider runtime-url="http://localhost:8148/api/copilotkit">
    <div class="app-shell">
      <Canvas />
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
