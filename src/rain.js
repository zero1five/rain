import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider, connect as _connect } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import {
  fork,
  take,
  select,
  call,
  all,
  put,
  race,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

const produceNamespace = filename => {
  return filename.replace(/\.[j|t]s(x?)/, '')
}

function* puts(type, payload) {
  yield put({
    type,
    payload
  })
}

class Dva {
  constructor() {
    this.isDebug = false
    this.routingComponent = {}
    this.sagaMiddleware = {}
    this.appReducers = {}
    this.actionStategy = []
    this.effects = {}
    this.JsxElement = {}
    this.errorFn = void 666
    this._store = null
    this.moduleFilename = {}
  }

  onError(fn) {
    this.errorFn = fn
  }

  init() {
    this.sagaMiddleware = createSagaMiddleware(this.rootSaga)
  }

  *rootWatcher() {
    while (true) {
      const { type, ...others } = yield take(this.actionStategy)
      if (this.isDebug) {
        console.info(
          `[saga-action-types]:  '${type}' in file '${this.moduleFilename[type]}'`,
          'payload:',
          others
        )
      }
      const fn = this.effects[type]
      if (fn !== void 666) {
        try {
          yield call(
            fn,
            {
              fork,
              take,
              select,
              call,
              puts,
              put,
              race,
              takeEvery,
              takeLatest
            },
            others
          )
        } catch (e) {
          this.errorFn(e)
        }
      }
    }
  }

  *rootSaga() {
    yield all([fork(this.rootWatcher.bind(this))])
  }

  model(Module, filename) {
    const model = Module.default
    const namespace = produceNamespace(filename)
    if (namespace === void 666) {
      throw new SyntaxError('module needs a namespace')
    }
    if (this.appReducers[namespace]) {
      throw new SyntaxError(`module for name '${namespace}' exist`)
    }

    Object.keys(model.effects).forEach(key => {
      const partialKey = namespace + '/' + key
      this.actionStategy.push(partialKey)
      this.effects[partialKey] = model.effects[key]
      this.moduleFilename[partialKey] = filename
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
    const { isDebug } = options

    if (isDebug === true) this.isDebug = true
    const store = createStore(
      combineReducers(this.appReducers),
      applyMiddleware(this.sagaMiddleware)
    )
    this._store = store
    this.sagaMiddleware.run(this.rootSaga.bind(this))
    ReactDOM.render(
      <Provider store={store}>{this.JsxElement}</Provider>,
      DOMNode
    )
  }
}

export const connect = _connect
export default new Dva()
