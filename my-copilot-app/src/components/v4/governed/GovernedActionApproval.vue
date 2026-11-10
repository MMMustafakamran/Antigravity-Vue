<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useInterrupt } from "@copilotkit/vue/v2";

type GovernedAction = {
  id: string;
  summary: string;
  tool: string;
  reference: string;
  verdict: "allow" | "deny" | "require_approval";
  arguments: Record<string, unknown>;
};

const { slotProps } = useInterrupt({ renderInChat: false });
const action = computed(
  () => slotProps.value?.interrupt?.metadata?.action as
    | GovernedAction
    | undefined,
);

async function approve(approved: boolean) {
  const current = action.value;
  if (!current || !slotProps.value) return;

  await slotProps.value.resolve({
    approved,
    actionId: current.id,
    reference: current.reference,
  });
}

watchEffect(() => {
  if (action.value?.verdict === "allow") void approve(true);
  if (action.value?.verdict === "deny") void slotProps.value?.cancel();
});
</script>

<template>
  <section v-if="action" class="rounded-lg border p-4 shadow-sm">
    <p>
      {{
        action.verdict === "allow"
          ? "Allowed by policy"
          : action.verdict === "deny"
            ? "Blocked by policy"
            : "User approval required"
      }}
    </p>
    <h3>{{ action.summary }}</h3>
    <p>Tool: {{ action.tool }}</p>
    <p>Reference: {{ action.reference }}</p>
    <pre>{{ JSON.stringify(action.arguments, null, 2) }}</pre>
    <div v-if="action.verdict === 'require_approval'">
      <button @click="approve(true)">Approve and run</button>
      <button @click="approve(false)">Reject</button>
    </div>
  </section>
</template>
