<template>
  <div>
    <div class="flex justify-between">
      <div class="text-left">
        <div>
          {{ file.name }}
          <!-- <a
            data-tooltip="Tooltip help here!"
            href="#"
            @click.prevent="$emit('copy', `${walletAddress}/${filePath}`)"
          >
            {{ file.name }}</a
          > -->
        </div>
        <div class="text-xs text-gray-500">{{ fileSizeInMB }} MB</div>
      </div>
      <div class="flex space-x-2">
        <button class="h-fit text-xs" @click="$emit('download', file)">
          Download
        </button>
        <button class="h-fit text-xs" @click="showShareForm = !showShareForm">
          ...
        </button>
      </div>
    </div>
    <div v-if="showShareForm" class="flex justify-between text-left">
      <input v-model="walletAddressToShare" placeholder="jkl..." type="text" />
      <span class="flex space-x-2">
        <button
          class="h-fit text-xs"
          @click="
            $emit('share', {
              file,
              walletAddressToShare,
            })
          "
        >
          Share
        </button>
        <button
          class="h-fit text-xs"
          @click.prevent="$emit('copy', `${walletAddress}/${filePath}`)"
        >
          Copy file path
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from "vue";

const props = defineProps(["file"]);

const walletAddress = inject("walletAddress");
const secretHandler = inject("secretHandler");
const parentFolder = inject("parentFolder");

const filePath = ref(null);
const shareTracker = ref(null);
async function getFileDetails() {
  filePath.value = await parentFolder.value.getMyChildPath(props.file.name);
  shareTracker.value = await secretHandler.value.readSharing(
    walletAddress.value,
    filePath.value,
  );
}

onMounted(() => {
  getFileDetails();
});

const fileSizeInMB = computed(() =>
  (parseFloat(props.file.size) / 1_000_000).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  }),
);

const showShareForm = ref(false);
const walletAddressToShare = ref("");
</script>
