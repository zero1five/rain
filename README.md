# RainJS

> react and redux-observable framework

## Status

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![](https://img.shields.io/circleci/project/github/zero1five/rainjs.svg)](https://circleci.com/gh/zero1five/rainjs/tree/master)
[![](https://img.shields.io/npm/v/rainjs.svg)](https://www.npmjs.com/package/rainjs)
[![](https://img.shields.io/npm/dm/rainjs.svg)](https://www.npmjs.com/package/rainjs)
[![](https://img.shields.io/npm/l/rainjs.svg)](https://www.npmjs.com/package/rainjs)
[![](https://img.shields.io/badge/support%20me-donate-ff00ff.svg)](https://www.patreon.com/zero1five)
[![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Usage
```javascript
// pages/index.js
import React, { PureComponent } from 'react'
import { connect } from 'redux-rain'

@connect(({ loading, index }) => ({
  count: index['count'],
  loading: loading.effects['index/addEpic']
}))
export default class MyRootComponent extends PureComponent {
  render() {
    const { dispatch, loading, count } = this.props
    const text = `${count}`
    return (
      <div>
        <h1>Page index</h1>
        <p>{text}</p>
        <button onClick={() => dispatch({ type: 'index/add', payload: 1 })}>Start Ping</button>
      </div>
    );
  }
}

// models/index.js
import { delay, mapTo, tap } from 'rxjs/operators'

export default {
  namespace: 'index',
  state: {
    count: 0,
    payload: {}
  },
  reducer: {
    add(state, { payload }) {
      return { ...state, payload }
    },
    doubleAdd(state, {}) {
      const { payload, count } = state
      return { ...state, count: count + payload }
    }
  },
  epic: {
    addEpic: action$ =>
      action$
        .ofType('add')
        .pipe(
          delay(2000),
          mapTo({ type: 'doubleAdd' })
        )
  }
}
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `yarn run commit`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**rainjs** © [zero1five](https://github.com/zero1five), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by HcySunYang.

> [](https://) · GitHub [@zero1five](https://github.com/zero1five) · Twitter [@zero1five](https://twitter.com/zero1five)

## License

MIT &copy; zero1five
