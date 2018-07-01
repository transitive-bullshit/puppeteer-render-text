'use strict'

const fs = require('fs')
const ow = require('ow')
const path = require('path')
const puppeteer = require('puppeteer')

const { cssifyObject } = require('css-in-js-utils')

const observerScript = fs.readFileSync(path.join(__dirname, 'lib', 'fontfaceobserver.standalone.js'), 'utf8')
const observer = `
<script>
  ${observerScript}
</script>
`

/**
 * Renders the given text / html via puppeteer.
 *
 * Asynchronously returns the generated html page as a string for debugging purposes.
 *
 * If you want to load multiple google fonts, juse specify their font-families in `opts.style.fontFamily`
 * separated by commas as you normally would for CSS fonts.
 *
 * @name renderText
 * @function
 *
 * @param {object} opts - Configuration options
 * @param {string} opts.text - HTML content to render
 * @param {string} opts.output - Path of image file to output result
 * @param {number} [opts.width] - Optional max width for word-wrap
 * @param {number} [opts.height] - Optional max height to clip overflow
 * @param {string} [opts.loadFontFamily] - Optional font family to load with fontfaceobserver
 * @param {boolean} [opts.loadGoogleFont=false] - Whether or not to load and wait for `opts.style.fontFamily` as one or more google fonts
 * @param {object} [opts.style={}] - JS [CSS styles](https://www.w3schools.com/jsref/dom_obj_style.asp) to apply to the text's container div
 * @param {object} [opts.inject={}] - Optionally injects arbitrary string content into the head, style, or body elements.
 * @param {string} [opts.inject.head] - Optionally injected into the document <head>
 * @param {string} [opts.inject.style] - Optionally injected into a <style> tag within the document <head>
 * @param {string} [opts.inject.body] - Optionally injected into the document <body>
 *
 * @return {Promise}
 */
module.exports = async (opts) => {
  const {
    text,
    output,
    width = undefined,
    height = undefined,
    loadFontFamily = undefined,
    loadGoogleFont = false,
    style = { },
    inject = { }
  } = opts

  ow(output, ow.string.nonEmpty.label('output'))
  ow(text, ow.string.label('text'))
  ow(style, ow.object.plain.label('style'))

  const { fontFamily = '' } = style

  if (loadGoogleFont && !fontFamily) {
    throw new Error('valid style.fontFamily required when loading google font')
  }

  const fonts = loadFontFamily
    ? [ loadFontFamily ]
    : loadGoogleFont
      ? fontFamily.split(',').map((font) => font.trim())
      : [ ]

  const fontHeader = loadFontFamily
    ? observer : (
      loadGoogleFont ? `
      ${observer}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=${fonts.map((font) => font.replace(/ /g, '+')).join('|')}">
    ` : ''
    )

  const fontsToLoad = fonts.map((font) => `new FontFaceObserver('${font}')`)
  const fontLoader = fontsToLoad.length
    ? `Promise.all([ ${fontsToLoad.join(', ')} ].map((f) => f.load())).then(ready);`
    : 'ready();'

  const html = `
<html>
<head>
  <meta charset="UTF-8">

  ${inject.head || ''}
  ${fontHeader}

  <style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: transparent;

  ${width ? 'max-width: ' + width + 'px;' : ''}
  ${height ? 'max-height: ' + height + 'px;' : ''}

  overflow: hidden;
}

.text {
  display: inline-block;
  ${width ? '' : 'white-space: nowrap;'}

  ${cssifyObject(style)}
}

  ${inject.style || ''}
  </style>
</head>

<body>
${inject.body || ''}

<div class="text">${text}</div>

<script>
  function ready () {
    var div = document.createElement('div');
    div.className = 'ready';
    document.body.appendChild(div);
  }
  ${fontLoader}
</script>

</body>
</html>
`

  // testing
  // const fs = require('fs')
  // fs.writeFileSync('test.html', html)

  const browser = opts.browser || await puppeteer.launch({
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
  })
  const page = await browser.newPage()

  page.on('console', console.log)
  page.on('error', console.error)

  await page.setViewport({
    deviceScaleFactor: 1,
    width: width || 640,
    height: height || 480
  })
  await page.setContent(html)
  await page.waitForSelector('.ready')

  const frame = page.mainFrame()
  const textHandle = await frame.$('.text')
  await textHandle.screenshot({
    path: output,
    omitBackground: true
  })
  await textHandle.dispose()
  await browser.close()

  return html
}
