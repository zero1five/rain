import React from 'react'
import ReactDOM from 'react-dom'
import invariant from 'invariant'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { Provider, connect as _connect } from 'react-redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'
import { isFunction, isString, isArray } from 'util'
import { map } from 'rxjs/operators'
import { cloneDeep } from 'lodash'
import Plugin from './Plugin'
export { default as createLoading } from './createLoading'

const produceNamespace = filename => {
  return filename.replace(/\.[j|t]s(x?)/, '')
}

function isHTMLElement(node) {
  return (
    typeof node === 'object' && node !== null && node.nodeType && node.nodeName
  )
}

function assignOpts(opt, source, key) {
  if (isFunction(opt)) {
    return [...source, opt]
  } else if (isArray(opt)) {
    return [...source, ...opt]
  } else {
    invariant(!opt, `[app.run] options.${key} must be a Function or Array`)
  }
}

function wrapEpic([fn /* epic */, namespace /* model name */, partialKey]) {
  return (action$, state$) => {
    const source$ = action$.pipe(
      map(action => ({
        ...action,
        type: action.internalType
          ? action.type
          : action.type.slice(action.type.indexOf('/') + 1)
      }))
    )

    return fn(source$, state$).pipe(
      map(action => ({
        ...action,
        type: action.internalType ? action.type : namespace + '/' + action.type
      }))
    )
  }
}

class Rain {
  constructor() {
    this.routingComponent = {}
    this.epicMiddleware = {}
    this.appReducers = {}
    this.rootEpic = []
    this.JsxElement = null
    this.errorFn = null
    this._store = null
    this.moduleFilename = {}

    this.initialState = {}
    this.middlewares = []
    this.plugins = new Plugin()
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
      this.middlewares = assignOpts(onAction, this.middlewares, 'onAction')
    }

    if (extraEnhancers) {
      this.extraEnhancers = assignOpts(
        extraEnhancers,
        this.extraEnhancers,
        'extraEnhancers'
      )
    }

    if (onStateChange) {
      this.listeners = assignOpts(
        onStateChange,
        this.listeners,
        'onStateChange'
      )
    }
  }

  use(plugin) {
    this.plugins.use(plugin)
  }

  model(Module, filename) {
    invariant(
      !this.appReducers[namespace],
      `[app.model] module for name '${namespace}' exist`
    )

    invariant(filename, `[app.model] module needs filename`)

    const model = cloneDeep(Module.default || Module)
    const namespace = produceNamespace(filename)

    if (model.epic) {
      Object.keys(model.epic).forEach(key => {
        invariant(
          /Epic$/.test(key),
          `[app.epic] every epic must be suffix 'Epic'. debug to [${namespace}.${key}]`
        )

        const partialKey = namespace + '/' + key
        const wrapper = wrapEpic([model.epic[key], namespace, partialKey])

        this.moduleFilename[partialKey] = filename
        this.rootEpic.push([wrapper, namespace, partialKey])
      })
    }

    if (model.reducer) {
      Object.keys(model.reducer).forEach(key => {
        const func = model.reducer[key]
        model.reducer[namespace + '/' + key] = func
        delete model.reducer[key]
      })
    }

    const modelState = model.state || !model.state ? model.state : {}
    const reducer = (state = modelState, { type, payload }) => {
      if (model.reducer) {
        const func = model.reducer[type]
        if (func) {
          return func(state, { type, payload })
        }
      }
      return state
    }
    this.appReducers[namespace] = reducer
  }

  router(RouterModel) {
    this.JsxElement = RouterModel
  }

  run(node, options) {
    if (isString(node)) {
      node = document.querySelector(node)
      invariant(node, `[app.run] react-dom container ${node || ''} not found`)
    }

    invariant(
      !node || isHTMLElement(node),
      `[app.run] react-dom container should be HTMLElement`
    )

    invariant(
      this.JsxElement && isFunction(this.JsxElement),
      `[app.run] router not or failed register`
    )

    const { plugins, epicMiddleware } = this
    const onEnhancers = plugins.get('extraEnhancers')
    const extraReducers = plugins.get('extraReducers')
    const onEpic = plugins.get('onEpic')

    const enhancer = compose(
      applyMiddleware(...this.middlewares),
      ...this.extraEnhancers.concat(onEnhancers)
    )

    const store = createStore(
      combineReducers({ ...this.appReducers, ...extraReducers }),
      this.initialState,
      enhancer
    )

    this._store = store

    store.subscribe(() => {
      for (const listener of this.listeners) {
        listener(this._store.getState())
      }
    })

    const onEpicWithCompose = compose(...onEpic)

    const root = this.rootEpic.length
      ? combineEpics(
          ...this.rootEpic
            .map(x => x.concat([this._store.dispatch]))
            .map(onEpicWithCompose)
            .map(([x]) => x)
        )
      : combineEpics()

    // epicMiddleware.run 相当于 subject.next(root)
    ;[root].forEach(epicMiddleware.run)

    if (node) {
      ReactDOM.render(
        <Provider store={store}>{this.JsxElement}</Provider>,
        node
      )
    } else {
      return getProvider(store, this, this.JsxElement)
    }
  }
}

function getProvider(store, app, router) {
  const Root = extraProps => (
    <Provider store={store}>
      {router({ app, history: app._history, ...extraProps })}
    </Provider>
  )
  return Root
}

export const connect = _connect
export default (opts = {}) => {
  const rain = new Rain()
  rain.init(opts)
  return rain
}
