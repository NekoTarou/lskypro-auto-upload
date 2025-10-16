import { extname } from "path";
import { Readable } from "stream";

export interface IStringKeyMap<T> {
  [key: string]: T;
}

const IMAGE_EXT_LIST = [
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".gif",
  ".svg",
  ".tiff",
  ".webp",
  ".avif",
];

export function isAnImage(ext: string) {
  return IMAGE_EXT_LIST.includes(ext.toLowerCase());
}
export function isAssetTypeAnImage(path: string): boolean {
  return isAnImage(extname(path));
}

export async function streamToString(stream: Readable) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    const buf: Uint8Array = Buffer.isBuffer(chunk)
      ? (chunk as Uint8Array)
      : Buffer.from(typeof chunk === "string" ? chunk : String(chunk));
    chunks.push(buf);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

export function getUrlAsset(url: string) {
  return (url = url.substring(1 + url.lastIndexOf("/")).split("?")[0]).split(
    "#"
  )[0];
}

export function getLastImage(list: string[]) {
  const reversedList = list.reverse();
  let lastImage;
  reversedList.forEach(item => {
    if (item && item.startsWith("http")) {
      lastImage = item;
      return item;
    }
  });
  return lastImage;
}

interface AnyObj {
  [key: string]: any;
}

export function arrayToObject<T extends AnyObj>(
  arr: T[],
  key: string
): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  arr.forEach(element => {
    obj[element[key]] = element;
  });
  return obj;
}
