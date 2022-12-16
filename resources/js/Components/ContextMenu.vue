<script setup lang="ts">
const props = defineProps<{
    items:Array<{
        name:string;
        action:() => void;
    }>;
    clientx:number;
    clienty:number;
}>();
</script>

<template>
    <ul class="border border-light rounded "
    :style="{'position':'absolute','top':props.clienty+'px','left':props.clientx+'px'}">
        <li v-for="item of items" @click="item.action" :key="item.name" class="container">{{item.name}}</li>
    </ul>
</template>
