'use strict'

const { test } = require('ava')
const tempy = require('tempy')
const fs = require('fs-extra')
const rmfr = require('rmfr')

const renderText = require('.')

test('basic', async (t) => {
  const output = tempy.file({ extension: 'png' })
  await renderText({
    text: 'hello world',
    output,
    style: {
      fontFamily: 'segue ui',
      fontSize: 64
    }
  })
  t.true(await fs.pathExists(output))
  await rmfr(output)
})
