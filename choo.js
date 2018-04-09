var scrollToAnchor = require('scroll-to-anchor')
var documentReady = require('document-ready')
var nanotiming = require('nanotiming')
var nanomorph = require('nanomorph')
var nanohref = require('nanohref')
var nanoraf = require('nanoraf')
var assert = require('assert')
var xtend = require('xtend')

var HISTORY_OBJECT = {}

function resolve (p, cb) {
  if (p && typeof p.then === 'function') {
    return p.then(cb)
  }
  return cb(p)
}

module.exports.start = function () {
  assert.equal(typeof window, 'object', 'choo.start: window was not found. .start() must be called in a browser, use .toString() if running in Node')

  var self = this
  if (this._historyEnabled) {
    this.emitter.prependListener(this._events.NAVIGATE, function () {
      self._matchRoute()
      if (self._loaded) {
        self.emitter.emit(self._events.RENDER)
        setTimeout(scrollToAnchor.bind(null, window.location.hash), 0)
      }
    })

    this.emitter.prependListener(this._events.POPSTATE, function () {
      self.emitter.emit(self._events.NAVIGATE)
    })

    this.emitter.prependListener(this._events.PUSHSTATE, function (href) {
      assert.equal(typeof href, 'string', 'events.pushState: href should be type string')
      window.history.pushState(HISTORY_OBJECT, null, href)
      self.emitter.emit(self._events.NAVIGATE)
    })

    this.emitter.prependListener(this._events.REPLACESTATE, function (href) {
      assert.equal(typeof href, 'string', 'events.replaceState: href should be type string')
      window.history.replaceState(HISTORY_OBJECT, null, href)
      self.emitter.emit(self._events.NAVIGATE)
    })

    window.onpopstate = function () {
      self.emitter.emit(self._events.POPSTATE)
    }

    if (self._hrefEnabled) {
      nanohref(function (location) {
        var href = location.href
        var currHref = window.location.href
        if (href === currHref) return
        self.emitter.emit(self._events.PUSHSTATE, href)
      })
    }
  }

  this._stores.forEach(function (initStore) {
    initStore(self.state)
  })

  this.emitter.prependListener(self._events.RENDER, nanoraf(function () {
    var renderTiming = nanotiming('choo.render')
    var pNewTree = self._prerender(self.state)
    resolve(pNewTree, function (newTree) {
      assert.ok(newTree, 'choo.render: no valid DOM node returned for location ' + self.state.href)

      assert.equal(self._tree.nodeName, newTree.nodeName, 'choo.render: The target node <' +
        self._tree.nodeName.toLowerCase() + '> is not the same type as the new node <' +
        newTree.nodeName.toLowerCase() + '>.')

      var morphTiming = nanotiming('choo.morph')
      nanomorph(self._tree, newTree)
      morphTiming()

      renderTiming()
    })
  }))

  this._matchRoute()
  var pTree = this._prerender(this.state)
  return resolve(pTree, function (tree) {
    self._tree = tree
    assert.ok(self._tree, 'choo.start: no valid DOM node returned for location ' + self.state.href)

    documentReady(function () {
      self.emitter.emit(self._events.DOMCONTENTLOADED)
      self._loaded = true
    })

    return self._tree
  })
}

module.exports.mount = function mount (selector) {
  if (typeof window !== 'object') {
    assert.ok(typeof selector === 'string', 'choo.mount: selector should be type String')
    this.selector = selector
    return this
  }

  assert.ok(typeof selector === 'string' || typeof selector === 'object', 'choo.mount: selector should be type String or HTMLElement')

  var self = this

  documentReady(function () {
    var renderTiming = nanotiming('choo.render')
    var pNewTree = self.start()
    resolve(pNewTree, function (newTree) {
      if (typeof selector === 'string') {
        self._tree = document.querySelector(selector)
      } else {
        self._tree = selector
      }

      assert.ok(self._tree, 'choo.mount: could not query selector: ' + selector)
      assert.equal(self._tree.nodeName, newTree.nodeName, 'choo.mount: The target node <' +
        self._tree.nodeName.toLowerCase() + '> is not the same type as the new node <' +
        newTree.nodeName.toLowerCase() + '>.')

      var morphTiming = nanotiming('choo.morph')
      nanomorph(self._tree, newTree)
      morphTiming()

      renderTiming()
    })
  })
}

module.exports.toString = function (location, state) {
  this.state = xtend(this.state, state || {})

  assert.notEqual(typeof window, 'object', 'choo.mount: window was found. .toString() must be called in Node, use .start() or .mount() if running in the browser')
  assert.equal(typeof location, 'string', 'choo.toString: location should be type string')
  assert.equal(typeof this.state, 'object', 'choo.toString: state should be type object')

  var self = this
  this._stores.forEach(function (initStore) {
    initStore(self.state)
  })

  this._matchRoute(location)
  var pHtml = this._prerender(this.state)
  return resolve(pHtml, function (html) {
    assert.ok(html, 'choo.toString: no valid value returned for the route ' + location)
    assert(!Array.isArray(html), 'choo.toString: return value was an array for the route ' + location)
    return typeof html.outerHTML === 'string' ? html.outerHTML : html.toString()
  })
}

module.exports._prerender = function (state) {
  var routeTiming = nanotiming("choo.prerender('" + state.route + "')")
  var pRes = this._handler(state, this.emit)
  return resolve(pRes, function (res) {
    routeTiming()
    return res
  })
}
