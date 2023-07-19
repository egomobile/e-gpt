# [e.GPT](../README.md) :: [Examples](./README.md) :: Optimize code

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

```
i=0
WHILE i<100
    i=i+1
    PRINT i; "squared=";i*i
END WHILE
PRINT "Program Completed."
```