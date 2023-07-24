# [e.GPT](../README.md) :: [Examples](./README.md) :: Execute SQL from human language

> Execute SQL from human language.

```bash
egpt sql --csv "list all customers with last name Musk and select only name and address columns"
```

Possible response:

```
The following statements will be executed:
- SELECT first_name, last_name, company_name, email_address, phone_number, street, city, post_code, country FROM public.customers WHERE lower(last_name) = 'musk'

[E]xecute, [a]bort
```

Keep in mind: `E` is the default selection and will execute the given command.

To setup the database connection, you can

- setup `DATABASE_URL` environment variable with a connection string
- use `connection` CLI flag with a connection string

Currently supported are:
- [PostgreSQL](https://github.com/lib/pq)
