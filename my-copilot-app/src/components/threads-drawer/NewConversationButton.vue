<script setup lang="ts">
import { useCopilotChatConfiguration } from "@copilotkit/vue/v2";

const configuration = useCopilotChatConfiguration();

function startNewConversation() {
  configuration.value?.startNewThread();
}
</script>

<template>
  <button type="button" @click="startNewConversation">New conversation</button>
</template>
