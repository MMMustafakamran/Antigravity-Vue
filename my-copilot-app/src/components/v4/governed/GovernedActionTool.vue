<script setup lang="ts">
import { z } from "zod";
import { useHumanInTheLoop } from "@copilotkit/vue/v2";
import GovernedActionCard from "./GovernedActionCard.vue";

const governedActionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tool: z.string(),
  reference: z.string(),
  verdict: z.enum(["allow", "deny", "require_approval"]),
  arguments: z.record(z.unknown()),
});

useHumanInTheLoop({
  name: "approve_governed_action",
  description:
    "Ask the user to approve a governed side-effect action before it runs.",
  parameters: governedActionSchema,
  render: GovernedActionCard,
});
</script>

<template><p>Governed action tool registered.</p></template>
