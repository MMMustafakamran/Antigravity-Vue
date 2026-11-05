<script setup lang="ts">
import { CopilotKitProvider, CopilotChat } from "@copilotkit/vue/v2";
</script>

<template>
  <CopilotKitProvider
    runtime-url="http://localhost:8200/api/copilotkit"
  >
    <div style="height: 100vh">
      <CopilotChat />
    </div>
  </CopilotKitProvider>
</template>
