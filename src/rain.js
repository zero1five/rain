import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider, connect as _connect } from 'react-redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'

const produceNamespace = filename => {
  return filename.replace(/\.[j|t]s(x?)/, '')
}

class Rain {
  constructor() {
    this.routingComponent = {}
    this.epicMiddleware = {}
    this.appReducers = {}
    this.actionStategy = []
    this.epic = {}
    this.rootEpic = []
    this.JsxElement = {}
    this.errorFn = void 666
    this._store = null
    this.moduleFilename = {}
  }

  onError(fn) {
    this.errorFn = fn
  }

  init() {
    this.epicMiddleware = createEpicMiddleware()
  }

  model(Module, filename) {
    const model = Module.default
    const namespace = produceNamespace(filename)
    if (namespace === undefined) {
      throw new SyntaxError('module needs a namespace')
    }
    if (this.appReducers[namespace]) {
      throw new SyntaxError(`module for name '${namespace}' exist`)
    }

    Object.keys(model.epic).forEach(key => {
      const partialKey = namespace + '/' + key
      this.actionStategy.push(partialKey)
      this.epic[partialKey] = model.epic[key]
      this.moduleFilename[partialKey] = filename
      this.rootEpic.push(model.epic[key])
    })

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

  run(DOMNode, options) {
    const store = createStore(
      combineReducers(this.appReducers),
      applyMiddleware(this.epicMiddleware)
    )
    this._store = store
    this.epicMiddleware.run(this.rootEpic)
    ReactDOM.render(
      <Provider store={store}>{this.JsxElement}</Provider>,
      DOMNode
    )
  }
}

export const connect = _connect
export default new Rain()
