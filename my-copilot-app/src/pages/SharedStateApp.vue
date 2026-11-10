<script setup lang="ts">
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import SharedWorkspace from "../components/v3/SharedWorkspace.vue"; // HARNESS: path (doc: ./components/SharedWorkspace.vue)
import SharedWorkspaceWrite from "../components/v3/SharedWorkspaceWrite.vue"; // HARNESS: doc's 2nd SharedWorkspace.vue block, mounted so its button shows
</script>

<template>
  <!-- HARNESS: runtime-url -> group V3 runtime on 8148 (doc: /api/copilotkit, no proxy shown) -->
  <CopilotKitProvider runtime-url="http://localhost:8148/api/copilotkit">
    <SharedWorkspace />
    <SharedWorkspaceWrite />
    <CopilotChat agent-id="workspace" />
  </CopilotKitProvider>
</template>
