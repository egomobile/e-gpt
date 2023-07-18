# e.GPT

> e.GPT is a command line tool that interacts with [ChatGPT API](https://platform.openai.com/docs/guides/gpt) directly or indirectly, without the need of having an environment like [Node.js](https://nodejs.org/) or [Python](https://www.python.org/) installed.

## Installation

e.GPT is a binary that can be downloaded from [here](https://github.com/egomobile/e-gpt/releases).

After download, you should extract and move it to a location, that can be accessed from anywhere and is part of your `PATH` environment variable.

Create an `.env` file inside the subfolder `.egpt`, which itself is inside the `$HOME` directory of the current user.

There are 3 ways to setup this file:

1. The most common way is to setup the `OPENAI_API_KEY` environment variable, which should hold the [API key from OpenAI](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key). This will let the CLI connect to the [official API](https://platform.openai.com/docs/guides/gpt).
2. Another way is to setup `CHAT_API_KEY`, which will connect to a simplified and more generic version of a chat REST API. This also requires `CHAT_API_CLIENT_ID` and `CHAT_API_URL` to be defined.
3. Similar to way 2, you can setup `CHAT_API_CLIENT_ID`, `CHAT_API_CLIENT_SECRET`, `CHAT_API_URL` and `OAUTH2_GET_TOKEN_URL`, if you wish to use [OAuth 2](https://oauth.net/2/) instead.

## Execute

```bash
egpt chat "How much is a PS5?" --system="You are an Xbox customer support agent whose primary goal is to help users with issues they are experiencing with their Xbox devices. You are friendly and concise. You only provide factual answers to queries, and do not provide answers that are not related to Xbox."
```

Run `egpt help` to see all available commands and options.

If you run locally from this code, keep sure that [bash script egpt](./egpt) is executable, so that you are able to run it the same way.

## Commands

### Chat (`ask`, `a`)

> Sends a single conversation to a chat API, like ChatGPT, based on your environment variables.

```bash
egpt ask "Who is Bill Gates?"
```

Possible response:

> Bill Gates is an American entrepreneur, software developer, investor, and philanthropist. He co-founded Microsoft Corporation in 1975 with Paul Allen and helped to revolutionize the personal computer industry with the development of the Windows operating system. As of 2021, he is considered one of the wealthiest people in the world, with a net worth of over $100 billion. In recent years, he has devoted much of his time and resources to philanthropic endeavors, primarily through the Bill and Melinda Gates Foundation, which works to improve global healthcare and reduce poverty.

You can use `--system` to setup a custom system prompt.

### Generate code (`code`, `c`)

> Generates code from human language.

```bash
egpt code "i need a Fibonacci function" --language="typescript"
```

Possible response:

```typescript
function fibonacci(n: number): number {
  if (n <= 1) {
    return n;
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}
```

### Describe shell command (`describe`, `d`)

> Handles a user input as shell command and tries to describe it.

```bash
egpt describe "i need a Fibonacci function"
```

Possible response:

```
List all files in the current directory with the .jpg extension.
```

### Execute shell command (`shell`, `s`)

> Converts human language into a shell command.

```bash
egpt shell "list all kinf of jpeg files"
```

Possible response:

```
ls *.jpg *.jpeg
[E]xecute, [a]bort >
```

Keep in mind: `E` is the default selection and will execute the given command.

## Inputs

You have the following sources for input data:

1. One or more non-flag command line arguments. All will be concatenate and seperated by space to one string.
   - Example: `egpt ask who is bill gates`
2. The [STDIN](https://en.wikipedia.org/wiki/Standard_streams):
   - Example #1: `egpt ask "please summarize" < ./long-text.txt`
   - Example #2: `curl -sSL "https://raw.githubusercontent.com/egomobile/e-gpt/main/LICENSE" | ./egpt ask summerize the following text`
3. The standard editor:
   - Example: `egpt ask summerize the following text --editor`

You can combine all kind of inputs. All texts will be concatenated in the given order and seperated by space to one string.

Keep in mind: The final prompt will be trimmed (start + end).

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [Chroma](https://github.com/alecthomas/chroma) 
- [Cobra](https://github.com/spf13/cobra)
- [GoDotEnv](https://github.com/joho/godotenv)

## License

[LGPL 3.0](./LICENSE)
