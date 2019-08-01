import './helper/setup-env'
import { countModel } from './helper/model'
import React, { isValidElement } from 'react'
import test from 'ava'
import rain from '..'
import createLoading from '../createLoading'
import { delay, mapTo } from 'rxjs/operators'

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

test('rain-loading', async t => {
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
          ),
        testEpic: action$ =>
          action$.ofType('test').pipe(
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

  t.deepEqual(app._store.getState().loading, {
    global: true,
    models: { count: true },
    effects: { 'count/addEpic': true }
  })

  await sleep(200)

  t.deepEqual(app._store.getState().loading, {
    global: false,
    models: { count: false },
    effects: { 'count/addEpic': false }
  })

  t.is(app._store.getState().count, 2)
})

test('rain-loading-namespace', t => {
  const app = rain()
  app.use(
    createLoading({
      namespace: 'fooLoading'
    })
  )
  app.model(
    {
      namespace: 'count',
      state: 0
    },
    'count'
  )
  app.router(() => 1)
  app.run()
  t.deepEqual(app._store.getState().fooLoading, {
    global: false,
    models: {},
    effects: {}
  })
})
