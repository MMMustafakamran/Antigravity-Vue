<script setup lang="ts">
import { ref } from "vue";
import { z } from "zod";
import { CopilotChat, useFrontendTool } from "@copilotkit/vue/v2";

const severity = ref("all");

useFrontendTool(
  {
    name: "filter_incidents",
    description: "Filter the visible incident list by severity.",
    parameters: z.object({
      severity: z.enum(["all", "sev1", "sev2", "sev3"]),
    }),
    handler: async ({ severity: nextSeverity }) => {
      severity.value = nextSeverity;
      return { applied: true, severity: nextSeverity };
    },
  },
  [severity],
);
</script>

<template>
  <p>Current filter: {{ severity }}</p>
  <CopilotChat />
</template>
