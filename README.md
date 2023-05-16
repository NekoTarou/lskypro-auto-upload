# Obsidian LskyPro Auto Upload Plugin

This is a tool that supports uploading images directly to the image bed [Lsky](https://github.com/lsky-org/lsky-pro), based on [renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin.git) modification.
**Remember to restart Obsidian after updating the plugin**

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

press ctrl+P and input upload all images，enter, then will auto upload all local images

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