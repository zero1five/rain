import React, { isValidElement } from 'react'
import ReactDOM from 'react-dom'
import invariant from 'invariant'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider, connect as _connect } from 'react-redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'
import { isFunction, isString, isArray } from 'util'

const produceNamespace = filename => {
  return filename.replace(/\.[j|t]s(x?)/, '')
}

function isHTMLElement(node) {
  return (
    typeof node === 'object' && node !== null && node.nodeType && node.nodeName
  )
}

class Rain {
  constructor() {
    this.routingComponent = {}
    this.epicMiddleware = {}
    this.appReducers = {}
    this.actionStategy = []
    this.epic = {}
    this.rootEpic = []
    this.JsxElement = null
    this.errorFn = null
    this._store = null
    this.moduleFilename = {}
    this.initialState = {}
    this.middlewares = []
  }

  onError(fn) {
    this.errorFn = fn
  }

  init({ initialState = {}, onAction }) {
    this.epicMiddleware = createEpicMiddleware()
    this.initialState = initialState
    this.middlewares.push(this.epicMiddleware)

    if (onAction) {
      if (isFunction(onAction)) {
        this.middlewares.push(onAction)
      } else if (isArray(onAction)) {
        this.middlewares = [...this.middlewares, ...onAction]
      } else {
        invariant(
          onAction,
          `[app.run] options.onAction must be a Function or Array`
        )
      }
    }
  }

  model(Module, filename) {
    const model = Module.default || Module
    const namespace = produceNamespace(filename)

    invariant(namespace, `[app.model] module needs a namespace`)
    invariant(
      !this.appReducers[namespace],
      `[app.model] module for name '${namespace}' exist`
    )

    if (model.epic) {
      Object.keys(model.epic).forEach(key => {
        const partialKey = namespace + '/' + key
        this.actionStategy.push(partialKey)
        this.epic[partialKey] = model.epic[key]
        this.moduleFilename[partialKey] = filename
        this.rootEpic.push(model.epic[key])
      })
    }

    const modelState = model.state || {}
    const reducer = (state = modelState, { type, payload }) => {
      const func = model.reducer[type]
      if (func) {
        return func(state, { type, payload })
      }
      return state
    }
    this.appReducers[namespace] = reducer
  }

  router(RouterModel) {
    this.JsxElement =
      typeof RouterModel === 'function'
        ? RouterModel(this.routingComponent)
        : RouterModel
  }

  run(node = '#root', options) {
    if (isString) {
      node = document.querySelector(node)
      invariant(node, `[app.run] react-dom container ${node || ''} not found`)
    }

    invariant(
      !node || isHTMLElement(node),
      `[app.run] react-dom container should be HTMLElement`
    )

    invariant(
      isValidElement(this.JsxElement),
      `[app.run] router not or failed register`
    )

    const store = createStore(
      combineReducers(this.appReducers),
      this.initialState,
      applyMiddleware(...this.middlewares)
    )

    this._store = store

    const root = this.rootEpic.length
      ? combineEpics(...this.rootEpic)
      : combineEpics()
    this.epicMiddleware.run(root)

    ReactDOM.render(<Provider store={store}>{this.JsxElement}</Provider>, node)
  }
}

export const connect = _connect
export default (opts = {}) => {
  const rain = new Rain()
  rain.init(opts)
  return rain
}
