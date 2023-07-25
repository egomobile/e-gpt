# [e.GPT](../README.md) :: [Examples](./README.md) :: Show or edit environment settings

> Outputs or edits the tool's own application file, like `.env` or `.system`.

```bash
egpt environment -e
```

This will open the `.env` file in editor and ensures that `${HOME}/.egpt` folder exists.

You are also able to open `${HOME}/.egpt/.system`, which contains optional and custom system prompt for [ask command](./ask_command.md):

```bash
egpt environment -e --system
```
