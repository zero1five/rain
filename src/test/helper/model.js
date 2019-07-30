import { map } from 'rxjs/operators'

export const countModel = {
  namespace: 'count',
  state: 0,
  reducer: {
    add(state, { payload = 1 }) {
      return state + payload
    },
    minus(state, { payload = 1 }) {
      return state - payload
    },
    doubleMinus(state, { payload = 1 }) {
      return state - payload * 2
    }
  },
  epic: {
    minusEpic: action$ =>
      action$
        .ofType('minus')
        .pipe(map(action => ({ type: 'doubleMinus', payload: action.payload })))
  }
}
