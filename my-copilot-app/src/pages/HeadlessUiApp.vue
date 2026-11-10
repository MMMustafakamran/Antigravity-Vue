<script setup lang="ts">
// HARNESS: the doc's provider snippet is template-only; imports added so it compiles.
import { CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import HeadlessChat from "../components/v1/HeadlessChat.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); V1 runtime on 8146 registers "my-agent" -->
  <CopilotKitProvider runtime-url="http://localhost:8146/api/copilotkit">
    <CopilotChatConfigurationProvider agent-id="my-agent">
      <HeadlessChat />
    </CopilotChatConfigurationProvider>
  </CopilotKitProvider>
</template>
