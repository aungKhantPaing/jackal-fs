<template>
  <div>
    <span>{{ file.name }}</span>
    <button @click="$emit('download', file)">Download</button>
  </div>
</template>

<script setup>
const props = defineProps(["file"]);
</script>
