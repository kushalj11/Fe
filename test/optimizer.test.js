import { parse } from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

const opt = source => optimize(analyze(parse(source)))

describe("Optimizer", () => {
  describe("Constant Folding - Integer Arithmetic", () => {
    test("folds integer addition", () => {
      const p = opt("let x = 2 + 3;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.IntLiteral)
      expect(p.statements[0].initializer.value).toBe(5)
    })
    test("folds integer subtraction", () => {
      const p = opt("let x = 10 - 3;")
      expect(p.statements[0].initializer.value).toBe(7)
    })
    test("folds integer multiplication", () => {
      const p = opt("let x = 4 * 5;")
      expect(p.statements[0].initializer.value).toBe(20)
    })
    test("folds integer division", () => {
      const p = opt("let x = 10 / 2;")
      expect(p.statements[0].initializer.value).toBe(5)
    })
    test("folds integer modulo", () => {
      const p = opt("let x = 10 % 3;")
      expect(p.statements[0].initializer.value).toBe(1)
    })
    test("folds integer less-than", () => {
      const p = opt("let b = 2 < 5;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BoolLiteral)
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds integer greater-than", () => {
      const p = opt("let b = 5 > 2;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds integer <=", () => {
      const p = opt("let b = 2 <= 2;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds integer >=", () => {
      const p = opt("let b = 3 >= 2;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds integer equality", () => {
      const p = opt("let b = 2 == 2;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds integer inequality", () => {
      const p = opt("let b = 2 != 3;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
  })

  describe("Constant Folding - Float Arithmetic", () => {
    test("folds float addition", () => {
      const p = opt("let x = 1.0 + 2.0;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.FloatLiteral)
      expect(p.statements[0].initializer.value).toBeCloseTo(3.0)
    })
    test("folds float subtraction", () => {
      const p = opt("let x = 5.0 - 2.0;")
      expect(p.statements[0].initializer.value).toBeCloseTo(3.0)
    })
    test("folds float multiplication", () => {
      const p = opt("let x = 2.0 * 3.0;")
      expect(p.statements[0].initializer.value).toBeCloseTo(6.0)
    })
    test("folds float division", () => {
      const p = opt("let x = 9.0 / 3.0;")
      expect(p.statements[0].initializer.value).toBeCloseTo(3.0)
    })
    test("folds float comparison", () => {
      const p = opt("let b = 1.5 < 2.5;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds int+float", () => {
      const p = opt("let x = 1 + 2.0;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.FloatLiteral)
    })
  })

  describe("Constant Folding - Boolean", () => {
    test("folds bool && true", () => {
      const p = opt("let b = true && false;")
      expect(p.statements[0].initializer.value).toBe(false)
    })
    test("folds bool || false", () => {
      const p = opt("let b = true || false;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds bool ==", () => {
      const p = opt("let b = true == true;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds bool !=", () => {
      const p = opt("let b = true != false;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds unary not true", () => {
      const p = opt("let b = !true;")
      expect(p.statements[0].initializer.value).toBe(false)
    })
    test("folds unary not false", () => {
      const p = opt("let b = !false;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
  })

  describe("Constant Folding - Unary", () => {
    test("folds unary int negation", () => {
      const p = opt("let x = -5;")
      expect(p.statements[0].initializer.value).toBe(-5)
    })
    test("folds unary float negation", () => {
      const p = opt("let x = -3.14;")
      expect(p.statements[0].initializer.value).toBeCloseTo(-3.14)
    })
  })

  describe("Strength Reduction", () => {
    test("x * 1 => x", () => {
      const p = opt("let x = 5; let y = x * 1;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("x + 0 => x", () => {
      const p = opt("let x = 5; let y = x + 0;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("x - 0 => x", () => {
      const p = opt("let x = 5; let y = x - 0;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("x / 1 => x", () => {
      const p = opt("let x = 5; let y = x / 1;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("0 + x => x", () => {
      const p = opt("let x = 5; let y = 0 + x;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("1 * x => x", () => {
      const p = opt("let x = 5; let y = 1 * x;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.Identifier)
    })
    test("0 * x => 0", () => {
      const p = opt("let x = 5; let y = 0 * x;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.IntLiteral)
      expect(p.statements[1].initializer.value).toBe(0)
    })
    test("x * 0 => 0", () => {
      const p = opt("let x = 5; let y = x * 0;")
      expect(p.statements[1].initializer).toBeInstanceOf(core.IntLiteral)
      expect(p.statements[1].initializer.value).toBe(0)
    })
  })

  describe("Dead Code Elimination", () => {
    test("if(true) keeps consequent", () => {
      const p = opt("if (true) { let x = 1; } else { let y = 2; }")
      expect(p.statements[0]).toBeInstanceOf(core.Block)
    })
    test("if(false) uses alternate", () => {
      const p = opt("if (false) { let x = 1; } else { let y = 2; }")
      expect(p.statements[0]).toBeInstanceOf(core.Block)
    })
    test("if(false) with no alternate returns null", () => {
      const p = opt("if (false) { let x = 1; }")
      expect(p.statements[0]).toBeNull()
    })
    test("while(false) is eliminated", () => {
      const p = opt("while (false) { let x = 1; }")
      expect(p.statements[0]).toBeNull()
    })
    test("while(true) is kept", () => {
      const p = opt("while (true) { break; }")
      expect(p.statements[0]).toBeInstanceOf(core.WhileStatement)
    })
  })

  describe("Structural Preservation", () => {
    test("function declaration preserved", () => {
      const p = opt("fun f(x: int): int { return x; }")
      expect(p.statements[0]).toBeInstanceOf(core.FunDecl)
    })
    test("class declaration preserved", () => {
      const p = opt("class Animal {}")
      expect(p.statements[0]).toBeInstanceOf(core.ClassDecl)
    })
    test("print preserved", () => {
      const p = opt('print("hello");')
      expect(p.statements[0]).toBeInstanceOf(core.PrintStatement)
    })
    test("for loop preserved", () => {
      const p = opt("for (let i: int = 0; i < 10; i + 1) { print(i); }")
      expect(p.statements[0]).toBeInstanceOf(core.ForStatement)
    })
    test("break/continue preserved in loop", () => {
      const p = opt("while (true) { break; }")
      expect(p.statements[0].body.statements[0]).toBeInstanceOf(core.BreakStatement)
    })
    test("method call preserved", () => {
      const p = opt('let obj = "hi"; let x = obj.method(1);')
      expect(p.statements[1].initializer).toBeInstanceOf(core.MethodCallExpression)
    })
    test("member expression preserved", () => {
      const p = opt('let obj = "hi"; let x = obj.prop;')
      expect(p.statements[1].initializer).toBeInstanceOf(core.MemberExpression)
    })
    test("subscript expression preserved", () => {
      const p = opt("let arr = [1, 2]; let x = arr[0];")
      expect(p.statements[1].initializer).toBeInstanceOf(core.SubscriptExpression)
    })
    test("array expression preserved", () => {
      const p = opt("let arr = [1, 2, 3];")
      expect(p.statements[0].initializer).toBeInstanceOf(core.ArrayExpression)
    })
    test("assign statement preserved", () => {
      const p = opt("let x: int = 1; x = 2;")
      expect(p.statements[1]).toBeInstanceOf(core.AssignStatement)
    })
    test("expression statement preserved", () => {
      const p = opt("fun f(): int { return 1; } f();")
      expect(p.statements[1]).toBeInstanceOf(core.ExpressionStatement)
    })
    test("return statement optimized", () => {
      const p = opt("fun f(): int { return 1 + 1; }")
      const ret = p.statements[0].body.statements[0]
      expect(ret.expression.value).toBe(2)
    })
    test("void return preserved", () => {
      const p = opt("fun f(): void { return; }")
      const ret = p.statements[0].body.statements[0]
      expect(ret.expression).toBeNull()
    })
    test("no divide by zero fold", () => {
      const p = opt("let x = 5 / 0;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
    test("no modulo by zero fold", () => {
      const p = opt("let x = 5 % 0;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
    test("if-else-if chain preserved when non-constant", () => {
      const p = opt("let b: bool = true; if (b) { let x = 1; } else { let y = 2; }")
      expect(p.statements[1]).toBeInstanceOf(core.IfStatement)
    })
    test("no float divide by zero fold", () => {
      const p = opt("let x = 1.0 / 0.0;")
      expect(p.statements[0].initializer).toBeInstanceOf(core.BinaryExpression)
    })
    test("folds float >", () => {
      const p = opt("let b = 3.0 > 2.0;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds float <=", () => {
      const p = opt("let b = 2.0 <= 2.0;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds float >=", () => {
      const p = opt("let b = 3.0 >= 2.0;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds float ==", () => {
      const p = opt("let b = 2.0 == 2.0;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
    test("folds float !=", () => {
      const p = opt("let b = 1.0 != 2.0;")
      expect(p.statements[0].initializer.value).toBe(true)
    })
  })
})

