<script setup lang="ts">
import {
  useCopilotChatConfiguration,
  useThreads,
} from "@copilotkit/vue/v2";

const config = useCopilotChatConfiguration();
const {
  threads,
  isLoading,
  renameThread,
  archiveThread,
  deleteThread,
} = useThreads({ agentId: "my-agent" });
</script>

<template>
  <p v-if="isLoading">Loading…</p>
  <ul v-else>
    <li v-for="thread in threads" :key="thread.id">
      <button
        @click="config?.setActiveThreadId(thread.id, { explicit: true })"
      >
        {{ thread.name ?? "New conversation" }}
      </button>
      <button @click="renameThread(thread.id, 'Renamed')">Rename</button>
      <button @click="archiveThread(thread.id)">Archive</button>
      <button @click="deleteThread(thread.id)">Delete</button>
    </li>
  </ul>
</template>
