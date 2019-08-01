import invariant from 'invariant'
import { startWith, endWith, take, filter, map, tap } from 'rxjs/operators'

const debounce = (fn, wait) => {
  let timer = null
  return function(...args) {
    const ctx = this
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => fn.apply(ctx, args), wait)
  }
}

const SHOW = '@@DVA_LOADING/SHOW'
const HIDE = '@@DVA_LOADING/HIDE'
const NAMESPACE = 'loading'

function createLoading(opts = {}) {
  const namespace = opts.namespace || NAMESPACE

  const { only = [], except = [] } = opts
  invariant(
    !(only.length > 0 && except.length > 0),
    'It is ambiguous to configurate `only` and `except` items at the same time.'
  )

  const initialState = {
    global: false,
    models: {},
    effects: {}
  }

  function extraEnhancers() {
    const actionWithLoading = []
    const endCaller = (action, store) => {
      // 如果loading中所有的action一样，则说明处于Hide阶段，触发响应的action
      const idx = actionWithLoading.findIndex(
        x => x.internalType === action.type
      )
      if (actionWithLoading.length >= 1 && idx > -1) {
        const endAction = actionWithLoading.splice(idx, 1)[0]
        store.dispatch(endAction)
      }
    }
    const debounceEnd = debounce(endCaller, 1)

    return createStore => (reducer, initialState, enhancer) => {
      const store = createStore(reducer, initialState, enhancer)
      function dispatch(action) {
        console.log('action: ', action)
        console.log()
        if (
          (action.type === SHOW || action.type === HIDE) &&
          only.indexOf(action.internalType) !== -1
        ) {
          actionWithLoading.push(action)
          debounceEnd(action, store)
        } else {
          const idx = actionWithLoading.findIndex(
            x => x.internalType === action.type
          )
          if (idx > -1) {
            const endAction = actionWithLoading.splice(idx, 1)[0]
            store.dispatch(endAction)
          }
          const res = store.dispatch(action)
          return res
        }
      }

      return { ...store, dispatch }
    }
  }

  const extraReducers = {
    [namespace](state = initialState, { type, payload }) {
      const { namespace, actionType } = payload || {}
      let ret

      switch (type) {
        case SHOW:
          ret = {
            ...state,
            global: true,
            models: { ...state.models, [namespace]: true },
            effects: { ...state.effects, [actionType]: true }
          }
          break
        case HIDE:
          const effects = { ...state.effects, [actionType]: false }
          const models = {
            ...state.models,
            [namespace]: Object.keys(effects).some(actionType => {
              const _namespace = actionType.split('/')[0]
              if (_namespace !== namespace) return false
              return effects[actionType]
            })
          }
          const global = Object.keys(models).some(namespace => {
            return models[namespace]
          })
          ret = {
            ...state,
            global,
            models,
            effects
          }
          break
        default:
          ret = state
          break
      }
      return ret
    }
  }

  function onEpic([fn /* epic */, namespace /* model name */, partialKey]) {
    const filterSpec$ = filter(
      ({ type: actionType }) =>
        ((only.length === 0 && except.length === 0) ||
          (only.length > 0 && only.indexOf(actionType) !== -1) ||
          (except.length > 0 && except.indexOf(actionType) === -1)) &&
        (actionType !== SHOW && actionType !== HIDE)
    )

    return [
      action$ => {
        const source$ = action$.pipe(
          filterSpec$,
          take(1)
        )

        const actionType = partialKey.replace(/Epic/, '')
        const payload = { actionType: partialKey, namespace }
        const result$ = fn(source$).pipe(
          startWith({
            payload,
            type: SHOW,
            internalType: actionType
          }),
          endWith({
            payload,
            type: HIDE,
            internalType: actionType
          })
        )

        return result$
      },
      namespace,
      partialKey
    ]
  }

  return {
    extraReducers,
    extraEnhancers,
    onEpic
  }
}

export default createLoading
