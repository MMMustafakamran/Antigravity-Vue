<script setup lang="ts">
import { ref } from "vue";
import { useAgentContext } from "@copilotkit/vue/v2";

const workspaceId = ref("northstar");

useAgentContext({
  description: "Active workspace",
  value: workspaceId,
});
</script>

<template>
  <p>Workspace: {{ workspaceId }}</p>
</template>
