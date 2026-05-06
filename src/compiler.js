import { parse } from "./parser.js"
import analyze from "./analyzer.js"
import optimize from "./optimizer.js"
import generate from "./generator.js"

export default function compile(source, options = {}) {
  const ast = parse(source)
  if (options.ast) return ast

  const analyzed = analyze(ast)
  if (options.analyze) return analyzed

  const optimized = optimize(analyzed)
  if (options.optimize) return optimized

  return generate(optimized)
}

