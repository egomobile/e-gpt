# [e.GPT](../README.md) :: [Examples](./README.md) :: Execute shell command

> Converts human language into a shell command.

Let's say you execute

```bash
egpt shell -e
```

and submit the following text from your editor to `egpt`:

```
Consider the following bash script:

1. Use curl to download the list of github releases from https://api.github.com/repos/egomobile/e-gpt/releases/latest, which is piped to
2. jq that finds the first matching "browser_download_url" sub-property of "assets" property with "darwin" and "arm64" substrings, which is piped to
3. and written to a variable.
4. This variable is used as the download URL for a new curl instance that downloads the underlying .tar.gz file, which is then piped to
5. tar, which extracts the single "egpt" file and pipes this extracted file as content
6. so that it is saved to /usr/local/bin folder.
7. Finally, make the file executable.
```

A possible output in a `zsh` shell could be:

```
curl -s https://api.github.com/repos/egomobile/e-gpt/releases/latest | jq -r '.assets[].browser_download_url | select(contains("darwin") and contains("arm64") and (. | tostring | contains("sha256") | not))' | xargs curl -sL | tar xzOf - egpt | sudo tee /usr/local/bin/egpt > /dev/null && sudo chmod +x /usr/local/bin/egpt
[E]xecute, [a]bort >
```

Keep in mind that `E` is the default selection and will execute the given command.
