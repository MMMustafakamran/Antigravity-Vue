# CopilotKit Intelligence

> CopilotKit Intelligence adds AG-UI Streams, User Memories, Automatic Learning, Channels, and Product Analytics to the CopilotKit app you already run.


<IntelligenceOverview />

## What is CopilotKit Intelligence?

You want AG-UI Streams, User Memory, Automatic Learning, Channels, and Product Analytics without operating that storage yourself. CopilotKit Intelligence adds that layer to the CopilotKit app you already have. Your frontend, your agent, and your model stay where they are.

Keep your existing thread system. You do not need to replace your thread storage when you connect Intelligence. [Bring your own thread system](/vue/google-antigravity/intelligence/bring-your-own-thread-system) explains how Intelligence records its own copy while your framework keeps managing the original conversation and agent state.

Open the page for the one thing you want to add. Each page below owns that topic.

Connect an existing app in the [quickstart](/vue/google-antigravity/intelligence/quickstart), with setup tabs for TypeScript, Python, Go, Ruby, and C#/.NET. TypeScript also works without Intelligence; the other runtime implementations require it.

## What Intelligence gives you

- [AG-UI Streams](/vue/google-antigravity/AG-UI-Streams): Complement your existing threads with generative UI, multimodal inputs and file uploads, plus reconnection and catch-up across tabs and devices.
- [User Memories](/vue/google-antigravity/intelligence/memories): Keep facts about a person after the conversation ends.
- [Automatic Learning](/vue/google-antigravity/learning): Turn real usage into skills you can review and publish.
- [Trajectories](/vue/google-antigravity/intelligence/trajectories): Capture browser activity and connect it to agent conversations.
- [Product Analytics](/vue/google-antigravity/intelligence/analytics): See what people do with your agent.
- [Channels](/vue/google-antigravity/intelligence/channels): Run the same agent in Slack or Microsoft Teams.
- [Inspector](/vue/google-antigravity/inspector): Watch threads, learning, and tool calls from your app on localhost.

Managed Slack and Teams Channels can [post JSX snapshots as images](/channels/posting-jsx-as-images) or combine them with native actions using [Render and Carousel](/channels/render-and-carousel).

## Already have agent conversations?

Connect your existing app to Intelligence and add AG-UI streams around your current agent. If you need earlier history, import it once:

- [Import LangGraph threads](/langgraph-python/threads-import) from LangGraph Server / LangSmith deployments or Python FastAPI apps with durable persistence.
- [Import Google ADK sessions](/google-adk/threads-import) from supported ADK database session stores or Vertex/Agent Engine session history.
- Import AWS Strands conversations for [Python](/strands/threads-import) or [TypeScript](/strands-typescript/threads-import) from local session files or S3, plus native AgentCore Memory sessions for Python.

Import copies history; it does not establish ongoing database replication. Future CopilotKit-mediated runs persist to Intelligence and continue through native persistence when your agent remains connected to its durable framework storage. Keep that native persistence in place.

[Skill delivery](/vue/google-antigravity/intelligence/learned-skills) combines published Skills from several Learning containers in one agent, with one request for each refresh.

Trajectories record browser activity alongside agent conversations. The [Trajectories quickstart](/vue/google-antigravity/intelligence/trajectories-quickstart) connects your app to a local Intelligence project and saves your first Trajectory. These guides are in early access.

## Choose where Intelligence runs

Cloud-hosted and self-hosted use the same app APIs, so you can start on one and move later.

<div className="intelligence-accent-cards">
<CTACards
  columns={2}
  cards={[
    {
      iconKey: "cloud",
      title: "Cloud-hosted",
      description:
        "CopilotKit runs Intelligence for you. Create a project, get a key, and manage your plan in the web app.",
      href: "/intelligence/managed-intelligence-platform",
    },
    {
      iconKey: "server",
      title: "Self-hosted",
      description:
        "Run Intelligence in your own Kubernetes cluster or AWS account with the Helm chart or the ECS bundle.",
      href: "/intelligence/self-hosting",
    },
  ]}
/>
</div>

Want to try Intelligence before you choose? [Evaluate Intelligence locally](/vue/google-antigravity/intelligence/self-hosting-local) in Docker on your Mac with the CLI (preview).
