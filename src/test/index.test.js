import './helper/setup-env'
import { countModel } from './helper/model'
import React, { isValidElement } from 'react'
import test from 'ava'
import rain from '..'

test('start with document node', t => {
  const app = rain()
  app.model(countModel, 'count')
  app.router(() => <div />)
  t.notThrows(() => app.run('#root'))
})

test('start without doucment node', t => {
  const app = rain()
  app.model(countModel, 'count')
  app.router(() => <div />)

  const error = t.throws(() => app.run('#app'))
  t.is(error.message, `[app.run] react-dom container  not found`)
})

test('router not or failed register', t => {
  const app = rain()
  app.model(countModel, 'count')

  const error = t.throws(() => app.run())
  t.is(error.message, `[app.run] router not or failed register`)
})

test('opts.initialState', t => {
  const app = rain({ initialState: { count: 1 } })
  app.model(countModel, 'count')
  app.router(() => <div />)
  app.run()

  t.is(app._store.getState().count, 1)
})

test('opts.onAction', t => {
  let count
  const countMiddleware = () => () => () => {
    count += 1
  }

  const app = rain({
    onAction: countMiddleware
  })

  app.model(countModel, 'count')
  app.router(() => <div />)
  app.run()

  count = 0
  app._store.dispatch({ type: 'test' })

  t.is(count, 1)
})

test('opts.onAction with Array', t => {
  let count
  const countMiddleware = () => next => action => {
    count += 1
    next(action)
  }
  const count2Middleware = () => next => action => {
    count += 2
    next(action)
  }

  const app = rain({
    onAction: [countMiddleware, count2Middleware]
  })
  app.model(countModel, 'count')
  app.router(() => <div />)
  app.run()

  count = 0
  app._store.dispatch({ type: 'test' })
  t.is(count, 3)
})

test('opts.extraEnhancers', t => {
  let count
  const countEnhancer = storeCreator => (reducer, preloadedState, enhancer) => {
    const store = storeCreator(reducer, preloadedState, enhancer)
    const oldDispatch = store.dispatch
    store.dispatch = action => {
      count += 1
      oldDispatch(action)
    }
    return store
  }

  const app = rain({
    extraEnhancers: countEnhancer
  })
  app.model(countModel, 'count')
  app.router(() => <div />)
  app.run()

  count = 0
  app._store.dispatch({ type: 'test' })

  t.is(count, 1)
})

test('opts.onStateChange', t => {
  let savedState = null

  const app = rain({
    onStateChange(state) {
      savedState = state
    }
  })

  app.model(
    {
      namespace: 'count',
      state: 0,
      reducer: {
        add(state) {
          return state + 1
        }
      }
    },
    'count'
  )
  app.router(() => <div />)
  app.run()

  app._store.dispatch({ type: 'count/add' })

  t.is(savedState.count, 1)
})

test('epic', t => {
  const app = rain()
  app.model(countModel, 'count')
  app.router(() => <div />)
  app.run()

  app._store.dispatch({ type: 'count/minus' })

  t.is(app._store.getState().count, -3)
})

test('modular state', t => {
  const app = rain()
  app.model(countModel, 'count')
  app.model(
    {
      namespace: 'stand',
      state: 0,
      reducer: {
        add(state) {
          return state + 1
        }
      }
    },
    'stand'
  )
  app.router(() => <div />)
  app.run()

  app._store.dispatch({ type: 'stand/add' })

  t.is(app._store.getState().count, 0)
  t.is(app._store.getState().stand, 1)
})

test('app.run not input string must be return JSX', t => {
  const app = rain()
  app.model(countModel, 'count')
  app.router(() => <div />)

  t.true(isValidElement(app.run()()))
})
