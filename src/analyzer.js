import * as core from "./core.js"

class Context {
  constructor(parent = null, { inLoop = false, inFunction = false, functionReturnType = null } = {}) {
    this.parent = parent
    this.locals = new Map()
    this.inLoop = inLoop
    this.inFunction = inFunction
    this.functionReturnType = functionReturnType
  }

  add(name, entity) {
    if (this.locals.has(name)) throw new Error(`Identifier ${name} already declared`)
    this.locals.set(name, entity)
  }

  lookup(name) {
    if (this.locals.has(name)) return this.locals.get(name)
    if (this.parent) return this.parent.lookup(name)
    throw new Error(`Identifier ${name} not declared`)
  }

  child(extras = {}) {
    return new Context(this, {
      inLoop: this.inLoop,
      inFunction: this.inFunction,
      functionReturnType: this.functionReturnType,
      ...extras,
    })
  }
}

function typeToString(t) {
  if (!t) return "unknown"
  if (t instanceof core.ArrayType) return `[${typeToString(t.baseType)}]`
  return t.name
}

function typesMatch(a, b) {
  if (!a || !b) return true
  if (a === core.Type.ANY || b === core.Type.ANY) return true
  if (a instanceof core.ArrayType && b instanceof core.ArrayType) {
    return typesMatch(a.baseType, b.baseType)
  }
  return a === b || a.name === b.name
}

function mustBeBoolean(type, context) {
  if (!typesMatch(type, core.Type.BOOL))
    throw new Error(`Expected bool, got ${typeToString(type)}`)
}

function mustBeNumeric(type) {
  if (!typesMatch(type, core.Type.INT) && !typesMatch(type, core.Type.FLOAT))
    throw new Error(`Expected numeric type, got ${typeToString(type)}`)
}

function numericResult(left, right) {
  if (typesMatch(left, core.Type.FLOAT) || typesMatch(right, core.Type.FLOAT)) return core.Type.FLOAT
  return core.Type.INT
}

