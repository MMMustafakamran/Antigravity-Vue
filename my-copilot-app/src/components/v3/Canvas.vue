<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type CanvasState = {
  title: string;
  items: { id: string; label: string; done: boolean }[];
};

const initialState: CanvasState = {
  title: "Project launch",
  items: [
    { id: "research", label: "Research user needs", done: true },
    { id: "prototype", label: "Build a prototype", done: false },
  ],
};

const { agent } = useAgent({
  updates: [UseAgentUpdate.OnStateChanged],
});
const state = computed(
  () => (agent.value?.state ?? {}) as Partial<CanvasState>,
);

watchEffect(() => {
  const currentAgent = agent.value;
  if (!currentAgent) return;

  const current = (currentAgent.state ?? {}) as Partial<CanvasState>;
  const updates: Partial<CanvasState> = {};
  if (current.title === undefined) updates.title = initialState.title;
  if (current.items === undefined) updates.items = initialState.items;

  if (Object.keys(updates).length > 0) {
    currentAgent.setState({ ...current, ...updates });
  }
});
</script>

<template>
  <main class="canvas">
    <h1>{{ state.title ?? "Untitled" }}</h1>
    <ul>
      <li
        v-for="item in state.items ?? []"
        :key="item.id"
        :data-done="item.done"
      >
        {{ item.label }}
      </li>
    </ul>
  </main>
</template>
