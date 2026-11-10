<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import StreamingDocument from "../components/v3/StreamingDocument.vue"; // HARNESS: path
</script>

<template>
  <!-- HARNESS: runtime-url -> group V3 runtime on 8148 -->
  <CopilotKitProvider runtime-url="http://localhost:8148/api/copilotkit">
    <StreamingDocument />
    <CopilotChat agent-id="writer" />
  </CopilotKitProvider>
</template>
