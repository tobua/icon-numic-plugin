import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join, extname } from 'path'
import svg2vectordrawable from 'svg2vectordrawable'
import { Log, Options } from './index'

const androidXMLFiles = () => [
  {
    path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    contents: `<?xml version="1.0" encoding="utf-8"?>
  <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
      <background android:drawable="@drawable/ic_launcher_background" />
      <foreground android:drawable="@drawable/ic_launcher_foreground" />
  </adaptive-icon>`,
  },
  {
    path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    contents: `<?xml version="1.0" encoding="utf-8"?>
  <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
      <background android:drawable="@drawable/ic_launcher_background" />
      <foreground android:drawable="@drawable/ic_launcher_foreground" />
  </adaptive-icon>`,
  },
]

// Options see https://www.npmjs.com/package/svg2vectordrawable
const convertSVG = async (svgContents: string) => {
  return svg2vectordrawable(svgContents, { xmlTag: true })
}

export const getFileType = (fileName?: string) => extname(fileName ?? '').replace('.', '')

const writeResFile = (nativePath: string, path: string, contents: string) => {
  const destinationFile = join(nativePath, 'android/app/src/main/res', path)
  const directory = dirname(destinationFile)
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }
  writeFileSync(destinationFile, contents)
}

export const generateAndroidAdaptiveIcons = async (
  nativePath: string,
  options: Options,
  log: Log
) => {
  const xmlFiles = androidXMLFiles()

  if (
    !options.androidForeground ||
    (!options.androidBackground && !options.androidBackgroundColor)
  ) {
    log('Not creating adaptive icons for Android')
    return
  }

  const foregroundType = getFileType(options.androidForeground)
  const backgroundType = !options.androidBackgroundColor && getFileType(options.androidBackground)

  if (foregroundType !== 'svg' && foregroundType !== 'xml') {
    log('"androidForeground" invalid, .svg or .xml file required')
  }

  if (!options.androidBackgroundColor && backgroundType !== 'svg' && backgroundType !== 'xml') {
    log('"androidBackground" invalid, .svg or .xml file required')
  }

  // Create importing files.
  xmlFiles.forEach((file) => {
    const destinationFile = join(nativePath, file.path)
    const directory = dirname(destinationFile)
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true })
    }
    writeFileSync(destinationFile, file.contents)
  })

  if (foregroundType === 'svg') {
    const foregroundSVGContents = readFileSync(
      join(process.cwd(), options.androidForeground),
      'utf-8'
    )
    const foregroundVector = await convertSVG(foregroundSVGContents)
    writeResFile(nativePath, 'drawable-v24/ic_launcher_foreground.xml', foregroundVector)
  }

  if (foregroundType === 'xml') {
    const foregroundXMLContents = readFileSync(
      join(process.cwd(), options.androidForeground),
      'utf-8'
    )
    writeResFile(nativePath, 'drawable-v24/ic_launcher_foreground.xml', foregroundXMLContents)
  }

  if (!options.androidBackgroundColor && backgroundType === 'svg') {
    const backgroundSVGContents = readFileSync(
      join(process.cwd(), options.androidBackground as string),
      'utf-8'
    )
    const backgroundVector = await convertSVG(backgroundSVGContents)
    writeResFile(nativePath, 'drawable/ic_launcher_background.xml', backgroundVector)
  }

  if (!options.androidBackgroundColor && backgroundType === 'xml') {
    const backgroundXMLContents = readFileSync(
      join(process.cwd(), options.androidBackground as string),
      'utf-8'
    )
    writeResFile(nativePath, 'drawable/ic_launcher_background.xml', backgroundXMLContents)
  }
}
