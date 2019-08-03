import invariant from 'invariant'
import { filter } from 'rxjs/operators'

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
    return createStore => (reducer, initialState, enhancer) => {
      const store = createStore(reducer, initialState, enhancer)
      function dispatch(action) {
        console.log('action: ', action)
        const res = store.dispatch(action)
        return res
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

  function onEpic([
    fn /* epic */,
    namespace /* model name */,
    partialKey,
    dispatch
  ]) {
    const filterSpec$ = filter(
      ({ type: actionType }) =>
        (only.length === 0 && except.length === 0) ||
        (only.length > 0 && only.indexOf(actionType) !== -1) ||
        (except.length > 0 && except.indexOf(actionType) === -1)
    )

    return [
      (action$, state$) => {
        const actionType = partialKey.replace(/Epic/, '')
        const payload = { actionType: partialKey, namespace }

        const source$ = action$.pipe(filterSpec$)

        source$.subscribe(action => {
          if (
            ((only.length === 0 && except.length === 0) ||
              (only.length > 0 && only.indexOf(actionType) !== -1) ||
              (except.length > 0 && except.indexOf(actionType) === -1)) &&
            (action.type !== SHOW || action.type !== HIDE)
          ) {
            dispatch({
              payload,
              type: SHOW,
              internalType: actionType
            })
          }
        })

        const result$ = fn(source$, state$)

        result$.subscribe(action => {
          if (
            ((only.length === 0 && except.length === 0) ||
              (only.length > 0 && only.indexOf(actionType) !== -1) ||
              (except.length > 0 && except.indexOf(actionType) === -1)) &&
            (action.type !== SHOW || action.type !== HIDE)
          ) {
            dispatch({
              payload,
              type: HIDE,
              internalType: actionType
            })
          }
        })

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
