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
  <!-- HARNESS: doc runtime-url="/api/copilotkit" 404s on Vite (FINDINGS.md); group V2 runtime on 8147 instead. -->
  <!-- Everything else as published (placeholder license key, no Intelligence): what a reader without an Intelligence account gets. -->
  <CopilotKitProvider
    runtime-url="http://localhost:8147/api/copilotkit"
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
