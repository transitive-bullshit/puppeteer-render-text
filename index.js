'use strict'

const puppeteer = require('puppeteer')
const ow = require('ow')

const { cssifyObject } = require('css-in-js-utils')
const observer = '<script src="https://storage.googleapis.com/automagical-assets-prod/fontfaceobserver.standalone.js"></script>'

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

  const { fontFamily } = style

  if (loadGoogleFont && !fontFamily) {
    throw new Error('valid style.fontFamily required when loading google font')
  }

  const fontHeader = loadFontFamily
    ? observer : (
      loadGoogleFont ? `
      <script src="https://storage.googleapis.com/automagical-assets-prod/fontfaceobserver.standalone.js"></script>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=${fontFamily.replace(/ /g, '+')}">
    ` : ''
    )
  const fontLoader = loadFontFamily || loadGoogleFont ? `
    var font = new FontFaceObserver('${loadFontFamily || fontFamily}');
    font.load().then(ready);
  ` : 'ready();'

  const html = `
<html>
<head>
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

  ${cssifyObject(style)}
}

.text {
  padding: 8px;
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

  // TODO: TEMP
  // TODO: TEMP
  const fs = require('fs')
  fs.writeFileSync('test.html', html)
  // TODO: TEMP
  // TODO: TEMP

  const browser = opts.browser || await puppeteer.launch({
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
  })
  const page = await browser.newPage()

  page.on('console', console.log)
  page.on('error', console.error)

  const viewport = { deviceScaleFactor: 1 }
  if (width) viewport.width = width
  if (height) viewport.height = height
  // await page.setViewport(viewport)
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
}
