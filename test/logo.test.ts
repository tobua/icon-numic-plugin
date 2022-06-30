import { cpSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { expect, test, beforeEach, afterEach, vi } from 'vitest'
import { prepare, environment, packageJson, listFilesMatching, readFile } from 'jest-fixture'
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
