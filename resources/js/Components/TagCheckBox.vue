<script setup lang="ts">
import { onMounted,onUnmounted } from 'vue';

const props = defineProps<{
    name:string,
}>();

const emit = defineEmits<{
    (event:'checked',name:string):void;
    (event:'unchecked',name:string):void;
}>();

let checked = true;

onMounted(() => {
    emit('checked',props.name);
});

onUnmounted(() => {
    emit('unchecked',props.name);
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
        <input class="form-check-input" type="checkbox" @change="onChange" checked="true" :id="'checkbox_'+name" :key="'checkbox_'+name">
        <label class="form-check-label" :for="'checkbox_'+name">
            {{ name }}
        </label>
    </div>
</template>
