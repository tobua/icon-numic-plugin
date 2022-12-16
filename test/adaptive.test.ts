import { cpSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, listFilesMatching, readFile, file } from 'jest-fixture'
import plugin from '../index'
import { getFileType } from '../adaptive-icon'

const initialCwd = process.cwd()

// @ts-ignore
global.jest = { spyOn: vi.spyOn }
// @ts-ignore
global.beforeEach = beforeEach
// @ts-ignore
global.afterEach = afterEach

environment('adaptive')

test('Creates proper description XML files when adaptive icon input is supplied.', async () => {
  prepare([packageJson('adaptive'), file('ios/test.xml', '')])

  // Regular logo, still required.
  cpSync(join(initialCwd, 'test/logo.png'), join(process.cwd(), 'logo.png'))
  mkdirSync(join(process.cwd(), 'ios/numic/Images.xcassets'), { recursive: true })

  const backgroundPath = join(process.cwd(), 'image/my-background.svg')
  const foregroundPath = join(process.cwd(), 'image/my-foreground.svg')

  cpSync(join(initialCwd, 'test/background.svg'), backgroundPath)
  cpSync(join(initialCwd, 'test/logo.svg'), foregroundPath)

  expect(existsSync(backgroundPath)).toBe(true)
  expect(existsSync(foregroundPath)).toBe(true)

  await plugin({
    options: {
      androidBackground: 'image/my-background.svg',
      androidForeground: 'image/my-foreground.svg',
    },
  })

  const iosPngImages = listFilesMatching('ios/**/*.png')
  const androidPngImages = listFilesMatching('android/**/*.png')

  // Regular icons still generated.
  expect(iosPngImages.length + androidPngImages.length).toBe(19)

  const androidXMLFiles = listFilesMatching('android/app/src/main/res/**/*.xml')

  expect(
    androidXMLFiles.includes('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml')
  ).toBe(true)
  expect(
    androidXMLFiles.includes('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml')
  ).toBe(true)

  const adaptiveLauncherIconContents = readFile(
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'
  )

  expect(adaptiveLauncherIconContents).toContain('adaptive-icon')

  const drawableBackgroundContents = readFile(
    'android/app/src/main/res/drawable/ic_launcher_background.xml'
  )
  const drawableForegroundContents = readFile(
    'android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml'
  )

  expect(drawableBackgroundContents).toContain('<vector')
  expect(drawableBackgroundContents).toContain('<?xml')

  expect(drawableForegroundContents).toContain('<vector')
  expect(drawableForegroundContents).toContain('<?xml')
})

test('Detects file type from name.', () => {
  expect(getFileType('image/my-image.svg')).toBe('svg')
  expect(getFileType('another/path/somevectordrawable.xml')).toBe('xml')
  expect(getFileType('/Absolute/path/somevectordrawable.xml')).toBe('xml')
  expect(getFileType('./relative/path/some-svg.svg')).toBe('svg')
})
