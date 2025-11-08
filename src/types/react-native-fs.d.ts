/**
 * Type definitions for react-native-fs
 * File system access for React Native
 */

declare module 'react-native-fs' {
  export interface StatResult {
    path: string;
    ctime: Date;
    mtime: Date;
    size: number;
    mode: number;
    originalFilepath: string;
    isFile(): boolean;
    isDirectory(): boolean;
  }

  export interface ReadDirItem {
    ctime: Date | null;
    mtime: Date | null;
    name: string;
    path: string;
    size: number;
    isFile(): boolean;
    isDirectory(): boolean;
  }

  export interface DownloadFileOptions {
    fromUrl: string;
    toFile: string;
    headers?: { [key: string]: string };
    background?: boolean;
    discretionary?: boolean;
    cacheable?: boolean;
    progressDivider?: number;
    begin?: (res: DownloadBeginCallbackResult) => void;
    progress?: (res: DownloadProgressCallbackResult) => void;
    resumable?: () => void;
    connectionTimeout?: number;
    readTimeout?: number;
    backgroundTimeout?: number;
  }

  export interface DownloadBeginCallbackResult {
    jobId: number;
    statusCode: number;
    contentLength: number;
    headers: { [key: string]: string };
  }

  export interface DownloadProgressCallbackResult {
    jobId: number;
    contentLength: number;
    bytesWritten: number;
  }

  export interface DownloadResult {
    jobId: number;
    statusCode: number;
    bytesWritten: number;
  }

  export interface UploadFileOptions {
    toUrl: string;
    files: UploadFileItem[];
    headers?: { [key: string]: string };
    fields?: { [key: string]: string };
    method?: string;
    begin?: (res: UploadBeginCallbackResult) => void;
    progress?: (res: UploadProgressCallbackResult) => void;
  }

  export interface UploadFileItem {
    name: string;
    filename: string;
    filepath: string;
    filetype: string;
  }

  export interface UploadBeginCallbackResult {
    jobId: number;
  }

  export interface UploadProgressCallbackResult {
    jobId: number;
    totalBytesExpectedToSend: number;
    totalBytesSent: number;
  }

  export interface UploadResult {
    jobId: number;
    statusCode: number;
    headers: { [key: string]: string };
    body: string;
  }

  export const MainBundlePath: string;
  export const CachesDirectoryPath: string;
  export const DocumentDirectoryPath: string;
  export const TemporaryDirectoryPath: string;
  export const LibraryDirectoryPath: string;
  export const ExternalDirectoryPath: string;
  export const ExternalStorageDirectoryPath: string;
  export const DownloadDirectoryPath: string;

  export function mkdir(filepath: string, options?: { NSURLIsExcludedFromBackupKey?: boolean }): Promise<void>;
  export function moveFile(filepath: string, destPath: string): Promise<void>;
  export function copyFile(filepath: string, destPath: string): Promise<void>;
  export function pathForBundle(bundleNamed: string): Promise<string>;
  export function pathForGroup(groupIdentifier: string): Promise<string>;
  export function getFSInfo(): Promise<{ totalSpace: number; freeSpace: number }>;
  export function unlink(filepath: string): Promise<void>;
  export function exists(filepath: string): Promise<boolean>;
  export function stopDownload(jobId: number): void;
  export function stopUpload(jobId: number): void;
  export function completeHandlerIOS(jobId: number): void;
  export function readDir(dirpath: string): Promise<ReadDirItem[]>;
  export function readDirAssets(dirpath: string): Promise<ReadDirItem[]>;
  export function stat(filepath: string): Promise<StatResult>;
  export function readFile(filepath: string, encoding?: string): Promise<string>;
  export function read(filepath: string, length?: number, position?: number, encodingOrOptions?: string): Promise<string>;
  export function readFileAssets(filepath: string, encoding?: string): Promise<string>;
  export function hash(filepath: string, algorithm: string): Promise<string>;
  export function copyFileAssets(filepath: string, destPath: string): Promise<void>;
  export function copyFileAssetsIOS(imageUri: string, destPath: string): Promise<void>;
  export function copyAssetsFileIOS(imageUri: string, destPath: string, width: number, height: number, scale?: number, compression?: number, resizeMode?: string): Promise<string>;
  export function copyAssetsVideoIOS(videoUri: string, destPath: string): Promise<string>;
  export function writeFile(filepath: string, contents: string, encoding?: string): Promise<void>;
  export function appendFile(filepath: string, contents: string, encoding?: string): Promise<void>;
  export function write(filepath: string, contents: string, position?: number, encoding?: string): Promise<void>;
  export function downloadFile(options: DownloadFileOptions): { jobId: number; promise: Promise<DownloadResult> };
  export function uploadFiles(options: UploadFileOptions): { jobId: number; promise: Promise<UploadResult> };
  export function touch(filepath: string, mtime?: Date, ctime?: Date): Promise<void>;

  const RNFS: {
    MainBundlePath: string;
    CachesDirectoryPath: string;
    DocumentDirectoryPath: string;
    TemporaryDirectoryPath: string;
    LibraryDirectoryPath: string;
    ExternalDirectoryPath: string;
    ExternalStorageDirectoryPath: string;
    DownloadDirectoryPath: string;
    mkdir: typeof mkdir;
    moveFile: typeof moveFile;
    copyFile: typeof copyFile;
    pathForBundle: typeof pathForBundle;
    pathForGroup: typeof pathForGroup;
    getFSInfo: typeof getFSInfo;
    unlink: typeof unlink;
    exists: typeof exists;
    stopDownload: typeof stopDownload;
    stopUpload: typeof stopUpload;
    completeHandlerIOS: typeof completeHandlerIOS;
    readDir: typeof readDir;
    readDirAssets: typeof readDirAssets;
    stat: typeof stat;
    readFile: typeof readFile;
    read: typeof read;
    readFileAssets: typeof readFileAssets;
    hash: typeof hash;
    copyFileAssets: typeof copyFileAssets;
    copyFileAssetsIOS: typeof copyFileAssetsIOS;
    copyAssetsFileIOS: typeof copyAssetsFileIOS;
    copyAssetsVideoIOS: typeof copyAssetsVideoIOS;
    writeFile: typeof writeFile;
    appendFile: typeof appendFile;
    write: typeof write;
    downloadFile: typeof downloadFile;
    uploadFiles: typeof uploadFiles;
    touch: typeof touch;
  };

  export default RNFS;
}
