<script setup>
import { computed, ref } from "vue";
import {
  WalletHandler,
  StorageHandler,
  FileIo,
  FileUploadHandler,
  SecretsHandler,
} from "jackal.js";
import j from "./jackal";

async function connectWallet() {
  await initJackal();
  await createRootFolder();
}

const wallet = ref(null);
const walletAddress = computed(() => wallet.value?.properties.jackalAccount.address);
const storage = ref(null);
const fileIo = ref(null);
async function initJackal() {
  wallet.value = await WalletHandler.trackWallet(j.walletConfig, {});
  console.log({ wallet: wallet.value });
  storage.value = await StorageHandler.trackStorage(wallet.value);
  console.log({ storage: storage.value });
  fileIo.value = await FileIo.trackIo(wallet.value);
  console.log({ fileIo: fileIo.value });
}

const listOfRootFolders = ["Home"];
const PARENT_FOLDER_NAME = "s/Home";
async function createRootFolder() {
  // you can create as many root folders as you would like this way. Home is the dashboard default root directory.

  // The first time a user connects, they must init the system
  // const msg = storage.value.makeStorageInitMsg();
  // await fileIo.value.generateInitialDirs(msg, listOfRootFolders);

  // after the first time, this code can be used instead. this will only create new root folders if they don't already exist
  const newFolderCount = await fileIo.value.verifyFoldersExist(listOfRootFolders);
  console.log({ newFolderCount });
}

const filesToUpload = ref([]);
function onFileInputChange(e) {
  console.log("onFileInputChange", { files: e.target.files });
  filesToUpload.value = e.target.files;
}
async function onUpload() {
  await uploadFile(filesToUpload[0]);
}
async function uploadFile(file) {
  const parentFolderPath = PARENT_FOLDER_NAME;
  const parent = await fileIo.value.downloadFolder(parentFolderPath);
  const handler = await FileUploadHandler.trackFile(file, parentFolderPath);

  const uploadList = {};
  uploadList[file.name] = {
    data: null,
    exists: false,
    handler: handler,
    key: file.name,
    uploadable: await handler.getForUpload(),
  };

  return fileIo.value.staggeredUploadFiles(uploadList, parent, {
    counter: 0,
    complete: 0,
  });
}

const myFiles = ref([]);
const myFilePaths = ref([]);
async function getMyFiles() {
  const parentFolderPath = PARENT_FOLDER_NAME; // for example Dashboard's root folder path is s/Home
  const parent = await fileIo.value.downloadFolder(parentFolderPath);
  myFiles.value = parent.getChildFiles();
  console.log({ myFiles: myFiles.value });
  // const pathOfFirstChild = parent.getMyChildPath(childrenFiles[0].name);
  // myFilePaths.value = childrenFiles.map((f) => parent.getMyChildPath(f.name));
}
async function downloadFile(filePath) {
  const downloadDetails = {
    rawPath: filePath, // manual complete file path OR pathOfFirstChild
    owner: walletAddress, // JKL address of file owner
    isFolder: false,
  };

  const fileHanlder = await fileIo.value.downloadFile(downloadDetails, { track: 0 });

  const file = fileHanlder.receiveBacon();
  console.log({ downloadedFile: file });
}
</script>

<template>
  <div>
    <a href="https://jackalprotocol.com/" target="_blank">
      <img src="./assets/jackal.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>

  <button v-if="!wallet" type="button" @click="connectWallet">Connect Wallet</button>
  <button v-else type="button">{{ walletAddress }}</button>

  <div v-if="wallet" style="margin-top: 10px">
    <input type="file" multiple @change="onFileInputChange" />
    <button v-if="filesToUpload.length" @click="onUpload">Upload</button>
  </div>

  <div v-if="wallet" style="margin-top: 10px">
    Files
    <button @click="getMyFiles">Refresh</button>
    <div v-if="myFilePaths.length">
      <div v-for="filePath in myFilePaths" :key="filePath">
        <span>{{ filePath }}</span>
        <button @click="downloadFile(filePath)">Download</button>
      </div>
    </div>
    <div v-else>( Empty )</div>
  </div>
  <!-- <HelloWorld msg="Vite + Vue" /> -->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
