<!-- HARNESS: the Headless Interrupts page imports ./components/HeadlessInterruptPanel.vue but never shows it
     (the "primitives" section is prose only). Verbatim, Vite fails: "Failed to resolve import ... Does the file exist?",
     and that overlay blocks every route of the shared dev server. Empty placeholder so the rest of the app loads;
     the page itself has nothing to run. -->
<template><div></div></template>
