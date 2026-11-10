<script setup lang="ts">
import { z } from "zod";
import { CopilotChat, useComponent } from "@copilotkit/vue/v2";
import WeatherCard from "./WeatherCard.vue";

useComponent({
  name: "show_weather",
  description: "Display the weather for one city.",
  parameters: z.object({
    city: z.string(),
    temperature: z.number(),
    condition: z.string(),
  }),
  render: WeatherCard,
});
</script>

<template><CopilotChat /></template>
