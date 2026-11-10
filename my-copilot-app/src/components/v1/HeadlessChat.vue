<script setup lang="ts">
import { computed, ref } from "vue";
import { useAgent, useCopilotKit } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "my-agent" });
const { copilotkit } = useCopilotKit();
const input = ref("");
const messages = computed(() => agent.value?.messages ?? []);
const isRunning = computed(() => agent.value?.isRunning ?? false);

async function submit() {
  const current = agent.value;
  const content = input.value.trim();
  if (!current || !content || isRunning.value) return;

  current.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content,
  });
  input.value = "";
  await copilotkit.value.runAgent({ agent: current });
}
</script>

<template>
  <section aria-live="polite">
    <article v-for="message in messages" :key="message.id" :data-role="message.role">
      {{ message.content }}
    </article>
    <p v-if="isRunning">Thinking…</p>
    <form @submit.prevent="submit">
      <input v-model="input" aria-label="Message" />
      <button type="submit" :disabled="isRunning">Send</button>
    </form>
  </section>
</template>
