import './helper/setup-env'
import React from 'react'
import test from 'ava'
import rain from '..'

const countModel = {
  namespace: 'count',
  state: 0,
  reducer: {
    add(state, { payload }) {
      return state + payload || 1
    },
    minus(state, { payload }) {
      return state - payload || 1
    }
  }
}

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

test('opt.onAction with Array', t => {
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
