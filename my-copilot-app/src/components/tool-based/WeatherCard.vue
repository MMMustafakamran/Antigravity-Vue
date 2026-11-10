<script setup lang="ts">
defineProps<{ city: string; temperature: number; condition: string }>();
</script>

<template>
  <article>
    <strong>{{ city }}</strong>
    <p>{{ temperature }}° · {{ condition }}</p>
  </article>
</template>
