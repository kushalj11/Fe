import * as core from "./core.js"

export default function generate(program) {
  const lines = []
  for (const s of program.statements) {
    const code = genStatement(s)
    if (code) lines.push(code)
  }
  return lines.join("\n")
}

function genStatement(node) {
  if (node instanceof core.FunDecl) {
    const params = node.params.map(p => p.name).join(", ")
    const body = genBlock(node.body)
    return `function ${node.name}(${params}) ${body}`
  }

  if (node instanceof core.VarDecl) {
    const keyword = node.constant ? "const" : "let"
    return `${keyword} ${mangle(node.name)} = ${genExp(node.initializer)};`
  }

  if (node instanceof core.ClassDecl) {
    const body = node.members.map(genStatement).filter(Boolean).join("\n  ")
    return `class ${node.name} {\n  ${body}\n}`
  }

  if (node instanceof core.ReturnStatement) {
    return node.expression ? `return ${genExp(node.expression)};` : `return;`
  }

  if (node instanceof core.BreakStatement) return `break;`

  if (node instanceof core.ContinueStatement) return `continue;`

  if (node instanceof core.IfStatement) {
    let code = `if (${genExp(node.test)}) ${genBlock(node.consequent)}`
    if (node.alternate) {
      if (node.alternate instanceof core.IfStatement) {
        code += ` else ${genStatement(node.alternate)}`
      } else {
        code += ` else ${genBlock(node.alternate)}`
      }
    }
    return code
  }

  if (node instanceof core.WhileStatement) {
    return `while (${genExp(node.test)}) ${genBlock(node.body)}`
  }

  if (node instanceof core.ForStatement) {
    const init = node.init ? genStatement(node.init).replace(/;$/, "") : ""
    const test = node.test ? genExp(node.test) : ""
    const update = node.update ? genExp(node.update) : ""
    return `for (${init}; ${test}; ${update}) ${genBlock(node.body)}`
  }

  if (node instanceof core.PrintStatement) {
    return `console.log(${genExp(node.argument)});`
  }

  if (node instanceof core.AssignStatement) {
    return `${genExp(node.target)} = ${genExp(node.source)};`
  }

  if (node instanceof core.ExpressionStatement) {
    return `${genExp(node.expression)};`
  }

  if (node instanceof core.Block) {
    return genBlock(node)
  }
}

function genBlock(block) {
  const stmts = block.statements.map(genStatement).filter(Boolean)
  if (stmts.length === 0) return "{}"
  return `{\n${stmts.map(s => `  ${s}`).join("\n")}\n}`
}

function genExp(node) {
  if (node instanceof core.IntLiteral) return String(node.value)
  if (node instanceof core.FloatLiteral) return String(node.value)
  if (node instanceof core.BoolLiteral) return String(node.value)
  if (node instanceof core.StringLiteral) return `"${node.value}"`
  if (node instanceof core.Identifier) return mangle(node.name)

  if (node instanceof core.ArrayExpression) {
    return `[${node.elements.map(genExp).join(", ")}]`
  }

  if (node instanceof core.BinaryExpression) {
    return `(${genExp(node.left)} ${node.op} ${genExp(node.right)})`
  }

  if (node instanceof core.UnaryExpression) {
    return `${node.op}${genExp(node.operand)}`
  }

  if (node instanceof core.CallExpression) {
    return `${mangle(node.callee)}(${node.args.map(genExp).join(", ")})`
  }

  if (node instanceof core.MethodCallExpression) {
    return `${genExp(node.object)}.${node.method}(${node.args.map(genExp).join(", ")})`
  }

  if (node instanceof core.MemberExpression) {
    return `${genExp(node.object)}.${node.property}`
  }

  if (node instanceof core.SubscriptExpression) {
    return `${genExp(node.array)}[${genExp(node.index)}]`
  }
}

function mangle(name) {
  return name
}