export default function analyze(program) {
  const globalContext = new Context()

  function analyzeStatement(node, context) {
    if (node instanceof core.FunDecl) return analyzeFunDecl(node, context)
    if (node instanceof core.VarDecl) return analyzeVarDecl(node, context)
    if (node instanceof core.ClassDecl) return analyzeClassDecl(node, context)
    if (node instanceof core.ReturnStatement) return analyzeReturn(node, context)
    if (node instanceof core.BreakStatement) return analyzeBreak(node, context)
    if (node instanceof core.ContinueStatement) return analyzeContinue(node, context)
    if (node instanceof core.IfStatement) return analyzeIf(node, context)
    if (node instanceof core.WhileStatement) return analyzeWhile(node, context)
    if (node instanceof core.ForStatement) return analyzeFor(node, context)
    if (node instanceof core.PrintStatement) return analyzePrint(node, context)
    if (node instanceof core.AssignStatement) return analyzeAssign(node, context)
    if (node instanceof core.ExpressionStatement) {
      node.expression = analyzeExp(node.expression, context)
      return node
    }
  }

  function analyzeFunDecl(node, context) {
    const paramTypes = node.params.map(p => p.type)
    const fun = { kind: "function", params: node.params, returnType: node.returnType, paramTypes }
    context.add(node.name, fun)
    const funContext = context.child({
      inFunction: true,
      functionReturnType: node.returnType,
    })
    for (const p of node.params) {
      funContext.add(p.name, { kind: "variable", type: p.type, constant: false })
    }
    node.body = analyzeBlock(node.body, funContext)
    return node
  }

  function analyzeVarDecl(node, context) {
    node.initializer = analyzeExp(node.initializer, context)
    const initType = node.initializer.type
    if (node.type) {
      if (!typesMatch(node.type, initType)) {
        throw new Error(
          `Type mismatch: declared ${typeToString(node.type)}, got ${typeToString(initType)}`
        )
      }
    } else {
      node.type = initType
    }
    context.add(node.name, { kind: "variable", type: node.type, constant: node.constant })
    return node
  }

  function analyzeClassDecl(node, context) {
    const classEntity = { kind: "class", name: node.name, members: new Map() }
    context.add(node.name, classEntity)
    const classContext = context.child()
    node.members = node.members.map(m => analyzeStatement(m, classContext))
    return node
  }

  function analyzeReturn(node, context) {
    if (!context.inFunction) throw new Error("return outside of function")
    if (node.expression) {
      node.expression = analyzeExp(node.expression, context)
      if (context.functionReturnType) {
        if (!typesMatch(context.functionReturnType, node.expression.type)) {
          throw new Error(
            `Return type mismatch: expected ${typeToString(context.functionReturnType)}, got ${typeToString(node.expression.type)}`
          )
        }
      }
    } else if (context.functionReturnType && !typesMatch(context.functionReturnType, core.Type.VOID)) {
      throw new Error(`Function must return a value of type ${typeToString(context.functionReturnType)}`)
    }
    return node
  }

  function analyzeBreak(node, context) {
    if (!context.inLoop) throw new Error("break outside of loop")
    return node
  }

  function analyzeContinue(node, context) {
    if (!context.inLoop) throw new Error("continue outside of loop")
    return node
  }

  function analyzeIf(node, context) {
    node.test = analyzeExp(node.test, context)
    mustBeBoolean(node.test.type)
    node.consequent = analyzeBlock(node.consequent, context)
    if (node.alternate) {
      node.alternate = node.alternate instanceof core.Block
        ? analyzeBlock(node.alternate, context)
        : analyzeStatement(node.alternate, context)
    }
    return node
  }

  function analyzeWhile(node, context) {
    node.test = analyzeExp(node.test, context)
    mustBeBoolean(node.test.type)
    node.body = analyzeBlock(node.body, context.child({ inLoop: true }))
    return node
  }

  function analyzeFor(node, context) {
    const forContext = context.child({ inLoop: true })
    if (node.init) node.init = analyzeStatement(node.init, forContext)
    if (node.test) {
      node.test = analyzeExp(node.test, forContext)
      mustBeBoolean(node.test.type)
    }
    if (node.update) node.update = analyzeExp(node.update, forContext)
    node.body = analyzeBlock(node.body, forContext)
    return node
  }

  function analyzePrint(node, context) {
    node.argument = analyzeExp(node.argument, context)
    return node
  }

  function analyzeAssign(node, context) {
    node.target = analyzeExp(node.target, context)
    node.source = analyzeExp(node.source, context)
    if (node.target instanceof core.Identifier) {
      const entity = context.lookup(node.target.name)
      if (entity.constant) throw new Error(`Assignment to constant ${node.target.name}`)
      if (!typesMatch(entity.type, node.source.type)) {
        throw new Error(
          `Type mismatch in assignment: ${typeToString(entity.type)} vs ${typeToString(node.source.type)}`
        )
      }
    }
    return node
  }

  function analyzeBlock(node, context) {
    const blockContext = context.child()
    node.statements = node.statements.map(s => analyzeStatement(s, blockContext))
    return node
  }

  function analyzeExp(node, context) {
    if (node instanceof core.IntLiteral) {
      node.type = core.Type.INT
      return node
    }
    if (node instanceof core.FloatLiteral) {
      node.type = core.Type.FLOAT
      return node
    }
    if (node instanceof core.BoolLiteral) {
      node.type = core.Type.BOOL
      return node
    }
    if (node instanceof core.StringLiteral) {
      node.type = core.Type.STRING
      return node
    }
    if (node instanceof core.Identifier) {
      const entity = context.lookup(node.name)
      node.type = entity.type
      return node
    }
    if (node instanceof core.ArrayExpression) {
      node.elements = node.elements.map(e => analyzeExp(e, context))
      const elementType = node.elements.length > 0 ? node.elements[0].type : core.Type.ANY
      node.type = new core.ArrayType(elementType)
      return node
    }
    if (node instanceof core.BinaryExpression) return analyzeBinary(node, context)
    if (node instanceof core.UnaryExpression) return analyzeUnary(node, context)
    if (node instanceof core.CallExpression) return analyzeCall(node, context)
    if (node instanceof core.MethodCallExpression) return analyzeMethodCall(node, context)
    if (node instanceof core.MemberExpression) {
      node.object = analyzeExp(node.object, context)
      node.type = core.Type.ANY
      return node
    }
    if (node instanceof core.SubscriptExpression) {
      node.array = analyzeExp(node.array, context)
      node.index = analyzeExp(node.index, context)
      if (!typesMatch(node.index.type, core.Type.INT)) {
        throw new Error(`Array index must be int, got ${typeToString(node.index.type)}`)
      }
      node.type = node.array.type instanceof core.ArrayType ? node.array.type.baseType : core.Type.ANY
      return node
    }
  }

  function analyzeBinary(node, context) {
    node.left = analyzeExp(node.left, context)
    node.right = analyzeExp(node.right, context)
    if (["||", "&&"].includes(node.op)) {
      mustBeBoolean(node.left.type)
      mustBeBoolean(node.right.type)
      node.type = core.Type.BOOL
    } else if (["==", "!="].includes(node.op)) {
      node.type = core.Type.BOOL
    } else if (["<", ">", "<=", ">="].includes(node.op)) {
      mustBeNumeric(node.left.type)
      mustBeNumeric(node.right.type)
      node.type = core.Type.BOOL
    } else if (["+", "-", "*", "/", "%"].includes(node.op)) {
      if (typesMatch(node.left.type, core.Type.STRING) && node.op === "+") {
        node.type = core.Type.STRING
      } else {
        mustBeNumeric(node.left.type)
        mustBeNumeric(node.right.type)
        node.type = numericResult(node.left.type, node.right.type)
      }
    }
    return node
  }

  function analyzeUnary(node, context) {
    node.operand = analyzeExp(node.operand, context)
    if (node.op === "!") {
      mustBeBoolean(node.operand.type)
      node.type = core.Type.BOOL
    } else if (node.op === "-") {
      mustBeNumeric(node.operand.type)
      node.type = node.operand.type
    }
    return node
  }

  function analyzeCall(node, context) {
    const entity = context.lookup(node.callee)
    if (entity.kind !== "function") throw new Error(`${node.callee} is not a function`)
    node.args = node.args.map(a => analyzeExp(a, context))
    if (node.args.length !== entity.params.length) {
      throw new Error(
        `${node.callee} expects ${entity.params.length} arguments, got ${node.args.length}`
      )
    }
    for (let i = 0; i < node.args.length; i++) {
      if (!typesMatch(entity.params[i].type, node.args[i].type)) {
        throw new Error(
          `Argument ${i + 1} type mismatch: expected ${typeToString(entity.params[i].type)}, got ${typeToString(node.args[i].type)}`
        )
      }
    }
    node.type = entity.returnType ?? core.Type.VOID
    return node
  }

  function analyzeMethodCall(node, context) {
    node.object = analyzeExp(node.object, context)
    node.args = node.args.map(a => analyzeExp(a, context))
    node.type = core.Type.ANY
    return node
  }

  const root = new core.Program(
    program.statements.map(s => analyzeStatement(s, globalContext))
  )
  return root
}

