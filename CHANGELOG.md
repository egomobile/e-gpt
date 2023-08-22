# Change Log (e.GPT)

## 0.10.0

- add optional check of `CHAT_ANSWER_NO_NEW_LINE` environment variable to setup a default behavior

## 0.9.0

- new line string is added to answers automatically now by default ... added `no-new-line` flag to setup legacy behavior

## 0.8.2

- implement import dialog, which downloads content from a website as additional text into input field

## 0.7.3

- reimplement UI, which is inspired by [Chatbot UI](https://github.com/mckaywrigley/chatbot-ui) project
- (bug-)fix and other improvements

## 0.6.0

- **BREAKING CHANGE**: changed input order to:
  1. arguments
  2. editor
  3. STDIN

## 0.5.0

- implement `ui` command, which open a local UI, thanks to [jbonot](https://github.com/egomobile/e-gpt/issues/2)

## 0.4.0

- `.system` file in `${HOME}/.egpt` can now contain a default system prompt, thanks to [jbonot](https://github.com/egomobile/e-gpt/issues/1)

## 0.3.0

- implement `sql` command

## 0.2.0

- implement `environment` command
- code cleanups and improvements

## 0.1.1

- initial beta release
