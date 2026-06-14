# Development Workflow

## Rule 0
Always read:
- skills.md
- ai_context/architecture.md
- ai_context/TASK_QUEUE.md

---

## Step 1: Planning

Agent: Planner

- pick one task from TASK_QUEUE
- break into small steps if needed
- mark task as active

---

## Step 2: Architecture Check

Agent: Architect (optional for small tasks)

- verify design fits architecture.md
- no breaking change without explicit note

---

## Step 3: Implementation

Agent: Builder

- implement only the current task
- do not modify unrelated files
- follow coding rules in skills.md

---

## Step 4: Testing

Agent: Tester

- add tests for new logic
- run all tests
- fix failures

---

## Step 5: Security Review

Agent: Security Reviewer

Check:
- no PHI in logs
- no secrets in code
- auth + permission correct
- input validation exists

---

## Step 6: Final Review

- confirm tests pass
- confirm CI would pass
- update TASK_QUEUE status

---

## Step 7: Merge / Deploy

- push code
- CI runs
- deploy staging
- manual approve production
