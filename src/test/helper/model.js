import { map, delay, mapTo, tap, filter } from 'rxjs/operators'

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

export const loadingCount = {
  namespace: 'count',
  state: 0,
  reducer: {
    a(state) {
      return state + 1
    },
    b(state) {
      return state + 1
    },
    c(state) {
      return state + 1
    }
  },
  epic: {
    aEpic: action$ => {
      return action$.pipe(
        filter(action => action.type === 'a'),
        delay(500),
        mapTo({ type: 'c' })
      )
    }
    // bEpic: action$ =>
    //   action$.ofType('b').pipe(
    //     delay(500),
    //     mapTo({ type: 'c' })
    //   )
  }
}
