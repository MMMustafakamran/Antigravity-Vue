<script setup lang="ts">
// HARNESS: the doc shows SupportChat.vue only, never the provider/app around it; quickstart-style root added.
// ?welcome selects the doc's welcome-screen SupportChat.vue, default is the doc's message-view SupportChat.vue.
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import "@copilotkit/vue/styles.css";
import SupportChat from "../components/v1/SupportChat.vue";
import SupportChatWelcome from "../components/v1/SupportChatWelcome.vue";
const welcome = new URLSearchParams(location.search).has("welcome");
</script>

<template>
  <!-- HARNESS: V1 runtime on 8146 ("default" agent -> quickstart backend) -->
  <CopilotKitProvider runtime-url="http://localhost:8146/api/copilotkit">
    <SupportChatWelcome v-if="welcome" />
    <SupportChat v-else />
  </CopilotKitProvider>
</template>
