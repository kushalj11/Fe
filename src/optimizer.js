import * as core from "./core.js"

export default function optimize(program) {
  return optimizeNode(program)
}

function optimizeNode(node) {
  if (node instanceof core.Program) {
    return new core.Program(node.statements.map(optimizeNode))
  }

  if (node instanceof core.Block) {
    const stmts = node.statements.map(optimizeNode).filter(s => s !== null)
    return new core.Block(stmts)
  }

  if (node instanceof core.FunDecl) {
    return new core.FunDecl(node.name, node.params, node.returnType, optimizeNode(node.body))
  }

  if (node instanceof core.VarDecl) {
    const init = optimizeNode(node.initializer)
    return new core.VarDecl(node.name, node.type, init, node.constant)
  }

  if (node instanceof core.ClassDecl) {
    return new core.ClassDecl(node.name, node.members.map(optimizeNode))
  }

  if (node instanceof core.ReturnStatement) {
    return new core.ReturnStatement(node.expression ? optimizeNode(node.expression) : null)
  }

  if (node instanceof core.BreakStatement) return node
  if (node instanceof core.ContinueStatement) return node

  if (node instanceof core.IfStatement) {
    const test = optimizeNode(node.test)
    if (test instanceof core.BoolLiteral) {
      return test.value
        ? optimizeNode(node.consequent)
        : node.alternate
          ? optimizeNode(node.alternate)
          : null
    }
    return new core.IfStatement(
      test,
      optimizeNode(node.consequent),
      node.alternate ? optimizeNode(node.alternate) : null
    )
  }

  if (node instanceof core.WhileStatement) {
    const test = optimizeNode(node.test)
    if (test instanceof core.BoolLiteral && !test.value) return null
    return new core.WhileStatement(test, optimizeNode(node.body))
  }

  if (node instanceof core.ForStatement) {
    return new core.ForStatement(
      node.init ? optimizeNode(node.init) : null,
      node.test ? optimizeNode(node.test) : null,
      node.update ? optimizeNode(node.update) : null,
      optimizeNode(node.body)
    )
  }

  if (node instanceof core.PrintStatement) {
    return new core.PrintStatement(optimizeNode(node.argument))
  }

  if (node instanceof core.AssignStatement) {
    return new core.AssignStatement(optimizeNode(node.target), optimizeNode(node.source))
  }

  if (node instanceof core.ExpressionStatement) {
    return new core.ExpressionStatement(optimizeNode(node.expression))
  }

  if (node instanceof core.BinaryExpression) {
    const left = optimizeNode(node.left)
    const right = optimizeNode(node.right)

    // Constant folding for arithmetic
    if (left instanceof core.IntLiteral && right instanceof core.IntLiteral) {
      switch (node.op) {
        case "+": return withType(new core.IntLiteral(left.value + right.value), node.type)
        case "-": return withType(new core.IntLiteral(left.value - right.value), node.type)
        case "*": return withType(new core.IntLiteral(left.value * right.value), node.type)
        case "/":
          if (right.value !== 0) return withType(new core.IntLiteral(Math.trunc(left.value / right.value)), node.type)
          break
        case "%":
          if (right.value !== 0) return withType(new core.IntLiteral(left.value % right.value), node.type)
          break
        case "<": return withType(new core.BoolLiteral(left.value < right.value), node.type)
        case ">": return withType(new core.BoolLiteral(left.value > right.value), node.type)
        case "<=": return withType(new core.BoolLiteral(left.value <= right.value), node.type)
        case ">=": return withType(new core.BoolLiteral(left.value >= right.value), node.type)
        case "==": return withType(new core.BoolLiteral(left.value === right.value), node.type)
        case "!=": return withType(new core.BoolLiteral(left.value !== right.value), node.type)
      }
    }

    // Constant folding for floats
    if (
      (left instanceof core.FloatLiteral || left instanceof core.IntLiteral) &&
      (right instanceof core.FloatLiteral || right instanceof core.IntLiteral)
    ) {
      const l = left.value, r = right.value
      switch (node.op) {
        case "+": return withType(new core.FloatLiteral(l + r), node.type)
        case "-": return withType(new core.FloatLiteral(l - r), node.type)
        case "*": return withType(new core.FloatLiteral(l * r), node.type)
        case "/": if (r !== 0) return withType(new core.FloatLiteral(l / r), node.type); break
        case "<": return withType(new core.BoolLiteral(l < r), node.type)
        case ">": return withType(new core.BoolLiteral(l > r), node.type)
        case "<=": return withType(new core.BoolLiteral(l <= r), node.type)
        case ">=": return withType(new core.BoolLiteral(l >= r), node.type)
        case "==": return withType(new core.BoolLiteral(l === r), node.type)
        case "!=": return withType(new core.BoolLiteral(l !== r), node.type)
      }
    }

    // Boolean constant folding
    if (left instanceof core.BoolLiteral && right instanceof core.BoolLiteral) {
      if (node.op === "&&") return withType(new core.BoolLiteral(left.value && right.value), node.type)
      if (node.op === "||") return withType(new core.BoolLiteral(left.value || right.value), node.type)
      if (node.op === "==") return withType(new core.BoolLiteral(left.value === right.value), node.type)
      if (node.op === "!=") return withType(new core.BoolLiteral(left.value !== right.value), node.type)
    }

    // Strength reduction: x * 1 => x, x + 0 => x, x - 0 => x
    if (right instanceof core.IntLiteral || right instanceof core.FloatLiteral) {
      if ((node.op === "*" || node.op === "/") && right.value === 1) return left
      if ((node.op === "+" || node.op === "-") && right.value === 0) return left
      if (node.op === "*" && right.value === 0) return withType(new core.IntLiteral(0), node.type)
    }
    if (left instanceof core.IntLiteral || left instanceof core.FloatLiteral) {
      if (node.op === "*" && left.value === 1) return right
      if (node.op === "+" && left.value === 0) return right
      if (node.op === "*" && left.value === 0) return withType(new core.IntLiteral(0), node.type)
    }

    const result = new core.BinaryExpression(node.op, left, right)
    result.type = node.type
    return result
  }

  if (node instanceof core.UnaryExpression) {
    const operand = optimizeNode(node.operand)
    if (node.op === "-" && operand instanceof core.IntLiteral) {
      return withType(new core.IntLiteral(-operand.value), node.type)
    }
    if (node.op === "-" && operand instanceof core.FloatLiteral) {
      return withType(new core.FloatLiteral(-operand.value), node.type)
    }
    if (node.op === "!" && operand instanceof core.BoolLiteral) {
      return withType(new core.BoolLiteral(!operand.value), node.type)
    }
    const result = new core.UnaryExpression(node.op, operand)
    result.type = node.type
    return result
  }

  if (node instanceof core.CallExpression) {
    const result = new core.CallExpression(node.callee, node.args.map(optimizeNode))
    result.type = node.type
    return result
  }

  if (node instanceof core.MethodCallExpression) {
    const result = new core.MethodCallExpression(
      optimizeNode(node.object),
      node.method,
      node.args.map(optimizeNode)
    )
    result.type = node.type
    return result
  }

  if (node instanceof core.MemberExpression) {
    const result = new core.MemberExpression(optimizeNode(node.object), node.property)
    result.type = node.type
    return result
  }

  if (node instanceof core.SubscriptExpression) {
    const result = new core.SubscriptExpression(optimizeNode(node.array), optimizeNode(node.index))
    result.type = node.type
    return result
  }

  if (node instanceof core.ArrayExpression) {
    const result = new core.ArrayExpression(node.elements.map(optimizeNode))
    result.type = node.type
    return result
  }

  return node
}

function withType(node, type) {
  node.type = type
  return node
}

