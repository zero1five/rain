import React, { isValidElement } from 'react'
import ReactDOM from 'react-dom'
import invariant from 'invariant'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
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

function assignOpts(opt, key) {
  if (isFunction(opt)) {
    return [opt]
  } else if (isArray(opt)) {
    return opt
  } else {
    invariant(!opt, `[app.run] options.${key} must be a Function or Array`)
  }
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
    this.extraEnhancers = []
    this.listeners = []
  }

  onError(fn) {
    this.errorFn = fn
  }

  init({ initialState, onAction, extraEnhancers, onStateChange }) {
    this.epicMiddleware = createEpicMiddleware()
    this.middlewares.push(this.epicMiddleware)

    if (initialState) {
      this.initialState = initialState
    }

    if (onAction) {
      this.middlewares = [
        ...this.middlewares,
        ...assignOpts(onAction, 'onAction')
      ]
    }

    if (extraEnhancers) {
      this.extraEnhancers = assignOpts(extraEnhancers, 'extraEnhancers')
    }

    if (onStateChange) {
      this.listeners = assignOpts(onStateChange, 'onStateChange')
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

    const modelState = model.state || !model.state ? model.state : {}
    const reducer = (state = modelState, { type, payload }) => {
      type = type.slice(type.indexOf('/') + 1)
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

    const enhancer = compose(
      applyMiddleware(...this.middlewares),
      ...this.extraEnhancers
    )

    const store = createStore(
      combineReducers(this.appReducers),
      this.initialState,
      enhancer
    )
    this._store = store

    store.subscribe(() => {
      for (const listener of this.listeners) {
        listener(this._store.getState())
      }
    })

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
