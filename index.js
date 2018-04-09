'use strict'

var choo = require('./choo')

function async (app) {
  app.start = choo.start.bind(app)
  app.mount = choo.mount.bind(app)
  app.toString = choo.toString.bind(app)
  app._prerender = choo._prerender.bind(app)
  return app
}

function resolve (result, cb) {
  if (result && typeof result.then === 'function') {
    return result.then(cb.bind(null, null)).catch(cb)
  }
  try {
    return cb(null, result)
  } catch (error) {
    return cb(error)
  }
}

function _catch (component, failsafe) {
  return function (state, emit) {
    var pResult = component(state, emit)
    return resolve(pResult, function (error, result) {
      if (error) return failsafe(error)(state, emit)
      return result
    })
  }
}

// function delay (ms) {
//   return new Promise(function (resolve) {
//     var id = setTimeout(function() {
//       clearTimeout(id)
//       resolve()
//     }, ms)
//   })
// }

// function timeout (component, loading, time) {
//   return function (state, emit) {
//     var resolved = false
//     return Promise.race([
//       component(state, emit).then(function (result) { resolved ? emit('render') : result }),
//       delay(time).then(function () { loading(state, emit) })
//     ]).finally(function () { resolved = true })
//   }
// }

module.exports = async
module.exports.catch = _catch
// module.exports.timeout = timeout
