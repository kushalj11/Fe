#!/usr/bin/env node
import { readFileSync } from "fs"
import compile from "./compiler.js"

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error("Usage: fe <command> <filename>")
  console.error("Commands: ast, analyze, optimize, generate")
  process.exit(1)
}

const [command, filename] = args
const source = readFileSync(filename, "utf8")

try {
  let result
  if (command === "ast") result = compile(source, { ast: true })
  else if (command === "analyze") result = compile(source, { analyze: true })
  else if (command === "optimize") result = compile(source, { optimize: true })
  else if (command === "generate") result = compile(source)
  else {
    console.error(`Unknown command: ${command}`)
    process.exit(1)
  }

  if (typeof result === "string") {
    console.log(result)
  } else {
    console.log(JSON.stringify(result, null, 2))
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
