import { cpSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, listFilesMatching, readFile } from 'jest-fixture'
import getPixels from 'get-pixels'
import plugin from '../index'

const initialCwd = process.cwd()

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

environment('logo')

test('Creates logos in various sizes.', async () => {
  prepare([packageJson('logo')])

  const logoPath = join(process.cwd(), 'logo.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath)
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({})

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(20)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)

  const iosContentsPath = join(
    process.cwd(),
    'ios/numic/Images.xcassets/AppIcon.appiconset/Contents.json'
  )

  expect(existsSync(iosContentsPath)).toBe(true)

  const iconContentsSpecification = readFile(iosContentsPath)

  expect(iconContentsSpecification.images[0].filename).toBe('Icon-40.png')
})

test('Icon path can be configured.', async () => {
  prepare([packageJson('logo-configured')])

  const logoPath = join(process.cwd(), 'icon/my-image.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath, { recursive: true })
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({ options: { icon: 'icon/my-image.png' } })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(20)
})

test('Native output folder can be configured.', async () => {
  prepare([packageJson('logo-native')])

  const logoPath = join(process.cwd(), 'logo.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath)
  mkdirSync(join(process.cwd(), '.numic/ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({ nativePath: join(process.cwd(), '.numic') })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(20)
  expect(files.includes('.numic/android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('.numic/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(
    true
  )
  expect(files.includes('.numic/ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(
    true
  )
})

test('Also works with svg input file.', async () => {
  prepare([packageJson('logo-svg')])

  const logoPath = join(process.cwd(), 'logo.svg')

  cpSync(join(initialCwd, 'test/logo.svg'), logoPath)
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({ options: { icon: 'logo.svg' } })

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(19)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)
})

test('Automatically finds svg in default paths.', async () => {
  prepare([packageJson('logo-svg-default')])

  const logoPath = join(process.cwd(), 'app-icon.svg')

  cpSync(join(initialCwd, 'test/logo.svg'), logoPath)
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({})

  const files = listFilesMatching('**/*.png')

  expect(files.length).toBe(19)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher.png')).toBe(true)
  expect(files.includes('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png')).toBe(true)
  expect(files.includes('ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png')).toBe(true)
})

test('iOS background transparency can be configured.', async () => {
  prepare([packageJson('logo-ios-background')])

  const white = '#FFFFFF'
  const black = '#000000'

  const logoPath = join(process.cwd(), 'icon.png')

  cpSync(join(initialCwd, 'test/logo.png'), logoPath)
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  expect(existsSync(logoPath)).toBe(true)

  await plugin({})

  const someIOSIcon = join(
    process.cwd(),
    'ios/numic/Images.xcassets/AppIcon.appiconset/Icon-80.png'
  )

  expect(existsSync(someIOSIcon)).toBe(true)
  let pixels = await new Promise<number[]>((done) => {
    getPixels(someIOSIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(255) // Red
  expect(pixels[1]).toBe(255) // Green
  expect(pixels[2]).toBe(255) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)

  await plugin({
    options: {
      iOSBackground: black,
    },
  })

  pixels = await new Promise<number[]>((done) => {
    getPixels(someIOSIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(0) // Red
  expect(pixels[1]).toBe(0) // Green
  expect(pixels[2]).toBe(0) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)

  await plugin({
    options: {
      iOSBackground: white,
    },
  })

  pixels = await new Promise<number[]>((done) => {
    getPixels(someIOSIcon, (_, currentPixels: any) => done(currentPixels.data))
  })

  expect(pixels[0]).toBe(255) // Red
  expect(pixels[1]).toBe(255) // Green
  expect(pixels[2]).toBe(255) // Blue
  expect(pixels[3]).toBe(255) // Alpha (transparency)
})
