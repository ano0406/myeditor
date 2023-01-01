<script setup lang="ts">
import {ref,reactive,computed, watch} from 'vue';
import TagsAccordionVue from './TagsAccordion.vue';
import SortDropdownVue from './SortDropdown.vue';

const props = defineProps<{
    files:Array<FileLinkData>;
}>();

const alltags = reactive(new Set<string>);

//props.filesがそのままではファイル追加時反応してくれない
watch(() => [...props.files],(files,) => {
    alltags.clear();
    for(const file of files){
        for(const tag of file.tags){
            alltags.add(tag);
        }
    }
    setDisplayListsArray();
});

const emit = defineEmits<{
    //このイベントを介して、実際に表示するFileLinkDataの配列の受け渡しをする
    (event:'listsArrayChange',arr:Array<FileLinkData>):void;
}>();

const checkedTags = reactive<Set<string>>(new Set());

const linkSortFunctor = ref<((a:FileLinkSortkey,b:FileLinkSortkey) => number)>(() => 1);

//FileLinkVueはこの配列の順番で並べる
function setDisplayListsArray(){
    let files = props.files.filter((file) => {
        const tags = file.tags;
        let count = 0;
        for(const tag of tags){
            if(checkedTags.has(tag)){
                count++;
            }
        }
        return count === checkedTags.size;
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
