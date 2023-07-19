[![Current version](https://img.shields.io/github/v/release/egomobile/e-gpt)](https://github.com/egomobile/e-gpt/releases)
[![Latest build](https://img.shields.io/github/actions/workflow/status/egomobile/e-gpt/release.yaml)](https://github.com/egomobile/e-gpt/actions/workflows/release.yaml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/egomobile/e-gpt/pulls)
[![Issues](https://img.shields.io/github/issues/egomobile/e-gpt)](https://github.com/egomobile/e-gpt/issues)
[![License](https://img.shields.io/github/license/egomobile/e-gpt)](./LICENSE)

# e.GPT

> e.GPT is a command line tool that interacts with [ChatGPT API](https://platform.openai.com/docs/guides/gpt) directly or indirectly, without the need of having an environment like [Node.js](https://nodejs.org/) or [Python](https://www.python.org/) installed.

<a name="toc"></a>

## Table of contents

- [Install](#install-)
- [Execute](#execute-)
- [Commands](#commands-)
  - [ask - Chat with Bot](#ask-)
  - [code - Convert human language to source code](#code-)
  - [describe - Describe a shell command](#describe-)
  - [explain - Explain source code](#explain-)
  - [optimize - Optimizes source code](#optimize-)
  - [shell - Create shell command from human language](#shell-)
  - [summarize - Creates a short version of a long text](#summarize-)
  - [translate - Translates a text](#translate-)
- [Inputs](#inputs-)
- [Examples](#examples-)
- [Credits](#credits-)

## Install [<a href="#toc">↑</a>]

e.GPT is a binary that can be downloaded from [here](https://github.com/egomobile/e-gpt/releases).

After download, you should extract and move it to a location, that can be accessed from anywhere and is part of your `PATH` environment variable.

Create an `.env` file inside the subfolder `.egpt`, which itself is inside the `$HOME` directory of the current user.

There are 3 ways to setup this file:

1. The most common way is to setup the `OPENAI_API_KEY` environment variable, which should hold the [API key from OpenAI](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key). This will let the CLI connect to the [official API](https://platform.openai.com/docs/guides/gpt).
2. Another way is to setup `CHAT_API_KEY`, which will connect to a simplified and more generic version of a chat REST API. This also requires `CHAT_API_CLIENT_ID` and `CHAT_API_URL` to be defined.
3. Similar to way 2, you can setup `CHAT_API_CLIENT_ID`, `CHAT_API_CLIENT_SECRET`, `CHAT_API_URL` and `OAUTH2_GET_TOKEN_URL`, if you wish to use [OAuth 2](https://oauth.net/2/) instead.

## Execute [<a href="#toc">↑</a>]

```bash
egpt ask "How much is a PS5?" --system="You are an Xbox customer support agent whose primary goal is to help users with issues they are experiencing with their Xbox devices. You are friendly and concise. You only provide factual answers to queries, and do not provide answers that are not related to Xbox."
```

Run `egpt help` to see all available commands and options.

If you run locally from this code, keep sure that [bash script egpt](./egpt) is executable, so that you are able to run it the same way.

## Commands [<a href="#toc">↑</a>]

### ask [<a href="#commands-">↑</a>]

> Sends a single conversation to a chat API, like ChatGPT, based on your environment variables.

```bash
egpt ask "Who is Bill Gates?"
```

Possible response:

> Bill Gates is an American entrepreneur, software developer, investor, and philanthropist. He co-founded Microsoft Corporation in 1975 with Paul Allen and helped to revolutionize the personal computer industry with the development of the Windows operating system. As of 2021, he is considered one of the wealthiest people in the world, with a net worth of over $100 billion. In recent years, he has devoted much of his time and resources to philanthropic endeavors, primarily through the Bill and Melinda Gates Foundation, which works to improve global healthcare and reduce poverty.

You can use `--system` to setup a custom system prompt.

### code [<a href="#commands-">↑</a>]

> Generates code from human language.

```bash
egpt code "i need a Fibonacci function in go"
```

Possible response:

```go
// Define the Fibonacci function
func fibonacci(n int) int {
    if n == 0 {
        return 0
    } else if n == 1 {
        return 1
    } else {
        return fibonacci(n-1) + fibonacci(n-2)
    }
}

// Call the Fibonacci function with an input of 10
fmt.Println(fibonacci(10)) // Output: 55
```

### describe [<a href="#commands-">↑</a>]

> Handles a user input as shell command and tries to describe it.

```bash
egpt describe "curl -s https://api.github.com/repos/egomobile/e-gpt/releases/latest | jq -r '.assets[].browser_download_url | select(contains("darwin") and contains("arm64"))' | xargs curl -sL | tar xzOf - egpt | sudo tee /usr/local/bin/egpt > /dev/null && sudo chmod +x /usr/local/bin/egpt"
```

Possible response:

```
This command downloads the latest release of the "egpt" tool from the "egomobile/e-gpt" GitHub repository for macOS devices with ARM64 architecture, extracts the binary from the downloaded archive, and saves it as an executable file in the "/usr/local/bin" directory.
```

### explain [<a href="#commands-">↑</a>]

> Explains source code.

If you for example have this [BASIC spagetti code](https://www.geeksforgeeks.org/spaghetti-code/) in a `spagetti.bas` file:

```basic
i=0
i=i+1
PRINT i; "squared=";i*i
IF i>=100 THEN GOTO 6
GOTO 2
PRINT "Program Completed."
END
```

You can execute

```bash
egpt explain < ./spagetti.bas --language=basic
```

and may get an output like this:

```
This is a simple program that calculates the square of numbers from 1 to 100 and prints them to the console. 

The program starts by initializing a variable `i` with the value 0. It then enters a loop that increments `i` by 1, calculates the square of `i`, and prints the result to the console in the format "i squared= result". 

The loop continues until `i` is greater than or equal to 100, at which point the program skips to line 6 and continues executing. If `i` is less than 100, the program jumps back to line 2 and continues the loop. 

Once the loop completes, the program prints "Program Completed." to the console and exits.
```

### optimize [<a href="#commands-">↑</a>]

> Optimizes source code.

If you for example have this [BASIC spagetti code](https://www.geeksforgeeks.org/spaghetti-code/) in a `spagetti.bas` file:

```basic
i=0
i=i+1
PRINT i; "squared=";i*i
IF i>=100 THEN GOTO 6
GOTO 2
PRINT "Program Completed."
END
```

You can execute

```bash
egpt optimize < ./spagetti.bas
```

and may get an output like this:

```basic
i=0
WHILE i<100
    i=i+1
    PRINT i; "squared=";i*i
END WHILE
PRINT "Program Completed."
```

### shell [<a href="#commands-">↑</a>]

> Converts human language into a shell command.

Lets say you execute

```bash
egpt shell -e
```

and submit the following text from your editor to `egpt`:

```
Think about the following bash script that:

1. download github release list from https://api.github.com/repos/egomobile/e-gpt/releases/latest using curl, which pipes it to
2. jq, which detects first matching value in "browser_download_url" sub property of "assets" property with "darwin" and "arm64" substrings, which pipes it
3. and write it to a variable
4. this variable is used as download URL for a new curl instance, which download the underlying .tar.gz file and pipes it
5. to tar, which extracts the single "egpt" file in there and tar pipes this extracted file as content
6. so that it is saved to /usr/local/bin folder
7. at last make the file executable
```

A possible output in a `zsh` shell could be:

```
curl -s https://api.github.com/repos/egomobile/e-gpt/releases/latest | jq -r '.assets[].browser_download_url | select(contains("darwin") and contains("arm64"))' | xargs curl -sL | tar xzOf - egpt | sudo tee /usr/local/bin/egpt > /dev/null && sudo chmod +x /usr/local/bin/egpt
[E]xecute, [a]bort >
```

Keep in mind: `E` is the default selection and will execute the given command.

### summarize [<a href="#commands-">↑</a>]

> Summarize a long text.

```bash
egpt summarize --max-length=10000 --language=chinese < ./long-article.txt
```

Possible response:

```
该文章批评了红帽公司在IBM收购后的做法，认为其背离了开源社区的原则，变得像一家普通的软件公司。文章指出，红帽公司最近的一系列举动，如解雇了开源社区网站的团队和收回了RHEL的代码，都是对开源社区的背叛。作者认为，像Rocky Linux和AlmaLinux这样的替代品是很重要的，因为很多企业需要一种免费的RHEL克隆版，而不想支付高昂的费用。文章认为，这种做法是对开源社区的不尊重，而且与其先前的言论相矛盾。
```

### translate [<a href="#commands-">↑</a>]

> Translates a text.

```bash
egpt translate --language=german < ./chinese-article.txt
```

Possible response:

```
Der Text kritisiert das Verhalten von Red Hat nach der Übernahme durch IBM und wirft dem Unternehmen vor, sich von den Prinzipien der Open-Source-Community abzuwenden und zu einem gewöhnlichen Software-Unternehmen zu werden. Der Autor weist darauf hin, dass die jüngsten Maßnahmen von Red Hat, wie die Entlassung des Teams der Open-Source-Community-Website und die Rücknahme des RHEL-Codes, Verrat an der Open-Source-Community sind. Der Autor hält Alternativen wie Rocky Linux und AlmaLinux für wichtig, da viele Unternehmen eine kostenlose RHEL-Klon-Version benötigen, ohne hohe Kosten zu zahlen. Der Autor betrachtet dieses Verhalten als respektlos gegenüber der Open-Source-Community und widersprüchlich zu früheren Äußerungen von Red Hat.
```

## Examples [<a href="#toc">↑</a>]

A list of useful examples, can be found [here](./examples/README.md).

## Inputs [<a href="#toc">↑</a>]

You have the following sources for input data:

1. One or more non-flag command line arguments. All will be concatenate and seperated by space to one string.
   - Example: `egpt ask who is bill gates`
2. The [STDIN](https://en.wikipedia.org/wiki/Standard_streams):
   - Example #1: `egpt ask "please summarize" < ./long-text.txt`
   - Example #2: `curl -sSL "https://raw.githubusercontent.com/egomobile/e-gpt/main/LICENSE" | ./egpt ask summarize the following text`
3. The standard editor:
   - Example: `egpt ask summarize the following text --editor`

You can combine all kind of inputs. All texts will be concatenated in the given order and seperated by space to one string.

Keep in mind: The final prompt will be trimmed (start + end).

## Credits [<a href="#toc">↑</a>]

The module makes use of:

- [Chroma](https://github.com/alecthomas/chroma) 
- [Cobra](https://github.com/spf13/cobra)
- [GoDotEnv](https://github.com/joho/godotenv)
