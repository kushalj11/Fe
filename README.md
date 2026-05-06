<p align="center">
  <img src="docs/logo.svg" width="180" alt="Fe Logo"/>
</p>

<h1 align="center">Fe</h1>

<p align="center">
Fe is a statically typed language that compiles to JavaScript. It was built around one principle: the compiler should eliminate whole categories of bugs before a program ever executes.

The static analysis phase resolves every identifier at compile time and infers types from surrounding context. Explicit annotations are only required when a declaration is genuinely ambiguous. Function signatures are verified against every call site, return paths are traced across every branch, and control flow keywords are validated against the enclosing structure they belong to. When the analyzer detects a violation it produces a precise diagnostic with enough surrounding context for the programmer to understand exactly what went wrong and why.

The syntax draws from conventions most developers already know, so there is no meaningful barrier to reading or writing Fe code. The compiler is organized as four sequential stages: parse, analyze, optimize, and generate. Each stage carries a singl responsibility and produces structured output that flows directly into the next.
</p>

<p align="center"><strong>Kushal Jayaswal</strong></p>

---

## Features

- **Static typing** with type inference and explicit annotations
- **First-class functions** with parameters and return types
- **Classes** with member variables and methods
- **Arrays** with type safety
- **Control flow** including if/else, while, for loops with break/continue
- **Optimizations** including constant folding, strength reduction, and dead code elimination
- **Multiple compilation targets** including AST, analyzed AST, optimized AST, and JavaScript

## Static Semantic Constraints

Fe enforces the following rules at compile time:

- All identifiers must be declared before use
- No duplicate declarations in the same scope
- Variables cannot be redeclared as constants or vice versa
- Types must match in assignments and expressions
- Function arguments must match parameter types and count
- Return types must match function declarations
- Return statements only allowed inside functions
- Break and continue only allowed inside loops
- Conditions must be boolean expressions
- Arithmetic operators require numeric types
- Array indices must be integers
- Constants cannot be reassigned
- All code paths in non-void functions must return a value

## Example Programs

### Fibonacci

<table>
<tr><th>Fe</th><th>JavaScript</th></tr>
<tr>
<td>

```fe
fun fibonacci(n: int): int {
  if (n <= 1) {
    return n;
  } else {
    return fibonacci(n - 1) + 
           fibonacci(n - 2);
  }
}
print(fibonacci(10));
```

</td>
<td>

```javascript
function fibonacci(n) {
  if ((n <= 1)) {
    return n;
  } else {
    return (fibonacci(n - 1) + 
            fibonacci(n - 2));
  }
}
console.log(fibonacci(10));
```

</td>
</tr>
</table>

### Classes

<table>
<tr><th>Fe</th><th>JavaScript</th></tr>
<tr>
<td>

```fe
class Counter {
  let count: int = 0;
  
  fun increment(): void {
    count = count + 1;
    return;
  }
}
```

</td>
<td>

```javascript
class Counter {
  let count = 0;
  function increment() {
    count = (count + 1);
    return;
  }
}
```

</td>
</tr>
</table>

### Arrays

<table>
<tr><th>Fe</th><th>JavaScript</th></tr>
<tr>
<td>

```fe
let nums: [int] = [1, 2, 3];
let sum: int = 0;
let i: int = 0;
while (i < 3) {
  sum = sum + nums[i];
  i = i + 1;
}
print(sum);
```

</td>
<td>

```javascript
let nums = [1, 2, 3];
let sum = 0;
let i = 0;
while ((i < 3)) {
  sum = (sum + nums[i]);
  i = (i + 1);
}
console.log(sum);
```

</td>
</tr>
</table>

## Usage

```bash
# Parse and generate JavaScript
node src/fe.js generate program.fe

# View AST
node src/fe.js ast program.fe

# View analyzed AST
node src/fe.js analyze program.fe

# View optimized AST
node src/fe.js optimize program.fe
```

## Testing

```bash
npm test
```

The test suite includes 201 tests across parser, analyzer, optimizer, generator, and compiler with 100% line coverage and 100% function coverage.

## Grammar

The complete Fe grammar is defined in [src/fe.ohm](src/fe.ohm) using the Ohm parsing toolkit.

## More Information

Visit the [Fe companion website](https://kushalj11.github.io/Fe) for more examples and documentation.

## License

MIT License - see LICENSE file for details.