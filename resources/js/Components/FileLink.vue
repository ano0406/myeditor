<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    name:string;
    id:number;
    edited:boolean;
    opening:boolean;
}>();

const display_name = computed(() => (props.edited ? '*':'')+props.name);

//ファイル名が左クリックされたら、親にfileclickイベントをemitし、fileidを渡す
//ファイル名が右クリックされたら、親にfilerightclickイベントをemitし、fileid、クリックした座標を渡す
const emit = defineEmits<{
    (event:'file-click',id:number):void;
    (event:'file-right-click',id:number,clientx:number,clienty:number):void;
}>();

const filerightclick_handler = (e:MouseEvent) => {
    emit('file-right-click',props.id,e.clientX,e.clientY);
};
</script>

<template>
    <li class="container fs-6" @click="() => emit('file-click',props.id)"
     @contextmenu.stop.prevent="filerightclick_handler"
     :style="{'color':(props.opening?'red':'black')}" :key="display_name">
     {{display_name}}
     </li>
</template>
