# Obsidian LskyPro Auto Upload Plugin

This is a tool that supports uploading images directly to the image bed [Lsky](https://github.com/lsky-org/lsky-pro), based on [renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin.git) modification.
**Remember to restart Obsidian after updating the plugin**

## What's New (this commit)

- Added a new command: `Upload all images - All notes in vault (reuse)`.
  - Scans all Markdown notes in your vault and uploads local images, then replaces links with uploaded URLs.
  - Reuses the existing `uploadAllFile(currentFile?: TFile)` method for each note to avoid duplicated logic.
- Refactored `uploadAllFile` to accept a `TFile` parameter and run sequentially (`await`).
  - When called for the active note, it uses the editor content and updates via the editor.
  - When called for non-active notes, it reads the file from the vault and writes back with updated links.
- Updated the existing "Upload all images" command to pass the active file to the refactored method.

### How to use the new command

1. Open the command palette (`Ctrl+P`).
2. Run `Upload all images - All notes in vault (reuse)`.
3. The plugin will iterate all `.md` files, upload local images, and replace references; a summary notice appears when done.

Notes:
- Local images are uploaded; handling of network images respects your current settings (`workOnNetWork` and black domain filters).
- Relative and absolute paths are resolved consistently, same as the current-file command.

# Start

1. Install the LskyPro image bed and configure it. For configuration, refer to [official website](https://www.lsky.pro/)
2. Open the interface of LskyPro
3. Use the authorization interface to obtain Token and record it
4. Open the plug-in configuration item and set the LskyPro domain name (for example: https://lsky.xxx.com)
5. Set LskyPro Token
6. The storage policy ID is an optional configuration, and it is configured according to LskyPro's policy and its own requirements. If there is only one policy, it does not need to be set

# Features

## Upload when paste image

It supports uploading directly when pasting pictures from the clipboard, and currently supports copying images in the system and uploading them directly.
Support to control the upload of a single file by setting `frontmatter`, the default value is `true`, please set the value to `false` to control the shutdown

Support ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff" (because it directly calls the LskyPro interface, theoretically the files supported by the image bed It will be all right)

```yaml
---
image-auto-upload: true
---
```

## Upload all local images file by command

press ctrl+P and input upload all images(Upload all images-All images in the current file)，enter, then will auto upload all local images

You can also process all notes at once with the new command:

- Open the command palette and run: `Upload all images - All notes in vault (reuse)`
- It will reuse the same logic per note and update links across the vault.

The path resolution priority will be searched according to the priority in turn:

1. Absolute path, refers to the absolute path based on the library
2. Relative paths, starting with ./ or ../
3. shortest possible form

## download all internet to local

press ctrl+P and input upload all images，enter, then will auto upload all local images

## Support drag-and-drop

Allow multiple file drag and drop


# TODO

# Thanks
[renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin.git)