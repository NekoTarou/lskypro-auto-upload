import {
  MarkdownView,
  Plugin,
  FileSystemAdapter,
  Editor,
  Menu,
  Notice,
  addIcon,
  requestUrl,
  MarkdownFileInfo,
} from "obsidian";

import { join, parse, basename, dirname } from "path";

import imageType from "image-type";

import {
  isAssetTypeAnImage,
  getUrlAsset,
  arrayToObject,
} from "./utils";
import { LskyProUploader } from "./uploader";
import Helper from "./helper";

import { SettingTab, PluginSettings, DEFAULT_SETTINGS } from "./setting";

interface Image {
  path: string;
  obspath: string;
  name: string;
  source: string;
}

export default class imageAutoUploadPlugin extends Plugin {
  settings: PluginSettings;
  helper: Helper;
  editor: Editor;
  lskyUploader: LskyProUploader;
  uploader: LskyProUploader;

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() { }

  async onload() {
    await this.loadSettings();
    this.helper = new Helper(this.app);
    this.lskyUploader = new LskyProUploader(this.settings,this.app);
    if (this.settings.uploader === "LskyPro") {
      this.uploader = this.lskyUploader;
    } else {
      new Notice("unknown uploader");
    }

    addIcon(
      "upload",
      `<svg t="1636630783429" class="icon" viewBox="0 0 100 100" version="1.1" p-id="4649" xmlns="http://www.w3.org/2000/svg">
      <path d="M 71.638 35.336 L 79.408 35.336 C 83.7 35.336 87.178 38.662 87.178 42.765 L 87.178 84.864 C 87.178 88.969 83.7 92.295 79.408 92.295 L 17.249 92.295 C 12.957 92.295 9.479 88.969 9.479 84.864 L 9.479 42.765 C 9.479 38.662 12.957 35.336 17.249 35.336 L 25.019 35.336 L 25.019 42.765 L 17.249 42.765 L 17.249 84.864 L 79.408 84.864 L 79.408 42.765 L 71.638 42.765 L 71.638 35.336 Z M 49.014 10.179 L 67.326 27.688 L 61.835 32.942 L 52.849 24.352 L 52.849 59.731 L 45.078 59.731 L 45.078 24.455 L 36.194 32.947 L 30.702 27.692 L 49.012 10.181 Z" p-id="4650" fill="#8a8a8a"></path>
    </svg>`
    );

    this.addSettingTab(new SettingTab(this.app, this));

    this.addCommand({
      id: "Upload all images",
      name: "Upload all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            this.uploadAllFile();
          }
          return true;
        }
        return false;
      },
    });
    this.addCommand({
      id: "Download all images",
      name: "Download all images",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (leaf) {
          if (!checking) {
            this.downloadAllImageFiles();
          }
          return true;
        }
        return false;
      },
    });

    this.setupPasteHandler();
    this.registerSelection();
  }

  registerSelection() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
          if (this.app.workspace.getLeavesOfType("markdown").length === 0) {
            return;
          }
          const selection = editor.getSelection();
          if (selection) {
            const markdownRegex = /!\[.*\]\((.*)\)/g;
            const markdownMatch = markdownRegex.exec(selection);
            if (markdownMatch && markdownMatch.length > 1) {
              const markdownUrl = markdownMatch[1];
              if (
                this.settings.uploadedImages.find(
                  (item: { imgUrl: string }) => item.imgUrl === markdownUrl
                )
              ) {
                //TODO 选中连接，右键可以上传
                //this.addMenu(menu, markdownUrl, editor);
              }
            }
          }
        }
      )
    );
  }

  async downloadAllImageFiles() {
    const fileArray = this.helper.getAllFiles();
    const folderPathAbs = this.getAttachmentFolderPath();
    if (!folderPathAbs) {
      new Notice(
      `Get attachment folder path faild.`
      );
      return ;
    }
    let absfolder = this.app.vault.getAbstractFileByPath(folderPathAbs);
    if (!absfolder) {
      this.app.vault.createFolder(folderPathAbs);
    }

    let imageArray = [];
    let count:number = 0;
    for (const file of fileArray) {
      if (!file.path.startsWith("http")) {
        continue;
      }
      count++;
      const url = file.path;
      const asset = getUrlAsset(url);
      let [name, ext] = [
        decodeURI(parse(asset).name).replaceAll(/[\\\\/:*?\"<>|]/g, "-"),
        parse(asset).ext,
      ];

      // 如果文件名已存在，则用随机值替换
      if (this.app.vault.getAbstractFileByPath(folderPathAbs+"/"+asset)) {
        name = (Math.random() + 1).toString(36).substring(2, 7);
      }
      try {
        const response = await this.download(url, folderPathAbs, name, ext);
        if (response.ok) {
          imageArray.push({
            source: file.source,
            name: name,
            path: response.path,
          });
        }
      } catch (error) {
        
      }

    }
    let value = this.helper.getValue();
    imageArray.map(image => {
      value = value.replace(
        image.source,
        `![${image.name}${this.settings.imageSizeSuffix || ""}](${encodeURI(
          image.path
        )})`
      );
    });

    this.helper.setValue(value);

    new Notice(
      `all: ${count}\nsuccess: ${imageArray.length}\nfailed: ${count - imageArray.length
      }`
    );
  }
  //获取附件路径（相对路径）
  getAttachmentFolderPath() {
    // @ts-ignore
    let assetFolder: string = this.app.vault.config.attachmentFolderPath;
    if (!assetFolder) {
      assetFolder = "/"
    }
    const activeFile = this.app.vault.getAbstractFileByPath(
      this.app.workspace.getActiveFile()?.path
    );
    if (!activeFile) {
      return null;
    }
    const parentPath = activeFile.parent.path;
    // 当前文件夹下的子文件夹
    if (assetFolder.startsWith("./")) {
      assetFolder = assetFolder.substring(1);
      let pathTem = parentPath + (assetFolder==="/"?"":assetFolder);
      while(pathTem.startsWith("/")) {
        pathTem = pathTem.substring(1);
      }
      return pathTem;
    } else {
      return assetFolder;
    }
  }
  
  async download(url: string, folderPath: string, name: string, ext: string) {
    const response = await requestUrl({ url });
    const type = await imageType(new Uint8Array(response.arrayBuffer));

    if (response.status !== 200) {
      return {
        ok: false,
        msg: "error",
      };
    }
    if (!type) {
      return {
        ok: false,
        msg: "error",
      };
    }

    const buffer = Buffer.from(response.arrayBuffer);

    try {
      let path = folderPath+'/'+`${name}${ext}`;

      if (!ext) {
        path = folderPath +'/'+ `${name}.${type.ext}`;
      }
      this.app.vault.createBinary(path,buffer,{
        ctime: Date.now(),
        mtime: Date.now()
      })
      return {
        ok: true,
        msg: "ok",
        path: path,
        type,
      };
    } catch (err) {
      console.error(err);

      return {
        ok: false,
        msg: err,
      };
    }
  }

  filterFile(fileArray: Image[]) {
    const imageList: Image[] = [];

    for (const match of fileArray) {
      if (match.path.startsWith("http")) {
        if (this.settings.workOnNetWork) {
          if (
            !this.helper.hasBlackDomain(
              match.path,
              this.settings.newWorkBlackDomains
            )
          ) {
            imageList.push({
              path: match.path,
              obspath: match.path,
              name: match.name,
              source: match.source,
            });
          }
        }
      } else {
        imageList.push({
          path: match.path,
          obspath: match.obspath,
          name: match.name,
          source: match.source,
        });
      }
    }

    return imageList;
  }
  getFile(fileName: string, fileMap: any) {
    if (!fileMap) {
      fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    }
    return fileMap[fileName];
  }
  // uploda all file
  uploadAllFile() {
    let content = this.helper.getValue();

    const basePath = (
      this.app.vault.adapter as FileSystemAdapter
    ).getBasePath();
    const activeFile = this.app.workspace.getActiveFile();
    const fileMap = arrayToObject(this.app.vault.getFiles(), "name");
    const filePathMap = arrayToObject(this.app.vault.getFiles(), "path");
    let imageList: Image[] = [];
    const fileArray = this.filterFile(this.helper.getAllFiles());

    for (const match of fileArray) {
      const imageName = match.name;
      const encodedUri = match.path;

      if (!encodedUri.startsWith("http")) {
        const matchPath = decodeURI(encodedUri);
        const fileName = basename(matchPath);
        let file;
        // 绝对路径
        if (filePathMap[matchPath]) {
          file = filePathMap[matchPath];
        }

        // 相对路径
        if (
          (!file && matchPath.startsWith("./")) ||
          matchPath.startsWith("../")
        ) {
          let absoPath = "";
          //查找相对路径
          if (matchPath.startsWith("./")) {
            absoPath = dirname(activeFile.path)+matchPath.substring(1)
          } else {
            //对于../../开头的路径，需要向上查找匹配
            let num = matchPath.split("../").length-1;
            absoPath = matchPath;
            for (let i=0;i<num;i++) {
              absoPath = absoPath.substring(0,absoPath.lastIndexOf("/"))
            }
          }
          file = this.app.vault.getAbstractFileByPath(absoPath);
        }
        // 尽可能短路径
        if (!file) {
          file = this.getFile(fileName, fileMap);
        }

        if (file) {
          const abstractImageFile = join(basePath, file.path);

          if (isAssetTypeAnImage(abstractImageFile)) {
            let pushObj = {
              path: abstractImageFile,
              obspath: file.path,
              name: imageName,
              source: match.source,
            };
            //如果文件中有重复引用的图片，只上传一次
            if (!imageList.find(item=>item.path===abstractImageFile&&item.name===imageName&&item.source===match.source)) {
              imageList.push(pushObj);
            }
          }
        }
      }
    }

    if (imageList.length === 0) {
      new Notice("没有解析到图像文件");
      return;
    } else {
      new Notice(`共找到${imageList.length}个图像文件，开始上传`);
    }

    this.uploader.uploadFilesByPath(imageList.map(item => item.obspath)).then(res => {
      if (res.success) {
        let uploadUrlList = res.result;
        const uploadUrlFullResultList = res.fullResult || [];

        this.settings.uploadedImages = [
          ...(this.settings.uploadedImages || []),
          ...uploadUrlFullResultList,
        ];
        this.saveSettings();
        imageList.map(item => {
          const uploadImage = uploadUrlList.shift();
          content = content.replaceAll(
            item.source,
            `![${item.name}${this.settings.imageSizeSuffix || ""
            }](${uploadImage})`
          );
        });
        this.helper.setValue(content);

        if (this.settings.deleteSource) {
          imageList.map(image => {
            if (!image.path.startsWith("http")) {
              let fileDel = this.app.vault.getAbstractFileByPath(image.obspath);
              if (fileDel) {
                this.app.vault.delete(fileDel);
              }
            }
          });
        }
      } else {
        new Notice("Upload error");
      }
    });
  }

  setupPasteHandler() {
    this.registerEvent(
      this.app.workspace.on(
        "editor-paste",
        (evt: ClipboardEvent, editor: Editor, markdownView: MarkdownView) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );

          let files = evt.clipboardData.files;
          if (!allowUpload) {
            return;
          }
          // 剪贴板内容有md格式的图片时
          if (this.settings.workOnNetWork) {
            const clipboardValue = evt.clipboardData.getData("text/plain");
            const imageList = this.helper
              .getImageLink(clipboardValue)
              .filter(image => image.path.startsWith("http"))
              .filter(
                image =>
                  !this.helper.hasBlackDomain(
                    image.path,
                    this.settings.newWorkBlackDomains
                  )
              );

            if (imageList.length !== 0) {
              this.uploader
                .uploadFilesByPath(imageList.map(item => item.path))
                .then(res => {
                  let value = this.helper.getValue();
                  if (res.success) {
                    let uploadUrlList = res.result;
                    imageList.map(item => {
                      const uploadImage = uploadUrlList.shift();
                      value = value.replaceAll(
                        item.source,
                        `![${item.name}${this.settings.imageSizeSuffix || ""
                        }](${uploadImage})`
                      );
                    });
                    this.helper.setValue(value);
                    const uploadUrlFullResultList = res.fullResult || [];
                    this.settings.uploadedImages = [
                      ...(this.settings.uploadedImages || []),
                      ...uploadUrlFullResultList,
                    ];
                    this.saveSettings();
                  } else {
                    new Notice("Upload error");
                  }
                });
            }
          }

          // 剪贴板中是图片时进行上传
          if (this.canUpload(evt.clipboardData)) {
            this.uploadFileAndEmbedImgurImage(
              editor,
              async (editor: Editor, pasteId: string) => {
                let res = await this.uploader.uploadFileByClipboard(evt);
                if (res.code !== 0) {
                  this.handleFailedUpload(editor, pasteId, res.msg);
                  return;
                }
                const url = res.data;
                const uploadUrlFullResultList = res.fullResult || [];
                this.settings.uploadedImages = [
                  ...(this.settings.uploadedImages || []),
                  ...uploadUrlFullResultList,
                ];
                await this.saveSettings();
                return url;
              },
              evt.clipboardData
            ).catch();
            evt.preventDefault();
          }
        }
      )
    );
    this.registerEvent(
      this.app.workspace.on(
        "editor-drop",
        async (evt: DragEvent, editor: Editor, markdownView: MarkdownView) => {
          const allowUpload = this.helper.getFrontmatterValue(
            "image-auto-upload",
            this.settings.uploadByClipSwitch
          );
          let files = evt.dataTransfer.files;
          if (!allowUpload) {
            return;
          }

          if (files.length !== 0 && files[0].type.startsWith("image")) {
            let files = evt.dataTransfer.files;
            evt.preventDefault();

            const data = await this.uploader.uploadFiles(Array.from(files));

            if (data.success) {
              const uploadUrlFullResultList = data.fullResult ?? [];
              this.settings.uploadedImages = [
                ...(this.settings.uploadedImages ?? []),
                ...uploadUrlFullResultList,
              ];
              this.saveSettings();
              data.result.map((value: string) => {
                let pasteId = (Math.random() + 1).toString(36).substring(2, 7);
                this.insertTemporaryText(editor, pasteId);
                this.embedMarkDownImage(editor, pasteId, value, files[0].name);
              });
            } else {
              new Notice("Upload error");
            }
          }
        }
      )
    );
  }

  canUpload(clipboardData: DataTransfer) {
    this.settings.applyImage;
    const files = clipboardData.files;
    const text = clipboardData.getData("text");

    const hasImageFile =
      files.length !== 0 && files[0].type.startsWith("image");
    if (hasImageFile) {
      if (!!text) {
        return this.settings.applyImage;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  async uploadFileAndEmbedImgurImage(
    editor: Editor,
    callback: Function,
    clipboardData: DataTransfer
  ) {
    let pasteId = (Math.random() + 1).toString(36).substring(2, 7);
    this.insertTemporaryText(editor, pasteId);
    const name = clipboardData.files[0].name;
    try {
      const url = await callback(editor, pasteId);
      this.embedMarkDownImage(editor, pasteId, url, name);
    } catch (e) {
      this.handleFailedUpload(editor, pasteId, e);
    }
  }

  insertTemporaryText(editor: Editor, pasteId: string) {
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    editor.replaceSelection(progressText + "\n");
  }

  private static progressTextFor(id: string) {
    return `![Uploading file...${id}]()`;
  }

  embedMarkDownImage(
    editor: Editor,
    pasteId: string,
    imageUrl: any,
    name: string = ""
  ) {
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    const imageSizeSuffix = this.settings.imageSizeSuffix || "";
    let markDownImage = `![${name}${imageSizeSuffix}](${imageUrl})`;

    imageAutoUploadPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      markDownImage
    );
  }

  handleFailedUpload(editor: Editor, pasteId: string, reason: any) {
    new Notice(reason);
    console.error("Failed request: ", reason);
    let progressText = imageAutoUploadPlugin.progressTextFor(pasteId);
    imageAutoUploadPlugin.replaceFirstOccurrence(
      editor,
      progressText,
      "⚠️upload failed, check dev console"
    );
  }

  static replaceFirstOccurrence(
    editor: Editor,
    target: string,
    replacement: string
  ) {
    let lines = editor.getValue().split("\n");
    for (let i = 0; i < lines.length; i++) {
      let ch = lines[i].indexOf(target);
      if (ch != -1) {
        let from = { line: i, ch: ch };
        let to = { line: i, ch: ch + target.length };
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }
}
