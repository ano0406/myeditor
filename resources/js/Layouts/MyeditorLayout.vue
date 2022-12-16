<script setup lang="ts">
import { ref,onMounted,computed } from 'vue';

const client_height = ref(0);
const header = ref();
const header_height = ref(0);

const getMainHeight = computed(() => ((client_height.value - header_height.value) * 100 / client_height.value) + 'vh');

onMounted(() => {
    const heightRefSetter = () =>{
        client_height.value = window.innerHeight;
        header_height.value = header.value.getBoundingClientRect().height;
    };
    heightRefSetter();
    window.onresize = () => {
        heightRefSetter();
    };
});

//TODO:Edit.vueのMyeditorLayoutに@click.native,@contextmenu.nativeを指定しても何故か上手くいかなかったのでとりあえず
const emit = defineEmits<{
    (event:'both-click'):void;
}>();

const bothclick_handler = () => {
    emit('both-click');
};

</script>

<template>
   <header ref="header" class="topband" @click="bothclick_handler" @contextmenu="bothclick_handler">
        <p class="display-6 p-2 fst-italic float-start">myeditor</p>
        <div class="m-3 float-end">
            <slot name="headinner"></slot>
        </div>
    </header>
    <main :style="{height:getMainHeight}" @click="bothclick_handler" @contextmenu="bothclick_handler">
        <slot></slot>
    </main>
</template>

<style>
.topband {
    background-color: rgb(235, 235, 235);
    width:100%;
}

.topband:after{
    content:"";
    clear:both;
    display:block;
}
</style>
