import { parse } from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"
import * as core from "../src/core.js"

const gen = source => generate(optimize(analyze(parse(source))))

describe("Generator", () => {
  describe("Variable Declarations", () => {
    test("let declaration", () => {
      expect(gen("let x = 5;")).toContain("let x = 5;")
    })
    test("const declaration", () => {
      expect(gen("const PI = 3.14;")).toContain("const PI = 3.14;")
    })
    test("string declaration", () => {
      expect(gen('let s = "hello";')).toContain('"hello"')
    })
    test("bool declaration", () => {
      expect(gen("let b = true;")).toContain("true")
    })
    test("array declaration", () => {
      expect(gen("let arr = [1, 2, 3];")).toContain("[1, 2, 3]")
    })
  })

  describe("Function Declarations", () => {
    test("simple function", () => {
      const code = gen("fun f(x: int): int { return x; }")
      expect(code).toContain("function f(x)")
      expect(code).toContain("return x;")
    })
    test("function no params", () => {
      const code = gen("fun greet(): void { return; }")
      expect(code).toContain("function greet()")
    })
    test("multi-param function", () => {
      const code = gen("fun add(a: int, b: int): int { return a; }")
      expect(code).toContain("function add(a, b)")
    })
  })

  describe("Control Flow", () => {
    test("if statement", () => {
      const code = gen("let b: bool = true; if (b) { let x = 1; }")
      expect(code).toMatch(/if/)
    })
    test("if-else statement", () => {
      const code = gen("let b: bool = true; if (b) { let x = 1; } else { let y = 2; }")
      expect(code).toContain("else")
    })
    test("while statement", () => {
      const code = gen("while (true) { break; }")
      expect(code).toContain("while")
      expect(code).toContain("break;")
    })
    test("for statement", () => {
      const code = gen("for (let i: int = 0; i < 10; i + 1) { print(i); }")
      expect(code).toContain("for")
    })
    test("break statement", () => {
      const code = gen("while (true) { break; }")
      expect(code).toContain("break;")
    })
    test("continue statement", () => {
      const code = gen("while (true) { continue; }")
      expect(code).toContain("continue;")
    })
    test("return statement", () => {
      const code = gen("fun f(): int { return 1; }")
      expect(code).toContain("return 1;")
    })
    test("return void", () => {
      const code = gen("fun f(): void { return; }")
      expect(code).toContain("return;")
    })
    test("if-else-if chain", () => {
      const code = gen("let b: bool = false; if (b) { let x = 1; } else if (b) { let y = 2; }")
      expect(code).toContain("else if")
    })
  })

  describe("Expressions", () => {
    test("binary expression", () => {
      const code = gen("let x: int = 10; let y: int = 5; let z = x + y;")
      expect(code).toContain("+")
    })
    test("unary negation", () => {
      const code = gen("let x: int = 5; let y = -x;")
      expect(code).toContain("-x")
    })
    test("unary not", () => {
      const code = gen("let b: bool = true; let c = !b;")
      expect(code).toContain("!b")
    })
    test("function call", () => {
      const code = gen("fun f(x: int): int { return x; } let y = f(1);")
      expect(code).toContain("f(1)")
    })
    test("method call", () => {
      const code = gen('let obj = "hi"; let x = obj.push(1);')
      expect(code).toContain("obj.push(1)")
    })
    test("member expression", () => {
      const code = gen('let obj = "hi"; let x = obj.prop;')
      expect(code).toContain("obj.prop")
    })
    test("subscript expression", () => {
      const code = gen("let arr = [1, 2]; let x = arr[0];")
      expect(code).toContain("arr[0]")
    })
    test("string literal", () => {
      const code = gen('let s = "world";')
      expect(code).toContain('"world"')
    })
    test("float literal", () => {
      const code = gen("let f = 3.14;")
      expect(code).toContain("3.14")
    })
  })

  describe("Print Statement", () => {
    test("generates console.log", () => {
      const code = gen('print("hello");')
      expect(code).toContain("console.log")
      expect(code).toContain('"hello"')
    })
  })

  describe("Class Declaration", () => {
    test("basic class", () => {
      const code = gen("class Animal {}")
      expect(code).toContain("class Animal")
    })
    test("class with method", () => {
      const code = gen("class Dog { fun bark(): void {} }")
      expect(code).toContain("class Dog")
      expect(code).toContain("function bark()")
    })
  })

  describe("Assignment", () => {
    test("assignment statement", () => {
      const code = gen("let x: int = 1; x = 5;")
      expect(code).toContain("x = 5;")
    })
  })

  describe("Complex Programs", () => {
    test("fibonacci-like function", () => {
      const source = `
        fun fib(n: int): int {
          if (n < 2) {
            return n;
          } else {
            return n;
          }
        }
        let result = fib(10);
      `
      const code = gen(source)
      expect(code).toContain("function fib")
      expect(code).toContain("return")
    })
    test("class with members", () => {
      const source = `
        class Counter {
          let count: int = 0;
          fun increment(): void { return; }
        }
      `
      const code = gen(source)
      expect(code).toContain("class Counter")
    })
    test("expression statement", () => {
      const code = gen("fun f(): int { return 1; } f();")
      expect(code).toContain("f();")
    })
    test("constant-folded if block", () => {
      const code = gen("if (true) { let x = 1; }")
      expect(code).toContain("let x = 1;")
    })
    test("empty array literal", () => {
      const code = gen("let arr: [int] = [];")
      expect(code).toContain("[]")
    })
  })
})

