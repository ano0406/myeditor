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

//作成日(古→新)
function createdOrder(a:FileLinkSortkey,b:FileLinkSortkey){
    return a.created.getTime()-b.created.getTime();
}

//作成日(新→古)
function revCreatedOrder(a:FileLinkSortkey,b:FileLinkSortkey){
    return -createdOrder(a,b);
}

//更新日(古→新)
function updatedOrder(a:FileLinkSortkey,b:FileLinkSortkey){
    return a.updated.getTime()-b.updated.getTime();
}

//更新日(新→古)
function revUpdatedOrder(a:FileLinkSortkey,b:FileLinkSortkey){
    return -updatedOrder(a,b);
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
            <li @click="onclick(createdOrder)">作成日時順(古→新)</li>
            <li @click="onclick(revCreatedOrder)">作成日時順(新→古)</li>
            <li @click="onclick(updatedOrder)">更新日時順(古→新)</li>
            <li @click="onclick(revUpdatedOrder)">更新日時順(新→古)</li>
      </ul>
    </div>
</template>
