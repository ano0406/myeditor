<script setup lang="ts">

const props = defineProps<{
    data:FileLinkData;
    //このファイルを編集中か否か
    opening:boolean;
}>();

//ファイル名が左クリックされたら、親にfileclickイベントをemitし、fileidを渡す
//ファイル名が右クリックされたら、親にfilerightclickイベントをemitし、fileid、クリックした座標を渡す
const emit = defineEmits<{
    (event:'file-click',id:number):void;
    (event:'file-right-click',id:number,clientx:number,clienty:number):void;
}>();

const filerightclick_handler = (e:MouseEvent) => {
    emit('file-right-click',props.data.id,e.clientX,e.clientY);
};
</script>

<template>
    <li class="container fs-6" @click="() => emit('file-click',props.data.id)"
     @contextmenu.stop.prevent="filerightclick_handler"
     :style="{'color':(props.opening?'red':'black')}" :key="data.id">
     {{data.itemname}}
     </li>
</template>
