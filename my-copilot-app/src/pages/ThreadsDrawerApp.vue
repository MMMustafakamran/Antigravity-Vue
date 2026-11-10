<script setup lang="ts">
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
  CopilotThreadsDrawer,
} from "@copilotkit/vue/v2";
import NewConversationButton from "../components/threads-drawer/NewConversationButton.vue";
import "@copilotkit/vue/styles.css";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" 404s on Vite (FINDINGS.md); the Threads runtime with CopilotKitIntelligence on 8154 (server.threads.ts). -->
  <CopilotKitProvider
    runtime-url="http://localhost:8154/api/copilotkit"
    public-license-key="ck_pub_..."
  >
    <CopilotChatConfigurationProvider agent-id="support">
      <div style="display: flex; height: 100dvh">
        <CopilotThreadsDrawer />
        <main style="flex: 1; display: flex; flex-direction: column">
          <header><NewConversationButton /></header>
          <CopilotChat />
        </main>
      </div>
    </CopilotChatConfigurationProvider>
  </CopilotKitProvider>
</template>
