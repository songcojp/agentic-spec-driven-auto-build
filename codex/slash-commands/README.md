# Codex Slash Commands

This directory stores command-style Codex skill packages that can be installed into Codex's user skill path.

Current Codex CLI versions expose built-in slash commands through `/`, and expose reusable custom workflows as skills through `$` or `/skills`. The installer in `scripts/install-codex-spec-command.sh` installs the `agentic-spec` package into `$HOME/.agents/skills/agentic-spec`.

After installing and restarting Codex, invoke it with:

```text
$agentic-spec <your request>
```

or open `/skills` and choose `Agentic Spec`.
