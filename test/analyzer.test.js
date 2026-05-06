import { parse } from "../src/parser.js"
import analyze from "../src/analyzer.js"
import * as core from "../src/core.js"

const ok = source => analyze(parse(source))
const err = source => () => analyze(parse(source))

describe("Analyzer", () => {
  describe("Variable Declarations", () => {
    test("basic let declaration", () => {
      const p = ok("let x: int = 5;")
      expect(p.statements[0].type).toBe(core.Type.INT)
    })
    test("type inference", () => {
      const p = ok("let x = 3.14;")
      expect(p.statements[0].type).toBe(core.Type.FLOAT)
    })
    test("const declaration", () => {
      const p = ok("const PI = 3.14;")
      expect(p.statements[0].constant).toBe(true)
    })
    test("bool type inference", () => {
      const p = ok("let b = true;")
      expect(p.statements[0].type).toBe(core.Type.BOOL)
    })
    test("string type inference", () => {
      const p = ok('let s = "hello";')
      expect(p.statements[0].type).toBe(core.Type.STRING)
    })
    test("undeclared variable error", () => {
      expect(err("let x = y;")).toThrow(/not declared/)
    })
    test("duplicate declaration error", () => {
      expect(err("let x = 1; let x = 2;")).toThrow(/already declared/)
    })
    test("type mismatch error", () => {
      expect(err("let x: int = true;")).toThrow(/Type mismatch/)
    })
    test("assignment to constant", () => {
      expect(err("const x = 1; x = 2;")).toThrow(/constant/)
    })
    test("assignment type mismatch", () => {
      expect(err("let x: int = 1; x = true;")).toThrow(/Type mismatch/)
    })
  })

  describe("Function Declarations", () => {
    test("basic function", () => {
      const p = ok("fun add(a: int, b: int): int { return a; }")
      expect(p.statements[0]).toBeInstanceOf(core.FunDecl)
    })
    test("calling declared function", () => {
      const p = ok("fun f(x: int): int { return x; } let y = f(1);")
      expect(p.statements[1].type).toBe(core.Type.INT)
    })
    test("wrong arg count", () => {
      expect(err("fun f(x: int): int { return x; } f();")).toThrow(/expects 1/)
    })
    test("wrong arg type", () => {
      expect(err("fun f(x: int): int { return x; } f(true);")).toThrow(/Argument 1 type mismatch/)
    })
    test("calling non-function", () => {
      expect(err("let x = 1; let y = x();")).toThrow(/not a function/)
    })
    test("return type mismatch", () => {
      expect(err("fun f(): int { return true; }")).toThrow(/Return type mismatch/)
    })
    test("return required for typed function", () => {
      expect(err("fun f(): int { return; }")).toThrow(/must return a value/)
    })
    test("return outside function", () => {
      expect(err("return 1;")).toThrow(/return outside of function/)
    })
    test("void return", () => {
      const p = ok("fun f(): void { return; }")
      expect(p.statements[0]).toBeInstanceOf(core.FunDecl)
    })
  })

  describe("Control Flow", () => {
    test("if with bool condition", () => {
      const p = ok("if (true) { let x = 1; }")
      expect(p.statements[0]).toBeInstanceOf(core.IfStatement)
    })
    test("if with non-bool condition error", () => {
      expect(err("if (1) { let x = 1; }")).toThrow(/Expected bool/)
    })
    test("while with bool", () => {
      const p = ok("while (false) { let x = 1; }")
      expect(p.statements[0]).toBeInstanceOf(core.WhileStatement)
    })
    test("while with non-bool error", () => {
      expect(err("while (1) { let x = 1; }")).toThrow(/Expected bool/)
    })
    test("break inside loop", () => {
      const p = ok("while (true) { break; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.BreakStatement)
    })
    test("break outside loop error", () => {
      expect(err("break;")).toThrow(/break outside of loop/)
    })
    test("continue inside loop", () => {
      const p = ok("while (true) { continue; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.ContinueStatement)
    })
    test("continue outside loop error", () => {
      expect(err("continue;")).toThrow(/continue outside of loop/)
    })
    test("for loop", () => {
      const p = ok("for (let i: int = 0; i < 10; i + 1) { print(i); }")
      expect(p.statements[0]).toBeInstanceOf(core.ForStatement)
    })
    test("for loop with non-bool test error", () => {
      expect(err("for (let i: int = 0; 5; i + 1) { print(i); }")).toThrow(/Expected bool/)
    })
  })

  describe("Expressions", () => {
    test("arithmetic int+int = int", () => {
      const p = ok("let x = 1 + 2;")
      expect(p.statements[0].type).toBe(core.Type.INT)
    })
    test("arithmetic int+float = float", () => {
      const p = ok("let x = 1 + 2.0;")
      expect(p.statements[0].type).toBe(core.Type.FLOAT)
    })
    test("string concatenation", () => {
      const p = ok('let s = "a" + "b";')
      expect(p.statements[0].type).toBe(core.Type.STRING)
    })
    test("comparison produces bool", () => {
      const p = ok("let b = 1 < 2;")
      expect(p.statements[0].type).toBe(core.Type.BOOL)
    })
    test("equality produces bool", () => {
      const p = ok("let b = 1 == 1;")
      expect(p.statements[0].type).toBe(core.Type.BOOL)
    })
    test("logical and/or", () => {
      const p = ok("let b = true && false;")
      expect(p.statements[0].type).toBe(core.Type.BOOL)
    })
    test("logical with non-bool error", () => {
      expect(err("let b = 1 && true;")).toThrow(/Expected bool/)
    })
    test("unary negation int", () => {
      const p = ok("let x = -5;")
      expect(p.statements[0].type).toBe(core.Type.INT)
    })
    test("unary not", () => {
      const p = ok("let b = !true;")
      expect(p.statements[0].type).toBe(core.Type.BOOL)
    })
    test("negation of non-numeric error", () => {
      expect(err('let x = -"hello";')).toThrow(/numeric/)
    })
    test("not of non-bool error", () => {
      expect(err("let x = !5;")).toThrow(/Expected bool/)
    })
    test("array expression", () => {
      const p = ok("let arr = [1, 2, 3];")
      expect(p.statements[0].type).toBeInstanceOf(core.ArrayType)
    })
    test("subscript expression", () => {
      const p = ok("let arr = [1, 2]; let x = arr[0];")
      expect(p.statements[1].type).toBe(core.Type.INT)
    })
    test("subscript with non-int index error", () => {
      expect(err("let arr = [1, 2]; let x = arr[true];")).toThrow(/Array index must be int/)
    })
    test("arithmetic on non-numeric error", () => {
      expect(err("let x = true + 1;")).toThrow(/numeric/)
    })
    test("comparison on non-numeric error", () => {
      expect(err('let x = "a" < "b";')).toThrow(/numeric/)
    })
    test("member expression", () => {
      const p = ok('let obj = "hello"; let x = obj.prop;')
      expect(p.statements[1].type).toBe(core.Type.ANY)
    })
    test("method call", () => {
      const p = ok('let obj = "hello"; let x = obj.method(1);')
      expect(p.statements[1].type).toBe(core.Type.ANY)
    })
  })

  describe("Classes", () => {
    test("class declaration", () => {
      const p = ok("class Animal { fun speak(): void {} }")
      expect(p.statements[0]).toBeInstanceOf(core.ClassDecl)
    })
  })

  describe("Print Statement", () => {
    test("print any type", () => {
      const p = ok('print("hello");')
      expect(p.statements[0]).toBeInstanceOf(core.PrintStatement)
    })
  })

  describe("Array Type Matching", () => {
    test("typed array variable matches array type", () => {
      const p = ok("let arr: [int] = [1, 2, 3];")
      expect(p.statements[0].type).toBeInstanceOf(core.ArrayType)
    })
    test("empty typed array", () => {
      const p = ok("let arr: [int] = [];")
      expect(p.statements[0].type).toBeInstanceOf(core.ArrayType)
    })
  })
})

