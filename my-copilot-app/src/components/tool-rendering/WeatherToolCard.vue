<script setup lang="ts">
defineProps<{
  parameters: { city?: string };
  status: "inProgress" | "executing" | "complete";
  result?: string;
}>();
</script>

<template>
  <p v-if="status !== 'complete'">Checking {{ parameters.city ?? "…" }}</p>
  <article v-else>
    <strong>{{ parameters.city }}</strong>
    <pre>{{ result }}</pre>
  </article>
</template>
