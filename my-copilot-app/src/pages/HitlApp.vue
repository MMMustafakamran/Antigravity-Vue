<script setup lang="ts">
// HARNESS: the HITL overview shows MeetingApproval.vue only ("mount beneath CopilotKitProvider"); provider + chat added.
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import MeetingApproval from "../components/v4/hitl/MeetingApproval.vue";
</script>
<template>
  <!-- HARNESS: runtime on 8149 (V4 runtime, hitl.py agent from the page) -->
  <CopilotKitProvider runtime-url="http://localhost:8149/hitl/api/copilotkit">
    <MeetingApproval />
    <CopilotChat />
  </CopilotKitProvider>
</template>
