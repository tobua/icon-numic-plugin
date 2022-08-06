# icon-numic-plugin

<img align="right" src="https://github.com/tobua/icon-numic-plugin/raw/main/logo.png" width="20%" alt="Icon Numic Plugin Logo" />

Numic plugin for React Native to automatically generate iOS and Android app icons from a single file. Commit only one 1024x1024 file of your app icon but get all sizes automatically.

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
      "iOSBackground": "#000000"
    }
  }
}
```
