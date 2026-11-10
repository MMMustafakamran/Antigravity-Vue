<!-- HARNESS: the doc's second "src/components/SharedWorkspace.vue" block (setTone), verbatim and alone.
     The doc never shows how it merges with the first block (agent and WorkspaceState are undefined here). -->
<script setup lang="ts">
function setTone(tone: string) {
  const current = agent.value;
  if (!current) return;

  const previous = (current.state ?? {}) as WorkspaceState;
  current.setState({
    ...previous,
    preferences: { ...previous.preferences, tone },
  });
}
</script>

<template>
  <button @click="setTone('concise')">Prefer concise answers</button>
</template>
