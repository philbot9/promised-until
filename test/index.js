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
  var errRegex = /predicate function/i
  t.plan(4)
  t.throws(function () { until() }, errRegex)
  t.throws(function () { until(null, noop) }, errRegex)
  t.throws(function () { until(1, noop) }, errRegex)
  t.throws(function () { until({}, noop) }, errRegex)
  t.end()
})

test('throws an error on invalid second argument', function (t) {
  var errRegex = /transforming function/i
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

test('resolves immediately if predicate satisfies the first time', function (t) {
  var predicate = sinon.spy(function (c) { return true })
  var transform = sinon.spy(function (c) { return c + 1 })

  return until(predicate, transform)(0)
    .then(function (c) {
      t.equal(c, 0, 'resulting value is unchanged')
      t.equal(predicate.callCount, 1, 'predicate called once')
      t.equal(predicate.getCall(0).args[0], 0, 'predicate called with correct argument')
      t.equal(transform.callCount, 0, 'transform is never called')
    })
})

test('resolves after one transformation', function (t) {
  var predicate = sinon.spy(function (c) { return c > 0 })
  var transform = sinon.spy(function (c) { return c + 1 })

  return until(predicate, transform)(0)
    .then(function (c) {
      t.equal(c, 1, 'resulting value is correct')
      t.equal(predicate.callCount, 2, 'predicate called twice')
      t.equal(predicate.getCall(0).args[0], 0, 'predicate called with correct argument')
      t.equal(predicate.getCall(1).args[0], 1, 'predicate called with correct argument')

      t.equal(transform.callCount, 1, 'transform called once')
      t.equal(transform.getCall(0).args[0], 0, 'transform called with correct argument')
    })
})

test('resolves after multiple transformations', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runBasicTest(t, predicate, transform, 0)
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
  return runBasicTest(t, predicate, transform, input)
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
  return runBasicTest(t, predicate, transform)
})

test('works with promised predicates', function (t) {
  var predicate = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c > 1) }, 1)
    })
  })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runBasicTest(t, predicate, transform)
})

test('works with non-promised predicates', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runBasicTest(t, predicate, transform)
})

test('works with promised transforms', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(c + 1) }, 1)
    })
  })
  return runBasicTest(t, predicate, transform)
})

test('works with non-promised transforms', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1 })
  return runBasicTest(t, predicate, transform)
})

test('promise rejects if value is rejected', function (t) {
  var predicate = sinon.spy(function (c) { return c > 1 })
  var transform = sinon.spy(function (c) { return c + 1})
  var errorMsg = 'promise rejected'
  var value = Promise.reject(errorMsg)

  return until(predicate, transform)(value)
    .then(function () { t.fail('promise should not resolve') })
    .catch(function (err) {
      t.ok(err, 'promise rejects with an error')
      t.equal(err, errorMsg, 'error message is correct')
      t.equal(predicate.callCount, 0, 'predicate is never called')
      t.equal(transform.callCount, 0, 'transform is never called')
    })
})

test('promise rejects if predicate is rejected', function (t) {
  var errorMsg = 'promise rejected'
  var predicate = sinon.spy(function (c) {
    if (c < 1) {
      return Promise.resolve(false)
    } else {
      return Promise.reject(errorMsg)
    }
  })
  var transform = sinon.spy(function (c) { return c + 1})

  return until(predicate, transform)(0)
    .then(function () { t.fail('promise should not resolve') })
    .catch(function (err) {
      t.ok(err, 'promise rejects with an error')
      t.equal(err, errorMsg, 'error message is correct')
      t.equal(predicate.callCount, 2, 'predicate is called the correct number of times')
      t.equal(transform.callCount, 1, 'transform is called the correct number of times')
    })
})

test('promise rejects if transform is rejected', function (t) {
  var errorMsg = 'promise rejected'
  var predicate = sinon.spy(function (c) { return c > 1})
  var transform = sinon.spy(function (c) {
    if (c < 1) {
      return Promise.resolve(c + 1)
    } else {
      return Promise.reject(errorMsg)
    }
  })

  return until(predicate, transform)(0)
    .then(function () { t.fail('promise should not resolve') })
    .catch(function (err) {
      t.ok(err, 'promise rejects with an error')
      t.equal(err, errorMsg, 'error message is correct')
      t.equal(predicate.callCount, 2, 'predicate is called the correct number of times')
      t.equal(transform.callCount, 2, 'transform is called the correct number of times')
    })
})

function runBasicTest (t, predicate, transform, input) {
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
