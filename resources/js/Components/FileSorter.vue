<script setup lang="ts">
import {ref,reactive,computed} from 'vue';
import TagsAccordionVue from './TagsAccordion.vue';
import SortDropdownVue from './SortDropdown.vue';

const props = defineProps<{
    files:Array<FileLinkData>;
}>();

const emit = defineEmits<{
    //このイベントを介して、実際に表示するFileLinkDataの配列の受け渡しをする
    (event:'listsArrayChange',arr:Array<FileLinkData>):void;
}>();

const alltags = computed(() => {
    const tags:Set<string> = new Set();
    for(const file of props.files){
        for(const tag of file.tags){
            tags.add(tag);
        }
    }
    return tags;
});

const checkedTags = reactive<Set<string>>(new Set());

const linkSortFunctor = ref<((a:FileLinkSortkey,b:FileLinkSortkey) => number)>(() => 1);

//FileLinkVueはこの配列の順番で並べる
function setDisplayListsArray(){
    const files = props.files.filter((v) => {
        for(const tag of v.tags){
            if(checkedTags.has(tag)){
                return true;
            }
        }
        return false;
    });
    const f = linkSortFunctor.value;
    if(f !== undefined){
        files.sort((a,b) => f(a.key,b.key));
    }
    emit('listsArrayChange',files);
}

function onChecked(name:string){
    checkedTags.add(name);
    setDisplayListsArray();
}

function onUnchecked(name:string){
    checkedTags.delete(name);
    setDisplayListsArray();
}

function functorch(functor:(a:FileLinkSortkey,b:FileLinkSortkey) => number){
    linkSortFunctor.value = functor;
    setDisplayListsArray();
}

</script>

<template>
    <TagsAccordionVue :alltags="alltags" @checked="onChecked" @unchecked="onUnchecked"/>
    <SortDropdownVue @list-sort-change="functorch"/>
</template>
