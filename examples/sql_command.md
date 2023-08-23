# [e.GPT](../README.md) :: [Examples](./README.md) :: Execute SQL from human language

> Executes SQL from human language.

```bash
egpt sql --csv "list all customers with last name Musk and select only name and address columns"
```

Possible response:

```
The following statements will be executed:
- SELECT first_name, last_name, company_name, email_address, phone_number, street, city, post_code, country FROM public.customers WHERE lower(last_name) = 'musk'

[E]xecute, [a]bort
```

Keep in mind that `E` is the default selection and will execute the given command.

To set up the database connection, you can:

- Use the `connection` CLI flag with a connection string.
- Set up the `DATABASE_URL` environment variable with a connection string.

Currently, the following are supported:

- [PostgreSQL](https://github.com/lib/pq)
