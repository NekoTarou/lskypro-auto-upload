# Obsidian LskyPro Auto Upload Plugin

这是一个支持直接上传图片到图床[Lsky](https://github.com/lsky-org/lsky-pro)的工具，基于[renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin.git)改造。
**更新插件后记得重启一下 Obsidian**

## 本次提交更新内容

- 新增命令：`Upload all images - All notes in vault (reuse)`。
  - 扫描库中所有 Markdown 笔记，上传本地图片并将引用统一替换为外链。
  - 复用已有方法 `uploadAllFile(currentFile?: TFile)` 逐个处理文件，避免重复逻辑。
- 重构 `uploadAllFile`：支持传入 `TFile` 参数并顺序执行（`await`）。
  - 当处理当前激活文件时，使用编辑器内容并通过编辑器更新。
  - 当处理非激活文件时，从 vault 读取内容，处理后直接写回文件。
- 更新原有“上传当前文件所有图片”的命令，使其向改造后的方法传入当前激活文件。

### 新命令使用方式

1. 打开命令面板（`Ctrl+P`）。
2. 输入并执行：`Upload all images - All notes in vault (reuse)`。
3. 插件会遍历所有 `.md` 文件，上传本地图片并替换引用，完成后会弹出统计提示。

说明：
- 本地图片会被上传；网络图片的处理遵循现有设置（`workOnNetWork` 与黑名单域名过滤）。
- 相对路径与绝对路径的解析与当前文件命令保持一致。

# 开始

1. 安装 LskyPro 图床，并进行配置，配置参考[官网](https://www.lsky.pro/)
2. 开启 LskyPro 的接口
3. 使用授权接口获取Token，并记录下来
4. 打开插件配置项，设置LskyPro域名(例如：https://lsky.xxx.com)
5. 设置LskyPro Token
6. 存储策略ID是可选配置，根据 LskyPro 的策略和自己的要求来配置，如果只有一个策略，可以不设置

# 特性

## 剪切板上传

支持黏贴剪切板的图片的时候直接上传，目前支持复制系统内图像直接上传。
支持通过设置 `frontmatter` 来控制单个文件的上传，默认值为 `true`，控制关闭请将该值设置为 `false`

支持 ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff"（因为是直接调用LskyPro接口，理论上图床支持的文件都可以）

```yaml
---
image-auto-upload: true
---
```

## 批量上传一个文件中的所有图像文件

输入 `ctrl+P` 呼出面板，输入 `upload all images`(Upload all images-All images in the current file)，点击回车，就会自动开始上传。

现在也可以一次性处理所有笔记：

- 打开命令面板并执行：`Upload all images - All notes in vault (reuse)`
- 插件会复用同样的逻辑逐个处理并替换链接。

路径解析优先级，会依次按照优先级查找：

1. 绝对路径，指基于库的绝对路径
2. 相对路径，以./或../开头
3. 尽可能简短的形式

## 批量下载网络图片到本地

输入 `ctrl+P` 呼出面板，输入 `download all images`，点击回车，就会自动开始下载。只在 win 进行过测试

## 支持右键菜单上传图片

目前已支持标准 md 以及 wiki 格式。支持相对路径以及绝对路径，需要进行正确设置，不然会引发奇怪的问题

## 支持拖拽上传

允许多文件拖拽



# TODO

# 感谢

[renmu123/obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin.git)