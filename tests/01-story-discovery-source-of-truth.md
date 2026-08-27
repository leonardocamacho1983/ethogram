# Test 01: Story Discovery & Source of Truth

## Objective

Validate the first core architectural promise of Agentbook:

> A Story declared in code is automatically discovered by Agentbook and becomes the source of truth for what the interface renders.

This test must prove that a developer can create or modify a Story without editing UI components, sidebar configuration, mock-data registries, or other presentation code.

---

## Product hypothesis

Agentbook is code-first.

A developer should be able to create a Story in their project using a file such as:

```text
*.agent.stories.ts
