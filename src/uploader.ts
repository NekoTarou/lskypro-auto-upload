import { PluginSettings } from "./setting";
import {  App, TFile } from "obsidian";
//兰空上传器
export class LskyProUploader {
  settings: PluginSettings;
  lskyUrl: string;
  lskyToken: string;
  app: App;

  constructor(settings: PluginSettings,app: App) {
    this.settings = settings;
    this.lskyUrl = this.settings.uploadServer.endsWith("/")
      ? this.settings.uploadServer + "api/v1/upload"
      : this.settings.uploadServer + "/api/v1/upload";
    this.lskyToken = "Bearer " + this.settings.token;
    this.app = app;
  }

  //上传请求配置
  getRequestOptions(file: File) {
    let headers = new Headers();
    headers.append("Authorization", this.lskyToken);
    headers.append("Accept", "application/json");

    let formdata = new FormData();
    formdata.append("file", file);
    if (this.settings.strategy_id) {
      formdata.append("strategy_id", this.settings.strategy_id);
    }

    return {
      method: "POST",
      headers: headers,
      body: formdata,
    };
  }
  //上传文件，返回promise对象
  promiseRequest(file: any) {
    let requestOptions = this.getRequestOptions(file);
    return new Promise(resolve => {
      fetch(this.lskyUrl, requestOptions).then(response => {
        response.json().then(value => {
          if (!value.status) {
            return resolve({
              code: -1,
              msg: value.message,
              data: value.data,
            });
          } else {
            return resolve({
              code: 0,
              msg: "success",
              data: value.data?.links?.url,
              fullResult: {} || [],
            });
          }
        });
      });
    }).catch(error => {
      console.log("error", error);
      return {
        code: -1,
        msg: error,
        data: "",
      };
    });
  }
  //通过路径创建文件
  async createFileObjectFromPath(path: string) {
    return new Promise(resolve => {
      let obsfile = this.app.vault.getAbstractFileByPath(path);
      //@ts-ignore
      this.app.vault.readBinary(obsfile).then(data=>{
        const fileName = path.split("/").pop(); // 获取文件名
        const fileExtension = fileName.split(".").pop(); // 获取后缀名
        const blob = new Blob([data], { type: "image/" + fileExtension });
        const file = new File([blob], fileName);
        resolve(file);
      }).catch(err=>{
        console.error("Error reading file:", err);
        return;
      });
    });
  }

  async uploadFilesByPath(fileList: Array<String>): Promise<any> {
    let promiseArr = fileList.map(async filepath => {
      let file = await this.createFileObjectFromPath(filepath.format());
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFiles(fileList: Array<File>): Promise<any> {
    let promiseArr = fileList.map(async file => {
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      let failItem:any = reurnObj.find((item: { code: number })=>item.code===-1);
      if (failItem) {
        throw {err:failItem.msg}
      }
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFileByClipboard(evt: ClipboardEvent): Promise<any> {
    let files = evt.clipboardData.files;
    let file = files[0];
    return this.promiseRequest(file);
  }
}