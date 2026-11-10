<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type DocumentState = { document?: string };

const { agent } = useAgent({
  agentId: "writer",
  updates: [
    UseAgentUpdate.OnStateChanged,
    UseAgentUpdate.OnRunStatusChanged,
  ],
});
const state = computed(
  () => (agent.value?.state ?? {}) as DocumentState,
);
</script>

<template>
  <article aria-live="polite">
    <span v-if="agent?.isRunning">LIVE</span>
    <p>{{ state.document ?? "Waiting for a draft…" }}</p>
  </article>
</template>
