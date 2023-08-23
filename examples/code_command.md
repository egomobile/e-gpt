# [e.GPT](../README.md) :: [Examples](./README.md) :: Generate code

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
