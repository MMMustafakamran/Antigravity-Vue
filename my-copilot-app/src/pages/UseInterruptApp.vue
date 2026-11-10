<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import MeetingChat from "../components/v4/interrupt/MeetingChat.vue";
</script>

<template>
  <!-- HARNESS: doc runtime-url="/api/copilotkit" (404 on Vite); V4 runtime on 8149, agent = schedule_meeting experimental_interrupt tool from the HITL overview -->
  <CopilotKitProvider runtime-url="http://localhost:8149/interrupt/api/copilotkit">
    <MeetingChat />
  </CopilotKitProvider>
</template>
