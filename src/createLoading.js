import invariant from 'invariant'
import { startWith, endWith, take, filter, map } from 'rxjs/operators'
import { of } from 'rxjs'

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

  function extraEnhancers() {
    const actionWithLoading = []
    return createStore => (reducer, initialState, enhancer) => {
      const store = createStore(reducer, initialState, enhancer)
      function dispatch(action) {
        if (action.type === SHOW || action.type === HIDE) {
          actionWithLoading.push(action)
          return
        } else {
          const loading = actionWithLoading.find(
            x => x.internalType === action.type
          )
          if (loading) {
            store.dispatch(loading)
            actionWithLoading.length = 0
          }
          const res = store.dispatch(action)
          return res
        }
      }
      return { ...store, dispatch }
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

        const result$ = fn(source$).pipe(
          startWith({
            type: SHOW,
            internalType: partialKey.replace(/Epic/, '')
          }),
          endWith({ type: HIDE, internalType: partialKey.replace(/Epic/, '') })
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
