import { createRequire } from "module"
const require = createRequire(import.meta.url)
const ohm = require("ohm-js")
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import * as core from "./core.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const grammar = ohm.grammar(readFileSync(join(__dirname, "fe.ohm"), "utf8"))

const semantics = grammar.createSemantics()

semantics.addOperation("ast", {
  Program(statements) {
    return new core.Program(statements.children.map(s => s.ast()))
  },

  FunDecl(_fun, id, _lp, params, _rp, _colonOpt, typeOpt, block) {
    const returnType = typeOpt.children.length > 0 ? typeOpt.children[0].ast() : null
    return new core.FunDecl(id.sourceString, params.ast(), returnType, block.ast())
  },

  Params(list) {
    return list.asIteration().children.map(p => p.ast())
  },

  Param(id, _colon, type) {
    return new core.Param(id.sourceString, type.ast())
  },

  VarDecl(_let, id, _colonOpt, typeOpt, _eq, exp, _semi) {
    const type = typeOpt.children.length > 0 ? typeOpt.children[0].ast() : null
    return new core.VarDecl(id.sourceString, type, exp.ast(), false)
  },

  ConstDecl(_const, id, _colonOpt, typeOpt, _eq, exp, _semi) {
    const type = typeOpt.children.length > 0 ? typeOpt.children[0].ast() : null
    return new core.VarDecl(id.sourceString, type, exp.ast(), true)
  },

  ClassDecl(_class, id, _lbraceOpt, membersOpt, _rbraceOpt) {
    const members =
      membersOpt.children.length > 0
        ? membersOpt.children[0].children.map(m => m.ast())
        : []
    return new core.ClassDecl(id.sourceString, members)
  },

  ClassMember(node) {
    return node.ast()
  },

  ReturnStmt(_return, expOpt, _semi) {
    return new core.ReturnStatement(
      expOpt.children.length > 0 ? expOpt.children[0].ast() : null
    )
  },

  BreakStmt(_break, _semi) {
    return new core.BreakStatement()
  },

  ContinueStmt(_continue, _semi) {
    return new core.ContinueStatement()
  },

  IfStmt(_if, _lp, test, _rp, consequent, _elseOpt, altOpt) {
    const alternate = altOpt.children.length > 0 ? altOpt.children[0].ast() : null
    return new core.IfStatement(test.ast(), consequent.ast(), alternate)
  },

  WhileStmt(_while, _lp, test, _rp, body) {
    return new core.WhileStatement(test.ast(), body.ast())
  },

  ForStmt(_for, _lp, init, testOpt, _semi, updateOpt, _rp, body) {
    const initAst = init.sourceString !== ";" ? init.ast() : null
    const testAst = testOpt.children.length > 0 ? testOpt.children[0].ast() : null
    const updateAst = updateOpt.children.length > 0 ? updateOpt.children[0].ast() : null
    return new core.ForStatement(initAst, testAst, updateAst, body.ast())
  },

  PrintStmt(_print, _lp, exp, _rp, _semi) {
    return new core.PrintStatement(exp.ast())
  },

  AssignStmt(target, _eq, source, _semi) {
    return new core.AssignStatement(target.ast(), source.ast())
  },

  ExprStmt(exp, _semi) {
    return new core.ExpressionStatement(exp.ast())
  },

  Block(_lbrace, statements, _rbrace) {
    return new core.Block(statements.children.map(s => s.ast()))
  },

  Type(node) {
    return node.ast()
  },

  PrimType(node) {
    const s = node.sourceString
    if (s === "int") return core.Type.INT
    if (s === "float") return core.Type.FLOAT
    if (s === "bool") return core.Type.BOOL
    if (s === "string") return core.Type.STRING
    if (s === "void") return core.Type.VOID
    return new core.Type(s)
  },

  ArrayType(_lb, type, _rb) {
    return new core.ArrayType(type.ast())
  },

  Exp_or(left, _op, right) {
    return new core.BinaryExpression("||", left.ast(), right.ast())
  },

  Exp1_and(left, _op, right) {
    return new core.BinaryExpression("&&", left.ast(), right.ast())
  },

  Exp2_rel(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },

  Exp3_add(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },

  Exp4_mul(left, op, right) {
    return new core.BinaryExpression(op.sourceString, left.ast(), right.ast())
  },

  Exp5_not(_bang, exp) {
    return new core.UnaryExpression("!", exp.ast())
  },

  Exp5_neg(_minus, exp) {
    return new core.UnaryExpression("-", exp.ast())
  },

  Exp6_methodCall(obj, _dot, method, _lp, args, _rp) {
    return new core.MethodCallExpression(obj.ast(), method.sourceString, args.ast())
  },

  Exp6_member(obj, _dot, property) {
    return new core.MemberExpression(obj.ast(), property.sourceString)
  },

  Exp6_subscript(arr, _lb, idx, _rb) {
    return new core.SubscriptExpression(arr.ast(), idx.ast())
  },

  Exp7_call(id, _lp, args, _rp) {
    return new core.CallExpression(id.sourceString, args.ast())
  },

  Exp7_paren(_lp, exp, _rp) {
    return exp.ast()
  },

  Exp7_array(_lb, elements, _rb) {
    return new core.ArrayExpression(elements.asIteration().children.map(e => e.ast()))
  },

  Args(list) {
    return list.asIteration().children.map(a => a.ast())
  },

  boollit(b) {
    return new core.BoolLiteral(b.sourceString === "true")
  },

  intlit(digits) {
    return new core.IntLiteral(Number(digits.sourceString))
  },

  floatlit(whole, _dot, frac) {
    return new core.FloatLiteral(Number(`${whole.sourceString}.${frac.sourceString}`))
  },

  strlit(_open, chars, _close) {
    return new core.StringLiteral(chars.sourceString)
  },

  id(_first, _rest) {
    return new core.Identifier(this.sourceString)
  },
})

export function parse(source) {
  const match = grammar.match(source)
  if (match.failed()) throw new Error(match.message)
  return semantics(match).ast()
}
