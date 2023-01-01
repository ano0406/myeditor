<script setup lang="ts">
import { onMounted,onUnmounted } from 'vue';

const props = defineProps<{
    name:string,
}>();

const emit = defineEmits<{
    (event:'checked',name:string):void;
    (event:'unchecked',name:string):void;
}>();

let checked = false;

onMounted(() => {
    emit('unchecked',props.name);
});

onUnmounted(() => {
    emit('checked',props.name);
});

function onChange(){
    if(checked){
        emit('unchecked',props.name);
    }else{
        emit('checked',props.name);
    }
    checked = !checked;
}
</script>

<template>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" @change="onChange" :id="'checkbox_'+name" :key="'checkbox_'+name">
        <label class="form-check-label" :for="'checkbox_'+name">
            {{ name }}
        </label>
    </div>
</template>
