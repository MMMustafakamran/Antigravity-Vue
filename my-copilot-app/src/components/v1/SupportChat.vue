<script setup lang="ts">
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatMessageView,
} from "@copilotkit/vue/v2";
</script>

<template>
  <CopilotChat>
    <template #message-view="{ messages, isRunning }">
      <CopilotChatMessageView :messages="messages" :is-running="isRunning">
        <template #assistant-message="{ message, messages: allMessages, isRunning: running }">
          <CopilotChatAssistantMessage
            :message="message"
            :messages="allMessages"
            :is-running="running"
          >
            <template #toolbar-items>
              <span class="reviewed-badge">Reviewed</span>
            </template>
          </CopilotChatAssistantMessage>
        </template>
      </CopilotChatMessageView>
    </template>
  </CopilotChat>
</template>
