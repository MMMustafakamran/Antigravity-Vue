<script setup lang="ts">
// HARNESS: the WebMCP page shows OrderSearch.vue only ("must run inside your existing CopilotKitProvider"); provider + chat from the quickstart.
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import OrderSearch from "../components/v4/webmcp/OrderSearch.vue";
</script>
<template>
  <!-- HARNESS: shared quickstart runtime 8140 -->
  <CopilotKitProvider runtime-url="http://localhost:8140/api/copilotkit">
    <OrderSearch />
    <CopilotChat />
  </CopilotKitProvider>
</template>
