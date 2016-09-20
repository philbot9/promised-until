'use strict'

var Promise = require('any-promise')

module.exports = function (predicate, transform) {
  if (!predicate || typeof predicate !== 'function') {
    throw new Error('First argument must be a predicate function. Instead got ' + predicate)
  }

  if (!transform || typeof transform !== 'function') {
    throw new Error('Second argument must be a transforming function. Instead got ' + transform)
  }

  return function transformUntil (value) {
    return Promise.resolve(value)
      .then(function (resolvedValue) {
        return applyPredicate(resolvedValue)
          .then(function (predicateResult) {
            return Boolean(predicateResult)
              ? resolvedValue
              : transformUntil(transform(resolvedValue))
          })
      })
  }

  function applyPredicate (val) {
    return Promise.resolve(predicate(val))
  }
}
