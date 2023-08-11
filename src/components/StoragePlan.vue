<script setup>
import { computed } from "vue";
import dayjs from "dayjs";

const props = defineProps(["plan", "paymentInfo"]);

const hasPaidPlan = computed(
  () => !!props.paymentInfo && !!props.plan && props.plan.timeRemaining > 0,
);

const spaceAvailable = computed(
  () => hasPaidPlan.value && props.paymentInfo.spaceAvailable,
);
const spaceUsed = computed(
  () => hasPaidPlan.value && props.paymentInfo.spaceUsed,
);

const spacePercentage = computed(() => {
  return (
    hasPaidPlan.value &&
    parseFloat(((spaceUsed.value / spaceAvailable.value) * 100).toFixed(1))
  );
});

const spaceWidth = computed(() => {
  return (300 * spacePercentage.value) / 100;
});
</script>

<template>
  <div>
    <div v-if="hasPaidPlan" class="flex justify-between">
      <div class="w-[300px]">
        <div class="border-[1px] border-white">
          <div
            :style="{
              width: spaceWidth + 'px',
            }"
            class="h-4 bg-red-500"
          ></div>
        </div>
        <div class="flex justify-start">
          <span class="text-xs">
            <span class="text-red-500">{{ $formats.fileSize(spaceUsed) }}</span>
            of {{ $formats.fileSize(spaceAvailable) }} used
          </span>
        </div>
      </div>
      <div class="text-xs">
        <span class="text-gray-500">Expires in</span> <br />
        {{ $formats.dateTime(paymentInfo.end, "DD MMM YYYY") }}
      </div>
      <button class="text-xs" @click="$emit('buy')">Buy storage</button>
    </div>

    <button v-else class="text-xs" @click="$emit('buy')">Buy storage</button>
  </div>
</template>
