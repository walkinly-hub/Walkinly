# Walkinly – Codex Working Rules

## 1. Always establish the current project state

At the beginning of every new Codex chat and before starting every new task:

- Inspect the current state of the repository.
- Check the active Git branch and `git status`.
- Check recent commits when relevant.
- Read this `AGENTS.md` and relevant project documentation.
- Inspect the latest versions of all files relevant to the task.
- Account for changes made by the user or other Codex threads.
- Never rely on remembered file contents or an earlier chat state when the repository can be checked directly.
- The current repository and its files are the source of truth.

## 2. General working approach

- Understand the existing implementation before changing code.
- Keep changes focused on the requested task.
- Do not refactor unrelated code.
- Do not remove or change existing functionality unless required by the task.
- Follow the existing architecture, patterns and folder structure.
- Reuse existing components, utilities and services where possible.
- Prefer the simplest maintainable solution.
- Do not add dependencies unless they provide a clear and necessary benefit.

## 3. Multiple Codex chats and conflict protection

- Assume that other Codex chats or the user may be working on the project simultaneously.
- Before modifying a file, inspect its latest contents and Git state.
- If a file has changed since the task started, re-read the current version before modifying it.
- Apply the intended change on top of the newest version.
- Never overwrite a newer version with an older version.
- Never discard changes made by the user or another Codex thread.
- Changes to the same file must effectively happen sequentially, based on the latest available version.
- If changes cannot be safely combined automatically, stop and explain the conflict instead of overwriting work.

## 4. Web and browser access

- Web access is allowed for research, documentation, debugging and verification.
- Websites may be opened and inspected in read-only mode when useful.
- Do not perform actions on websites or external services unless the user explicitly requests that specific action.
- Do not change settings, submit forms, publish content, create or delete resources, trigger deployments or modify external data without explicit instruction.
- Access to a website or service does not imply permission to modify it.

## 5. Supabase

- Never make changes directly in Supabase.
- Never modify the remote Supabase database, schema, data, RLS policies, authentication, storage, Edge Functions or project configuration.
- Do not execute remote Supabase changes on behalf of the user.
- When a Supabase change is required, prepare the exact SQL, migration, configuration or step-by-step instructions.
- Clearly tell the user what must be executed and where.
- The user performs all Supabase changes manually.
- Reading Supabase documentation is allowed.
- Never delete tables, columns or production data unless the user explicitly requests instructions for doing so.
- Never expose Supabase secret/service-role keys.

## 6. Git and GitHub

- Git and GitHub access is allowed for normal repository synchronization.
- Check the current Git state before making changes.
- Fetch/pull when necessary to establish the latest remote state.
- Preserve unrelated user changes.
- Create a new commit for every completed logical task.
- Use clear commit messages.
- Push completed commits automatically without asking for confirmation each time.
- Before pushing, verify that the remote state has not changed in a way that would overwrite or conflict with other work.
- Never amend existing commits.
- Never rewrite existing commits or Git history.
- Never force push.
- Never use destructive Git operations to remove conflicts or unrelated changes.
- If a push or merge conflict occurs, preserve both sides and resolve it safely. If that cannot be done confidently, stop and tell the user.

## 7. Project boundaries

- By default, only modify files belonging to the current Walkinly repository.
- Do not modify files belonging to other projects unless the user explicitly requests it.
- Other websites and projects may be inspected when relevant, but inspection does not grant modification permission.
- Never perform actions outside the Walkinly repository merely because access is technically available.

## 8. Secrets and security

- Never commit passwords, tokens, API keys or other secrets.
- Never expose values from `.env.local` or similar secret files.
- Never move server-side secrets into client-side code.
- Avoid destructive or irreversible actions.
- Ask before an action when it could cause data loss, security issues or irreversible external changes.

## 9. Quality and verification

After making relevant changes:

- Review the resulting diff.
- Run relevant existing tests.
- Run TypeScript/type checking when configured.
- Run linting when configured.
- Run the production build when appropriate.
- Fix errors caused by the changes before considering the task complete.
- Do not hide or silently ignore failed checks.
- Do not modify unrelated code merely to make a check pass.

## 10. Completion

At the end of each completed task:

- Briefly summarize what was changed.
- State what was tested or verified.
- State the new Git commit.
- Confirm whether the commit was pushed successfully.
- Clearly identify anything the user still needs to do manually.
- In particular, clearly identify any required manual Supabase steps.
