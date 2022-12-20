<script setup lang="ts">

const props = defineProps<{
    data:CookiedFileData,
}>();

//ファイル名が左クリックされたら、親にcookie-clickイベントをemitし、データを渡す
const emit = defineEmits<{
    (event:'cookie-click',data:CookiedFileData):void;
}>();

</script>

<template>
    <li v-if="data.openable" class="container fs-6" @click="() => emit('cookie-click',data)" :key="data.itemname">
     {{data.itemname}}
     </li>
     <li v-if="!data.openable" class="container fs-6" style="color:gray">
     {{data.itemname}}
     </li>
</template>
