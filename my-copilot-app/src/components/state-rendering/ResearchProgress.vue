<script setup lang="ts">
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type ResearchState = { status?: string; draft?: string; completed?: number; total?: number };

const { agent } = useAgent({
  agentId: "researcher",
  updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
});

const state = computed(() => (agent.value?.state ?? {}) as ResearchState);
</script>

<template>
  <section aria-live="polite">
    <p>{{ state.status ?? "Idle" }}</p>
    <progress :value="state.completed ?? 0" :max="state.total ?? 1" />
    <article v-if="state.draft">{{ state.draft }}</article>
  </section>
</template>
