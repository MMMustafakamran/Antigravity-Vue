<!-- HARNESS: the useInterrupt page's App.vue imports ./components/MeetingChat.vue but never shows it.
     Guess: the page's ApprovalPanel.vue plus a CopilotChat. -->
<script setup lang="ts">
import { CopilotChat } from "@copilotkit/vue/v2";
import ApprovalPanel from "./ApprovalPanel.vue";
</script>
<template>
  <ApprovalPanel />
  <CopilotChat />
</template>
