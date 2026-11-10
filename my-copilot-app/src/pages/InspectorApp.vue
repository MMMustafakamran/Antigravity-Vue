<script setup lang="ts">
// HARNESS: the Inspector page has no Vue snippet (only React <CopilotKit enableInspector>); it says Inspector
// shows by default in Vue dev builds. Minimal quickstart-style app to check that.
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import "@copilotkit/vue/styles.css";
</script>

<template>
  <CopilotKitProvider runtime-url="http://localhost:8146/api/copilotkit">
    <CopilotChat />
  </CopilotKitProvider>
</template>
