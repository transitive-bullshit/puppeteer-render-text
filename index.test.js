'use strict'

const { test } = require('ava')
const tempy = require('tempy')
const rmfr = require('rmfr')
const sharp = require('sharp')

const renderText = require('.')

function inDelta (actual, expected, delta) {
  return (expected - delta <= actual && actual <= expected + delta)
}

test('"hello world" builtin font', async (t) => {
  const output0 = tempy.file({ extension: 'png' })
  const output1 = tempy.file({ extension: 'png' })

  await renderText({
    text: 'hello world',
    output: output0,
    style: {
      fontFamily: 'segue ui',
      fontSize: 64
    }
  })

  await renderText({
    text: 'hello world',
    output: output1,
    style: {
      fontFamily: 'segue ui',
      fontSize: 64,
      padding: 16
    }
  })

  const image0 = await sharp(output0).metadata()
  t.true(inDelta(image0.width, 293, 5))
  t.true(inDelta(image0.height, 74, 3))
  t.is(image0.channels, 4)
  t.is(image0.format, 'png')

  const image1 = await sharp(output1).metadata()
  t.true(inDelta(image1.width, 293 + 16 * 2, 5))
  t.true(inDelta(image1.height, 74 + 16 * 2, 3))
  t.is(image1.channels, 4)
  t.is(image1.format, 'png')

  await rmfr(output0)
  await rmfr(output1)
})

test('"foobar > barfoo" google font Roboto', async (t) => {
  const output0 = tempy.file({ extension: 'png' })

  await renderText({
    text: 'foobar > barfoo',
    output: output0,
    style: {
      fontFamily: 'Roboto',
      fontSize: '8em'
    },
    loadGoogleFont: true
  })

  const image0 = await sharp(output0).metadata()
  t.true(inDelta(image0.width, 881, 5))
  t.true(inDelta(image0.height, 150, 5))
  t.is(image0.channels, 4)
  t.is(image0.format, 'png')

  await rmfr(output0)
})

test('"lots of words to wrap" test word wrapping', async (t) => {
  const output0 = tempy.file({ extension: 'png' })
  const output1 = tempy.file({ extension: 'png' })

  // this version should wrap because we give it a max width
  await renderText({
    text: 'lots of words to wrap',
    output: output0,
    width: 400,
    style: {
      fontSize: 64
    }
  })

  // this version should not wrap
  await renderText({
    text: 'lots of words to wrap',
    output: output1,
    style: {
      fontSize: 64
    }
  })

  const image0 = await sharp(output0).metadata()
  t.true(inDelta(image0.width, 400, 5))
  t.true(inDelta(image0.height, 148, 3))
  t.is(image0.channels, 4)
  t.is(image0.format, 'png')

  const image1 = await sharp(output1).metadata()
  t.true(inDelta(image1.width, 543, 5))
  t.true(inDelta(image1.height, 74, 3))
  t.is(image1.channels, 4)
  t.is(image1.format, 'png')

  await rmfr(output0)
  await rmfr(output1)
})

test('"puppeteer-render-text 😊" html with multiple google fonts', async (t) => {
  const output0 = tempy.file({ extension: 'png' })

  await renderText({
    text: 'puppeteer-<span style="font-family: \'Permanent Marker\'">render</span>-<span style="color: red">text</span> 😊',
    output: output0,
    style: {
      fontFamily: 'Gloria Hallelujah, Permanent Marker',
      fontSize: 40
    },
    loadGoogleFont: true
  })

  const image0 = await sharp(output0).metadata()
  t.true(inDelta(image0.width, 502, 5))
  t.true(inDelta(image0.height, 79, 3))
  t.is(image0.channels, 4)
  t.is(image0.format, 'png')

  await rmfr(output0)
})
