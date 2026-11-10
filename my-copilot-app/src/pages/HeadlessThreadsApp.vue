<script setup lang="ts">
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
} from "@copilotkit/vue/v2";
import ThreadSidebar from "../components/headless-threads/ThreadSidebar.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" 404s on Vite (FINDINGS.md); the Threads runtime with CopilotKitIntelligence on 8154 (server.threads.ts). -->
  <CopilotKitProvider runtime-url="http://localhost:8154/api/copilotkit">
    <CopilotChatConfigurationProvider agent-id="my-agent">
      <div class="flex" style="height: 100dvh">
        <ThreadSidebar />
        <CopilotChat />
      </div>
    </CopilotChatConfigurationProvider>
  </CopilotKitProvider>
</template>
