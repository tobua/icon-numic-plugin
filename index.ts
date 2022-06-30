import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import sharp from 'sharp'
import { contentsWithLinks } from './ios'

// Sharp Docs: https://sharp.pixelplumbing.com/api-constructor
// Alternative: https://github.com/silvia-odwyer/photon
// https://github.com/aeirola/react-native-svg-app-icon
// https://www.npmjs.com/package/app-icon (requires imagemagik)

type Input = {
  cwd?: string
  log?: (message: string, type?: string) => void
  options?: object
}

const iconSourcePaths = (cwd: string) => [
  join(cwd, 'icon.png'),
  join(cwd, 'app-icon.png'),
  join(cwd, 'asset/icon.png'),
  join(cwd, 'logo.png'),
]

const getInput = (cwd: string, options: { icon?: string }) => {
  if (
    typeof options === 'object' &&
    typeof options.icon === 'string' &&
    existsSync(join(cwd, options.icon))
  ) {
    return join(cwd, options.icon)
  }

  const paths = iconSourcePaths(cwd)
  let match: string | undefined

  paths.forEach((path) => {
    if (!match && existsSync(path)) {
      match = path
    }
  })

  return match
}

const getAndroidFolders = () => [
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  // Round icons.
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48, round: true },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72, round: true },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96, round: true },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144, round: true },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192, round: true },
]

const getIOSFolders = (iosImageDirectory: string) => {
  if (!iosImageDirectory) {
    return []
  }

  return [
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-40.png`, size: 40 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-58.png`, size: 58 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-60.png`, size: 60 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-80.png`, size: 80 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-87.png`, size: 87 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-120.png`, size: 120 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-121.png`, size: 121 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-180.png`, size: 180 },
    { path: `${iosImageDirectory}/AppIcon.appiconset/Icon-1024.png`, size: 1024 },
  ]
}

const getSizes = ({ cwd, log }: Input) => {
  const iosDirectories = readdirSync(join(cwd, 'ios'), { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => existsSync(join(cwd, 'ios', dirent.name, 'Images.xcassets')))
    .map((dirent) => dirent.name)
  const iosImageDirectory =
    iosDirectories.length > 0 ? join('ios', iosDirectories[0], 'Images.xcassets') : null

  if (!iosImageDirectory) {
    log('iOS project directory with "Images.xcassets" not found', 'warning')
  }

  return {
    android: getAndroidFolders(),
    ios: getIOSFolders(iosImageDirectory),
    iosDirectory: iosImageDirectory,
  }
}

export default async ({
  cwd = process.cwd(),
  // eslint-disable-next-line no-console
  log = console.log,
  options,
}: Input) => {
  const inputFile = getInput(cwd, options)
  const sizes = getSizes({ cwd, log, options })

  const androidPromises = sizes.android.map((icon) => {
    const destinationFile = join(cwd, icon.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    return sharp(inputFile).resize(icon.size, icon.size).toFile(destinationFile)
  })

  await Promise.all(androidPromises)

  const iosPromises = sizes.ios.map((icon) => {
    const destinationFile = join(cwd, icon.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    return sharp(inputFile).resize(icon.size, icon.size).toFile(destinationFile)
  })

  await Promise.all(iosPromises)

  // Link ios icons in Contents.json.
  writeFileSync(
    join(cwd, sizes.iosDirectory, 'AppIcon.appiconset/Contents.json'),
    JSON.stringify(contentsWithLinks, null, 2)
  )

  log('App icons created')
}
