'use strict'

var test = require('blue-tape')
var sinon = require('sinon')
var Promise = require('any-promise')
var isPromise = require('is-promise')

var until = require('../index')
var noop = function () { return true }

test('module exports a function', function (t) {
  t.plan(1)
  t.equal(typeof until, 'function', 'is of type function')
  t.end()
})

test('throws an error on invalid first argument', function (t) {
  const errRegex = /predicate function/i
  t.plan(4)
  t.throws(function () { until() }, errRegex)
  t.throws(function () { until(null, noop) }, errRegex)
  t.throws(function () { until(1, noop) }, errRegex)
  t.throws(function () { until({}, noop) }, errRegex)
  t.end()
})

test('throws an error on invalid second argument', function (t) {
  const errRegex = /transforming function/i
  t.plan(4)
  t.throws(function () { until(noop) }, errRegex)
  t.throws(function () { until(noop, null) }, errRegex)
  t.throws(function () { until(noop, 1) }, errRegex)
  t.throws(function () { until(noop, {}) }, errRegex)
  t.end()
})

test('exported function returns a function', function (t) {
  t.plan(1)
  t.equal(typeof until(noop, noop), 'function', 'is of type function')
  t.end()
})

test('returned function returns a promise', function (t) {
  t.plan(1)
  t.ok(isPromise(until(noop, noop)(true)), 'is a promise')
  t.end()
})

test('works with promised input values', function (t) {
  var predicate = sinon.spy(function (c) {
    return c > 1
  })
  var transform = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c + 1) }, 1)
    })
  })
  var input = new Promise(function (resolve) { resolve(0) }, 1)
  return runSimilarTest(t, predicate, transform, input)
})

test('works with non-promised input values', function (t) {
  var predicate = sinon.spy(function (c) {
    return c > 1
  })
  var transform = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c + 1) }, 1)
    })
  })
  return runSimilarTest(t, predicate, transform)
})

test('works with promised predicates', function (t) {
  var predicate = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c > 1) }, 1)
    })
  })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runSimilarTest(t, predicate, transform)
})

test('works with non-promised predicates', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runSimilarTest(t, predicate, transform)
})

test('works with promised transforms', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c + 1) }, 1)
    })
  })
  return runSimilarTest(t, predicate, transform)
})

test('works with non-promised transforms', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runSimilarTest(t, predicate, transform)
})

function runSimilarTest (t, predicate, transform, input) {
  return until(predicate, transform)(input || 0)
    .then(function (result) {
      t.equal(result, 2, 'result is correct')

      t.equal(predicate.callCount, 3, 'predicate called the correct number of times')
      t.equal(predicate.getCall(0).args[0], 0, 'correct argument on first call to predicate')
      t.equal(predicate.getCall(1).args[0], 1, 'correct argument on second call to predicate')
      t.equal(predicate.getCall(2).args[0], 2, 'correct argument on third call to predicate')

      t.equal(transform.callCount, 2, 'transform called the correct number of times')
      t.equal(transform.getCall(0).args[0], 0, 'correct argument on first call to transform')
      t.equal(transform.getCall(1).args[0], 1, 'correct argument on second call to transform')
    })
}