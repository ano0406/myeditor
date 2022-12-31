<script setup lang="ts">
const emit = defineEmits<{
    //このイベントを介して、FileLinkをソートする際のファンクタを渡す
    (event:'listSortChange',functor:(a:FileLinkSortkey,b:FileLinkSortkey) => number):void;
}>();

function onclick(functor:(a:FileLinkSortkey,b:FileLinkSortkey) => number){
    emit('listSortChange',functor);
}

function dictOrderFunctor(a:FileLinkSortkey,b:FileLinkSortkey){
    return dictOrder(a.name,b.name);
}

function revDictOrderFunctor(a:FileLinkSortkey,b:FileLinkSortkey){
    return -dictOrder(a.name,b.name);
}

//aとbを辞書順比較(sortのファンクタに指定)
function dictOrder(a:string,b:string){
    for(let i = 0;i < (a.length < b.length?a.length:b.length);i++){
            if(a.charCodeAt(i) !== b.charCodeAt(i)){
                return a.charCodeAt(i) - b.charCodeAt(i);
            }
        }
        return a.length - b.length;
};
</script>

<template>
    <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" type="button" id="linklistSortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            ソート
        </button>
        <ul class="dropdown-menu" aria-labelledby="linklistSortDropdown">
            <li @click="onclick(dictOrderFunctor)">名前順(a→z)</li>
            <li @click="onclick(revDictOrderFunctor)">名前順(z→a)</li>
        </ul>
    </div>
</template>
