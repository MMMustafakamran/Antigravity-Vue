<script setup lang="ts">
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
} from "@copilotkit/vue/v2";
import ThreadSidebar from "../components/headless-threads/ThreadSidebar.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" 404s on Vite (FINDINGS.md); group V2 runtime on 8147 instead. -->
  <!-- The runtime has no CopilotKitIntelligence (doc's server.ts needs CPK_INTELLIGENCE_API_KEY and an undefined verifyAppSession). -->
  <CopilotKitProvider runtime-url="http://localhost:8147/api/copilotkit">
    <CopilotChatConfigurationProvider agent-id="my-agent">
      <div class="flex" style="height: 100dvh">
        <ThreadSidebar />
        <CopilotChat />
      </div>
    </CopilotChatConfigurationProvider>
  </CopilotKitProvider>
</template>
