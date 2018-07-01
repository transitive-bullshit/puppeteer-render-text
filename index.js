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
      ${observer}
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
  const fs = require('fs')
  fs.writeFileSync('test.html', html)

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
