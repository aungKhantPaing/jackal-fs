<script setup>
import { computed, inject, provide, ref } from "vue";
import {
  WalletHandler,
  StorageHandler,
  FileIo,
  FileUploadHandler,
  SecretsHandler,
} from "jackal.js";
import j from "./jackal";
import FileItem from "./components/FileItem.vue";
import StoragePlan from "./components/StoragePlan.vue";

const loading = ref(false);

async function init() {
  try {
    await connectWallet();
    await initJackal();
    await getMyFiles();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const wallet = ref(null);
const walletAddress = computed(
  () => wallet.value?.properties.jackalAccount.address,
);
const hexWalletAddress = ref(null);
const pubKey = ref(null);
provide("walletAddress", walletAddress);
async function connectWallet() {
  loading.value = "Connecting wallet...";
  try {
    wallet.value = await WalletHandler.trackWallet(j.walletConfig, {});
    hexWalletAddress.value = await wallet.value.getHexJackalAddress();
    pubKey.value = await wallet.value.findPubKey(walletAddress.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const storage = ref(null);
const fileIo = ref(null);
const secretHandler = ref(null);
provide("secretHandler", secretHandler);
async function initJackal() {
  loading.value = "Initalizing Jackal...";
  try {
    storage.value = await StorageHandler.trackStorage(wallet.value);
    getStorageInfo(walletAddress.value);
    fileIo.value = await FileIo.trackIo(wallet.value);
    secretHandler.value = await SecretsHandler.trackSecrets(wallet.value);
    await createRootFolder();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const storagePaidPlan = ref(null);
const storagePaymentInfo = ref(null);
async function getStorageInfo(address) {
  storagePaidPlan.value = await storage.value.getPayData(address);
  storagePaymentInfo.value = await storage.value.getStoragePaymentInfo(address);
}

async function buyStorage(durationInMonth = 1, spaceInTb = 0.001) {
  // (Wallet address, duration in months (min 1),
  // space in terabytes (min .001)

  const buyResult = await storage.value.buyStorage(
    walletAddress.value,
    durationInMonth,
    spaceInTb,
  );
  console.log({ buyResult });
  return buyResult;
}

const sampleDir = "Home";
const listOfRootFolders = [sampleDir];
const PARENT_FOLDER_NAME = "s/" + sampleDir;
async function createRootFolder() {
  // you can create as many root folders as you would like this way. Home is the dashboard default root directory.

  // The first time a user connects, they must init the system
  // const msg = storage.value.makeStorageInitMsg();
  // await fileIo.value.generateInitialDirs(msg, listOfRootFolders);

  // after the first time, this code can be used instead. this will only create new root folders if they don't already exist
  const newFolderCount = await fileIo.value.verifyFoldersExist(
    listOfRootFolders,
  );
  console.log({ newFolderCount });
}

const filesToUpload = ref([]);
function onFileInputChange(e) {
  console.log("onFileInputChange", { files: e.target.files });
  filesToUpload.value = e.target.files;
}
async function onUpload() {
  const uploadResult = await uploadFile(filesToUpload.value[0]);
  console.log({ uploadResult });
  return uploadResult;
}
async function uploadFile(file) {
  const parentFolderPath = PARENT_FOLDER_NAME;
  const parent = await fileIo.value.downloadFolder(parentFolderPath);
  const handler = await FileUploadHandler.trackFile(file, parentFolderPath);

  const uploadList = {};
  const uploadable = await handler.getForUpload();
  uploadList[file.name] = {
    data: null,
    exists: false,
    handler: handler,
    key: file.name,
    uploadable,
  };
  debugger;
  const uploadResult = await fileIo.value
    .staggeredUploadFiles(uploadList, parent, {
      counter: 0,
      complete: 0,
    })
    .then(getMyFiles);
  console.log({ uploadResult });
  return uploadResult;
}

const myFiles = ref([]);
const root = ref(null);
provide("parentFolder", root);
async function getMyFiles() {
  loading.value = "Loading files...";
  try {
    const parentFolderPath = PARENT_FOLDER_NAME; // for example Dashboard's root folder path is s/Home
    root.value = await fileIo.value.downloadFolder(parentFolderPath);
    const childFiles = root.value.getChildFiles();
    myFiles.value = Object.values(childFiles);
    console.log({
      myFiles: myFiles.value,
      root: root.value,
    });
    // const pathOfFirstChild = parent.getMyChildPath(childrenFiles[0].name);
    // myFilePaths.value = childrenFiles.map((f) => parent.getMyChildPath(f.name));
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function onFileItemDownload(fileMetaData) {
  const rawPath = root.value.getMyChildPath(fileMetaData.name);
  downloadJacklFile({ owner: walletAddress.value, rawPath });
}

async function downloadJacklFile({ owner, rawPath }) {
  loading.value === "Downloading file...";
  try {
    const file = await getFileFromJackl({ owner, rawPath });
    downloadFile(file);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function getFileFromJackl({ owner, rawPath }) {
  const downloadDetails = {
    rawPath, // manual complete file path OR pathOfFirstChild
    owner, // JKL address of file owner
    isFolder: false,
  };
  const fileHanlder = await fileIo.value.downloadFile(downloadDetails, {
    track: 0,
  });

  const downloadedFile = fileHanlder.receiveBacon();
  console.log({ downloadedFile });
  return downloadedFile;
}

async function downloadFile(file) {
  const url = window.URL.createObjectURL(file);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  // the filename you want
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  // or you know, something with better UX...
}

async function shareJacklFile({ file, walletAddressToShare }) {
  loading.value = "Sharing...";
  try {
    const filePath = root.value.getMyChildPath(file.name);
    const currentSharings = await storage.value.readSharing(
      walletAddress,
      walletAddressToShare,
    );
    const updatedSharings = {
      ...currentSharings,
      files: (currentSharings.files || []).concat(filePath),
    };
    console.log({ currentSharings, updatedSharings });
    const savedSharings = await storage.value.saveSharing(
      walletAddressToShare,
      updatedSharings,
    );
    console.log({ savedSharings });
    return savedSharings;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function copyClipboard(data) {
  navigator.clipboard.writeText(data);
}

const sharedFilePath = ref(null);
async function downloadSharedFile() {
  const [owner, ...rawPaths] = String(sharedFilePath.value).split("/");
  const rawPath = rawPaths.join("/");
  console.log({ sharedFilePath: sharedFilePath.value, owner, rawPath });
  downloadJacklFile({ owner, rawPath });
  // const shareTracker = await secretHandler.value.readSharing(owner, rawPath);
  // console.log({ shareTracker });
}
</script>

<template>
  <dialog class="absolute top-0" :open="loading">
    <form method="dialog">
      {{ loading }}
    </form>
  </dialog>
  <div class="container w-[500px]">
    <div class="flex justify-center">
      <a href="https://jackalprotocol.com/" target="_blank">
        <img
          src="./assets/jackal.svg"
          class="h-32 p-6 transition duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
          alt="Vite logo"
        />
      </a>
      <!-- <a href="https://vuejs.org/" target="_blank">
      <img
        class="h-32 p-6 transition duration-300 hover:drop-shadow-[0_0_2em_#42b883aa]"
        src="./assets/vue.svg"
        alt="Vue logo"
      />
    </a> -->
    </div>

    <h1 class="mb-10 font-mono">jackal-fs</h1>

    <button v-if="!wallet" type="button" @click="init()">Connect Wallet</button>
    <div v-else class="space-y-4">
      <!-- <div v-if="hexWalletAddress">{{ hexWalletAddress }}</div>
    <div v-if="pubKey">{{ pubKey }}</div> -->
      <div>{{ walletAddress }}</div>
      <StoragePlan
        :plan="storagePaidPlan"
        :payment-info="storagePaymentInfo"
        @buy="buyStorage"
      ></StoragePlan>
      <hr class="my-2 opacity-10" />

      <div class="mt-[10px] flex justify-between">
        Upload
        <div>
          <input
            id="file_upload"
            name="file_upload"
            type="file"
            multiple
            class="text-xs"
            @change="onFileInputChange"
          />
          <button v-if="filesToUpload.length" class="text-xs" @click="onUpload">
            Upload
          </button>
        </div>
      </div>
      <hr class="my-2 opacity-10" />

      <div class="mt-[10px]">
        <div class="flex justify-between align-middle">
          Files
          <button class="text-xs" @click="getMyFiles">Refresh</button>
        </div>
        <hr class="my-2 opacity-10" />
        <div v-if="myFiles.length">
          <div v-for="(file, i) in myFiles" :key="i">
            <FileItem
              class="my-2"
              :file="file"
              @download="onFileItemDownload"
              @share="shareJacklFile"
              @copy="copyClipboard"
            />
            <hr class="my-2 opacity-10" />
          </div>
        </div>
        <div v-else>( Empty )</div>
        <div class="flex justify-between">
          <input
            v-model="sharedFilePath"
            type="text"
            placeholder="jkl.../s/Home/..."
          />
          <button @click="downloadSharedFile" class="text-xs">Download</button>
        </div>
      </div>
    </div>
  </div>

  <a id="download-link" style="display: none"></a>
  <!-- <HelloWorld msg="Vite + Vue" /> -->
</template>
