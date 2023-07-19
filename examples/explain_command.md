# [e.GPT](../README.md) :: [Examples](./README.md) :: Explain source code

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