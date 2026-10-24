# Published command fixture

`cli.mdx` is the complete, unmodified Marketing guide at the immutable source in
`provenance.json`. The test extracts its email/song examples and chat-link flag,
then runs the built CLI with synthetic credentials and intercepted native fetch.
No endpoint is contacted. Request records omit headers.

Run `pnpm build` then `pnpm exec vitest run __tests__/publishedCommands.test.ts`.
Documentation owners can set `RECOUP_CLI_REFERENCE_PATH` to an absolute candidate
Markdown path to run the same parser/request assertions before publishing.

When these examples intentionally change, copy the complete guide from its owning
commit, update provenance and SHA256, and review the expected requests together.
The default check protects this pinned guide; it does not monitor future live docs
or establish installed npm package behavior. Coverage is limited to email/song
examples and the retired email flag, not every CLI command or authorization rule.
