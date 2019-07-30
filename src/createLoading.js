import invariant from 'invariant'
import { filter, mapTo, concatAll } from 'rxjs/operators'

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

  function onEpic(action$) {
    return action$.pipe(
      filter(action => {
        const { type } = action
        if (
          (only.length === 0 && except.length === 0) ||
          (only.length > 0 && only.indexOf(type) !== -1) ||
          (except.length > 0 && except.indexOf(type) === -1)
        ) {
          return true
        } else {
          return false
        }
      }),
      mapTo({ type: SHOW }),
      concatAll(),
      mapTo({ type: HIDE })
    )
  }

  return {
    extraReducers,
    onEpic
  }
}

export default createLoading
