export class Program {
  constructor(statements) {
    this.statements = statements
  }
}

export class FunDecl {
  constructor(name, params, returnType, body) {
    this.name = name
    this.params = params
    this.returnType = returnType
    this.body = body
  }
}

export class Param {
  constructor(name, type) {
    this.name = name
    this.type = type
  }
}

export class VarDecl {
  constructor(name, type, initializer, constant) {
    this.name = name
    this.type = type
    this.initializer = initializer
    this.constant = constant
  }
}

export class ClassDecl {
  constructor(name, members) {
    this.name = name
    this.members = members
  }
}

export class ReturnStatement {
  constructor(expression) {
    this.expression = expression
  }
}

export class BreakStatement {}

export class ContinueStatement {}

export class IfStatement {
  constructor(test, consequent, alternate) {
    this.test = test
    this.consequent = consequent
    this.alternate = alternate
  }
}

export class WhileStatement {
  constructor(test, body) {
    this.test = test
    this.body = body
  }
}

export class ForStatement {
  constructor(init, test, update, body) {
    this.init = init
    this.test = test
    this.update = update
    this.body = body
  }
}

export class PrintStatement {
  constructor(argument) {
    this.argument = argument
  }
}

export class AssignStatement {
  constructor(target, source) {
    this.target = target
    this.source = source
  }
}

export class ExpressionStatement {
  constructor(expression) {
    this.expression = expression
  }
}

export class Block {
  constructor(statements) {
    this.statements = statements
  }
}

export class BinaryExpression {
  constructor(op, left, right) {
    this.op = op
    this.left = left
    this.right = right
  }
}

export class UnaryExpression {
  constructor(op, operand) {
    this.op = op
    this.operand = operand
  }
}

export class CallExpression {
  constructor(callee, args) {
    this.callee = callee
    this.args = args
  }
}

export class MethodCallExpression {
  constructor(object, method, args) {
    this.object = object
    this.method = method
    this.args = args
  }
}

export class MemberExpression {
  constructor(object, property) {
    this.object = object
    this.property = property
  }
}

export class SubscriptExpression {
  constructor(array, index) {
    this.array = array
    this.index = index
  }
}

export class ArrayExpression {
  constructor(elements) {
    this.elements = elements
  }
}

export class Identifier {
  constructor(name) {
    this.name = name
  }
}

export class IntLiteral {
  constructor(value) {
    this.value = value
  }
}

export class FloatLiteral {
  constructor(value) {
    this.value = value
  }
}

export class BoolLiteral {
  constructor(value) {
    this.value = value
  }
}

export class StringLiteral {
  constructor(value) {
    this.value = value
  }
}

export class Type {
  constructor(name) {
    this.name = name
  }
  static INT = new Type("int")
  static FLOAT = new Type("float")
  static BOOL = new Type("bool")
  static STRING = new Type("string")
  static VOID = new Type("void")
  static ANY = new Type("any")
}

export class ArrayType {
  constructor(baseType) {
    this.baseType = baseType
  }
}

