# choo-async

Asynchronous rendering decorator for Choo.

[Usage](#usage) -
[Install](#install) -
[License: MIT](#license)

[![stability][stability-image]][stability-url]
[![standard][standard-image]][standard-url]

[stability-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Usage

```js
const choo = require('choo')
const async = require('choo-async')
const html = require('choo-async/html')

const app = async(choo())

app.route('/', async.catch(view, error))
app.mount('body')

async function view (state, emit) {
  const lazyView = await import('./lazyView')
  return html`
    <body>
      <h1>Hello</h1>
      ${lazyView(state, emit)}
    </body>
  `
}

function error (err) {
  return (state, emit) => html`
    <body>
      <h2>An error has occured</h2>
      <pre>${err.stack}</pre>
    </body>
  `
}
```

## Install

```
npm install choo-async
```

## License

[MIT](LICENSE.md)
