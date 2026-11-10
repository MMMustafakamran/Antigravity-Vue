<script setup lang="ts">
import { z } from "zod";
import { useFrontendTool } from "@copilotkit/vue/v2";

useFrontendTool({
  name: "searchOrders",
  description: "Search the signed-in user's orders by status",
  parameters: z.object({
    status: z.enum(["open", "shipped", "delivered"]),
  }),
  handler: async ({ status }) => {
    const orders = await searchOrders(status);
    return JSON.stringify(orders);
  },
  webmcp: {
    annotations: {
      readOnlyHint: true,
    },
  },
});
</script>
