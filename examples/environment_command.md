# [e.GPT](../README.md) :: [Examples](./README.md) :: Show or edit environment settings

> Outputs or modifies the application's own files, such as `.env` or `.system`.

```bash
egpt environment -e
```

This will open the `.env` file in the editor and ensure that the `${HOME}/.egpt` folder exists.

You can also open `${HOME}/.egpt/.system`, which contains optional and custom system prompts for the [ask command](./ask_command.md):

```bash
egpt environment -e --system
```
