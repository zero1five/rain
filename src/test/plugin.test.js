import './helper/setup-env'
import { countModel } from './helper/model'
import React, { isValidElement } from 'react'
import test from 'ava'
import rain from '..'
import createLoading from '../createLoading'
import { delay, mapTo } from 'rxjs/operators'

test('rain-loading', t => {
  const app = rain()
  app.use(createLoading())
  app.model(
    {
      namespace: 'count',
      state: 0,
      reducer: {
        add(state) {
          return state + 1
        },
        addWithAsyncEpic(state) {
          return state + 1
        }
      },
      epic: {
        addEpic: action$ =>
          action$.ofType('add').pipe(
            delay(100),
            mapTo({ type: 'addWithAsyncEpic' })
          )
      }
    },
    'count'
  )
  app.router(() => <div />)
  app.run()

  t.deepEqual(app._store.getState().loading, {
    global: false,
    models: {},
    effects: {}
  })

  app._store.dispatch({ type: 'count/add' })
})
