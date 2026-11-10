<!-- HARNESS: the HITL overview imports ./TimePickerCard.vue but never shows it. Minimal picker
     (props shape copied from the governed-actions page's GovernedActionCard: args + respond). -->
<script setup lang="ts">
import { ref } from "vue";
const props = defineProps<{ args: { topic?: string; attendee?: string }; respond?: (r: unknown) => Promise<void> }>();
const done = ref("");
const slots = ["Tomorrow 10:00 AM", "Tomorrow 2:00 PM"];
function pick(label: string) {
  done.value = label;
  void props.respond?.({ chosen_label: label });
}
</script>
<template>
  <section>
    <p>Pick a time for {{ props.args.topic }} with {{ props.args.attendee }}</p>
    <p v-if="done">Chosen: {{ done }}</p>
    <template v-else-if="props.respond">
      <button v-for="s in slots" :key="s" @click="pick(s)">{{ s }}</button>
    </template>
  </section>
</template>
