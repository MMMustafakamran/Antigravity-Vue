<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

const props = defineProps<{
  args: {
    id?: string;
    summary?: string;
    reference?: string;
    verdict?: "allow" | "deny" | "require_approval";
  };
  respond?: (result: unknown) => Promise<void>;
}>();

const submitted = ref(false);
const ready = computed(() =>
  Boolean(props.respond && props.args.id && props.args.reference && props.args.verdict),
);

function submitDecision(approved: boolean) {
  if (!ready.value || submitted.value || !props.respond) return;
  if (approved && props.args.verdict === "deny") return;
  submitted.value = true;
  void props.respond({
    approved,
    actionId: props.args.id,
    reference: props.args.reference,
  });
}

watchEffect(() => {
  if (props.args.verdict === "allow") submitDecision(true);
  if (props.args.verdict === "deny") submitDecision(false);
});
</script>

<template>
  <section>
    <p v-if="props.args.verdict === 'allow'">Allowed by policy</p>
    <p v-else-if="props.args.verdict === 'deny'">Blocked by policy</p>
    <p>{{ props.args.summary ?? "Preparing approval…" }}</p>
    <div v-if="ready && !submitted && props.args.verdict === 'require_approval'">
      <button @click="submitDecision(true)">Approve and run</button>
      <button @click="submitDecision(false)">Reject</button>
    </div>
  </section>
</template>
