import compile from "../src/compiler.js"

const ok = (source, opts) => () => compile(source, opts)
const err = source => () => compile(source)

describe("Compiler", () => {
  describe("End-to-End Compilation", () => {
    test("compiles a simple program", () => {
      const output = compile('print("hello");')
      expect(output).toContain("console.log")
    })
    test("compiles variable declaration", () => {
      const output = compile("let x = 5;")
      expect(output).toContain("let x = 5;")
    })
    test("compiles function", () => {
      const output = compile("fun add(a: int, b: int): int { return a; }")
      expect(output).toContain("function add")
    })
    test("compiles to JavaScript", () => {
      const output = compile("const PI = 3.14;")
      expect(typeof output).toBe("string")
      expect(output).toContain("3.14")
    })
  })

  describe("AST Option", () => {
    test("returns AST with ast option", () => {
      const ast = compile("let x = 1;", { ast: true })
      expect(ast).toBeDefined()
      expect(ast.statements).toBeDefined()
    })
  })

  describe("Analyze Option", () => {
    test("returns analyzed AST with analyze option", () => {
      const analyzed = compile("let x = 1;", { analyze: true })
      expect(analyzed).toBeDefined()
      expect(analyzed.statements).toBeDefined()
    })
  })

  describe("Optimize Option", () => {
    test("returns optimized AST with optimize option", () => {
      const optimized = compile("let x = 1 + 1;", { optimize: true })
      expect(optimized).toBeDefined()
    })
  })

  describe("Error Reporting", () => {
    test("reports parse error", () => {
      expect(err("let = 1;")).toThrow()
    })
    test("reports semantic error", () => {
      expect(err("let x = y;")).toThrow()
    })
    test("reports type error", () => {
      expect(err("let x: int = true;")).toThrow()
    })
  })

  describe("Feature Coverage", () => {
    test("compiles while loop", () => {
      const output = compile("while (true) { break; }")
      expect(output).toContain("while")
    })
    test("compiles if statement", () => {
      const output = compile("let b: bool = true; if (b) { let x = 1; }")
      expect(output).toMatch(/if/)
    })
    test("compiles for loop", () => {
      const output = compile("for (let i: int = 0; i < 10; i + 1) { print(i); }")
      expect(output).toContain("for")
    })
    test("compiles class", () => {
      const output = compile("class Animal {}")
      expect(output).toContain("class Animal")
    })
    test("compiles array", () => {
      const output = compile("let arr = [1, 2, 3];")
      expect(output).toContain("[1, 2, 3]")
    })
    test("folds constants at compile time", () => {
      const output = compile("let x = 2 + 3;")
      expect(output).toContain("5")
    })
  })
})

