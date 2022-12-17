# icon-numic-plugin

<img align="right" src="https://github.com/tobua/icon-numic-plugin/raw/main/logo.png" width="20%" alt="Icon Numic Plugin Logo" />

Numic plugin for React Native to automatically generate iOS and Android app icons from a single file. Commit only one 1024x1024 file of your app icon but get all sizes automatically. Also supports the generation of adaptive icons for Android.

## Installation

```
npm i --save-dev icon-numic-plugin
```

## Usage

Numic automatically picks up the plugin once installed and adds the various icons to the native folders in `/android` and `/ios` without any changes to commit. The only thing **required is an icon** of the recommended size 1024x1024. The plugin will look for icons in the following locations and pick the first match:

- icon.png / icon.svg
- app-icon.png / app-icon.svg
- asset/icon.png / asset/icon.svg
- logo.png / logo.svg (also used as Avatar in SourceTree)

## Configuration

The icon can be configured in `package.json` under the `numic` property. This will override default icon paths from the file system as described above.

```js
{
  "name": "my-app",
  "numic": {
    "icon-numic-plugin": {
      "icon": "image/my-icon.png",
      // Convert transparent icons to a black background for iOS, default white.
      "iOSBackground": "#000000",
      // Generate Android adaptive icons from SVG images.
      "androidForeground": "image/my-adaptive-foreground.svg",
      "androidBackground": "image/my-adaptive-background.svg",
      // Pass native Android vector drawables in XML format.
      "androidForeground": "image/my-adaptive-foreground.xml",
      "androidBackground": "image/my-adaptive-background.xml",
      // Instead of "androidBackground" it's possible to just set a solid color.
      "androidBackgroundColor": "#FF0000",
    }
  }
}
```

## Adaptive Icons for Android

Adaptive icons use vector graphics and are composed of a foreground icon and a background image. Due to using vector graphics only one image is required. Using this plugin will also generate all the required configuration files as well as the default legacy icons for older devices.

For web developers the easiest way to generate the vector drawables used on Android for adaptive icons is to convert from an SVG.

When using the default Andriod XML format to create the images it's best to do this in Android Studio. Opening the `/android` folder there will allow a direct preview of the graphics.

