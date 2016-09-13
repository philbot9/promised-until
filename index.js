'use strict'

var Promise = require('any-promise')
var isPromise = require('is-promise')

module.exports = function (predicate, transform) {
  if (!predicate || typeof predicate !== 'function') {
    throw new Error('First argument must be a predicate function. Instead got ' + predicate)
  }

  if (!transform || typeof transform !== 'function') {
    throw new Error('Second argument must be a transforming function. Instead got ' + transform)
  }

  return function transformUntil (value) {
    return resolveValue(value)
      .then(function (resolvedValue) {
        return applyPredicate(resolvedValue)
          .then(function (predicateResult) {
            return Boolean(predicateResult)
              ? Promise.resolve(resolvedValue)
              : transformUntil(transform(resolvedValue))
          })
      })
  }

  function resolveValue (val) {
    return isPromise(val) ? val : Promise.resolve(val)
  }

  function applyPredicate (val) {
    return resolveValue(predicate(val))
  }
}
