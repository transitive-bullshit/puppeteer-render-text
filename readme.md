# puppeteer-render-text

> Robust text renderer using headless chrome.

[![NPM](https://img.shields.io/npm/v/puppeteer-render-text.svg)](https://www.npmjs.com/package/puppeteer-render-text) [![Build Status](https://travis-ci.com/transitive-bullshit/puppeteer-render-text.svg?branch=master)](https://travis-ci.com/transitive-bullshit/puppeteer-render-text) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Why?

ImageMagick is the traditional unix tool to programatically [render text](http://www.imagemagick.org/Usage/text/), and while it works very well for simple use cases, trying to use it to render rich text or html is very difficult. [Pango](https://www.pango.org/) is another option that's been around for ages, but both options suffer from archaic syntax and bare minimum rich text support.

[Puppeteer](https://github.com/GoogleChrome/puppeteer), on the other hand, allows for robust, headless chrome screenshots with best-in-class support for all modern html / text / font features. This module's purpose is to make it easy to use headless chrome to render generic text and html snippets to images.

## Features

- built-in [fontfaceobserver](https://fontfaceobserver.com/) support
- easily load [Google fonts](https://fonts.google.com/)
- optional word-wrap
- main context is just **html**
- styling is done via [**css**](https://www.w3schools.com/jsref/dom_obj_style.asp)
- thoroughly tested

## Install

```bash
npm install --save puppeteer-render-text
```

## Usage

```js
const renderText = require('.')

// built-in font with no word-wrap
await renderText({
  text: 'hello world',
  output: 'out0.png',
  style: {
    fontFamily: 'segue ui',
    fontSize: 64
  }
})

// custom google font with word-wrap at 400px
await renderText({
  text: 'headless chrome is awesome',
  output: 'out1.png',
  loadGoogleFont: true,
  width: 400,
  style: {
    fontFamily: 'Roboto',
    fontSize: 32,
    padding: 16
  }
})
```

## API

TODO

## Related

- [puppeteer](https://github.com/GoogleChrome/puppeteer) - Headless Chrome Node API.

## License

MIT © [Travis Fischer](https://github.com/transitive-bullshit)
