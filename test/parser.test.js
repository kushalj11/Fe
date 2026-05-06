import { parse } from "../src/parser.js"
import * as core from "../src/core.js"

const parseOk = source => () => parse(source)
const parseErr = source => () => parse(source)

describe("Parser", () => {
  describe("Variable Declarations", () => {
    test("let with type", () => {
      const p = parse("let x: int = 5;")
      expect(p.statements[0]).toBeInstanceOf(core.VarDecl)
      expect(p.statements[0].name).toBe("x")
      expect(p.statements[0].constant).toBe(false)
    })
    test("let without type", () => {
      const p = parse("let y = 3.14;")
      expect(p.statements[0]).toBeInstanceOf(core.VarDecl)
    })
    test("const declaration", () => {
      const p = parse("const PI: float = 3.14;")
      expect(p.statements[0].constant).toBe(true)
    })
  })

  describe("Function Declarations", () => {
    test("simple function", () => {
      const p = parse("fun greet(name: string): string { return name; }")
      expect(p.statements[0]).toBeInstanceOf(core.FunDecl)
      expect(p.statements[0].name).toBe("greet")
      expect(p.statements[0].params.length).toBe(1)
    })
    test("function no params no return type", () => {
      const p = parse("fun doThing() { let x = 1; }")
      expect(p.statements[0]).toBeInstanceOf(core.FunDecl)
    })
    test("function multiple params", () => {
      const p = parse("fun add(a: int, b: int): int { return a; }")
      expect(p.statements[0].params.length).toBe(2)
    })
  })

  describe("Control Flow", () => {
    test("if statement", () => {
      const p = parse("if (true) { let x = 1; }")
      expect(p.statements[0]).toBeInstanceOf(core.IfStatement)
    })
    test("if-else statement", () => {
      const p = parse("if (true) { let x = 1; } else { let y = 2; }")
      expect(p.statements[0].alternate).not.toBeNull()
    })
    test("if-else-if", () => {
      const p = parse("if (true) { let x = 1; } else if (false) { let y = 2; }")
      expect(p.statements[0].alternate).toBeInstanceOf(core.IfStatement)
    })
    test("while statement", () => {
      const p = parse("while (true) { break; }")
      expect(p.statements[0]).toBeInstanceOf(core.WhileStatement)
    })
    test("for statement", () => {
      const p = parse("for (let i: int = 0; i < 10; i + 1) { print(i); }")
      expect(p.statements[0]).toBeInstanceOf(core.ForStatement)
    })
  })

  describe("Expressions", () => {
    test("binary arithmetic", () => {
      const p = parse("let x = 1 + 2;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
    test("boolean literals", () => {
      const p = parse("let a = true;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BoolLiteral)
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("string literal", () => {
      const p = parse('let s = "hello";')
      expect(p.statements[0].initializer).toBeInstanceOf(core.StringLiteral)
    })
    test("float literal", () => {
      const p = parse("let f = 3.14;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.FloatLiteral)
    })
    test("unary negation", () => {
      const p = parse("let x = -5;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.UnaryExpression)
    })
    test("unary not", () => {
      const p = parse("let b = !true;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.UnaryExpression)
      expect(p.statements[0].initializer.op).toBe("!")
    })
    test("function call", () => {
      const p = parse("fun f() {} f();")
      expect(p.statements[1]).toBeInstanceOf(core.ExpressionStatement)
    })
    test("array literal", () => {
      const p = parse("let arr = [1, 2, 3];")
      expect(p.statements[0].initializer).toBeInstanceOf(core.ArrayExpression)
    })
    test("subscript expression", () => {
      const p = parse("let x = arr[0];")
      expect(p.statements[0].initializer).toBeInstanceOf(core.SubscriptExpression)
    })
    test("member expression", () => {
      const p = parse("let x = 1; let n = x.name;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.MemberExpression)
    })
    test("method call", () => {
      const p = parse('let x = 1; let n = x.push(1);')
      expect(p.statements[1].initializer).toBeInstanceOf(core.MethodCallExpression)
    })
    test("parenthesized expression", () => {
      const p = parse("let x = (1 + 2);")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
    test("comparison operators", () => {
      const ops = ["<", ">", "<=", ">=", "==", "!="]
      for (const op of ops) {
        const p = parse(`let b = 1 ${op} 2;`)
        expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
      }
    })
    test("logical operators", () => {
      const p = parse("let b = true && false;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
      const p2 = parse("let b = true || false;")
      expect(p2.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
  })

  describe("Other Statements", () => {
    test("print statement", () => {
      const p = parse('print("hello");')
      expect(p.statements[0]).toBeInstanceOf(core.PrintStatement)
    })
    test("return statement", () => {
      const p = parse("fun f(): int { return 1; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.ReturnStatement)
    })
    test("return void", () => {
      const p = parse("fun f() { return; }")
      expect(p.statements[0].body.statements[0].expression).toBeNull()
    })
    test("break statement", () => {
      const p = parse("while (true) { break; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.BreakStatement)
    })
    test("continue statement", () => {
      const p = parse("while (true) { continue; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.ContinueStatement)
    })
    test("class declaration", () => {
      const p = parse("class Dog { fun bark(): void {} }")
      expect(p.statements[0]).toBeInstanceOf(core.ClassDecl)
    })
    test("assignment statement", () => {
      const p = parse("let x = 1; x = 2;")
      expect(p.statements[1]).toBeInstanceOf(core.AssignStatement)
    })
    test("user-defined type annotation", () => {
      const p = parse("class Foo {} fun f(x: Foo): Foo { return x; }")
      expect(p.statements[1].returnType).toBeInstanceOf(core.Type)
      expect(p.statements[1].returnType.name).toBe("Foo")
    })
    test("array type annotation", () => {
      const p = parse("let arr: [int] = [1];")
      expect(p.statements[0].type).toBeInstanceOf(core.ArrayType)
    })
    test("comments are ignored", () => {
      const p = parse("// this is a comment\nlet x = 1;")
      expect(p.statements[0]).toBeInstanceOf(core.VarDecl)
    })
    test("block comments", () => {
      const p = parse("/* block */ let x = 1;")
      expect(p.statements[0]).toBeInstanceOf(core.VarDecl)
    })
  })

  describe("Parse Errors", () => {
    test("missing semicolon", () => {
      expect(() => parse("let x = 1")).toThrow()
    })
    test("invalid syntax", () => {
      expect(() => parse("let = 1;")).toThrow()
    })
    test("unclosed string", () => {
      expect(() => parse('let x = "hello;')).toThrow()
    })
  })
})

