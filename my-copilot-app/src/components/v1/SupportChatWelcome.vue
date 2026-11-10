<script setup lang="ts">
import { CopilotChat } from "@copilotkit/vue/v2";
</script>

<template>
  <CopilotChat>
    <template #welcome-screen="{ onSubmitMessage }">
      <section class="welcome-card">
        <h2>How can we help?</h2>
        <button type="button" @click="onSubmitMessage('Show my open tickets')">
          Show my open tickets
        </button>
      </section>
    </template>
  </CopilotChat>
</template>
