import './helper/setup-env'
import { loadingCount } from './helper/model'
import React, { isValidElement } from 'react'
import test from 'ava'
import rain from '..'
import createLoading from '../createLoading'
import { delay, mapTo, tap } from 'rxjs/operators'

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

// test('rain-loading', async t => {
//   const app = rain()
//   app.use(createLoading())
//   app.model(
//     {
//       namespace: 'count',
//       state: 0,
//       reducer: {
//         add(state) {
//           return state + 1
//         },
//         addWithAsyncEpic(state) {
//           return state + 1
//         }
//       },
//       epic: {
//         addEpic: action$ =>
//           action$.ofType('add').pipe(
//             delay(100),
//             mapTo({ type: 'addWithAsyncEpic' })
//           )
//       }
//     },
//     'count'
//   )
//   app.router(() => <div />)
//   app.run()

//   t.deepEqual(app._store.getState().loading, {
//     global: false,
//     models: {},
//     effects: {}
//   })

//   app._store.dispatch({ type: 'count/add' })

//   t.deepEqual(app._store.getState().loading, {
//     global: true,
//     models: { count: true },
//     effects: { 'count/addEpic': true }
//   })

//   await sleep(200)

//   t.deepEqual(app._store.getState().loading, {
//     global: false,
//     models: { count: false },
//     effects: { 'count/addEpic': false }
//   })

//   t.is(app._store.getState().count, 2)
// })

// test('opts.namespace', t => {
//   const app = rain()
//   app.use(
//     createLoading({
//       namespace: 'fooLoading'
//     })
//   )
//   app.model(
//     {
//       namespace: 'count',
//       state: 0
//     },
//     'count'
//   )
//   app.router(() => 1)
//   app.run()
//   t.deepEqual(app._store.getState().fooLoading, {
//     global: false,
//     models: {},
//     effects: {}
//   })
// })

test('opts.only', async t => {
  const app = rain()
  app.use(
    createLoading({
      only: ['count/a']
    })
  )
  app.model(loadingCount, 'count')
  app.router(() => 1)
  app.run()

  t.deepEqual(app._store.getState().loading, {
    global: false,
    models: {},
    effects: {}
  })

  app._store.dispatch({ type: 'count/a' })

  await sleep(300)

  t.deepEqual(app._store.getState().loading, {
    global: true,
    models: { count: true },
    effects: { 'count/aEpic': true }
  })

  app._store.dispatch({ type: 'count/b' })

  await sleep(300)

  // t.deepEqual(app._store.getState().loading, {
  //   global: false,
  //   models: { count: false },
  //   effects: { 'count/aEpic': false }
  // })

  // // why 3 and not 4, because the test case is drop out
  // t.is(app._store.getState().count, 3)
})

// test('multiple effects', async t => {
//   const app = rain()
//   app.use(createLoading())
//   const count = Object.assign(loadingCount, {
//     epic: {
//       aEpic: action$ =>
//         action$.ofType('a').pipe(
//           delay(100),
//           mapTo({ type: 'c' })
//         ),
//       bEpic: action$ =>
//         action$.ofType('b').pipe(
//           delay(500),
//           mapTo({ type: 'c' })
//         )
//     }
//   })
//   app.model(count, 'count')

//   app.router(() => 1)
//   app.run()
//   app._store.dispatch({ type: 'count/a' })
//   app._store.dispatch({ type: 'count/b' })

//   await sleep(200)
//   t.is(app._store.getState().loading.models.count, true)

//   await sleep(800)
//   t.is(app._store.getState().loading.models.count, false)
// })
