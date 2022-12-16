<script setup lang="ts">
import { computed } from 'vue';
import FileLinkVue from './FileLink.vue';

const props = defineProps<{
    client_files:{
        fetched:Map<number,FetchedFileData>;
        unfetched:Map<number,{
            name:string;
            renamed:boolean;
        }>;
        created:Map<number,CreatedFileData>;
        deleted:Set<number>;
    };
    current_id:number|undefined;
}>();

//ファイル名が左クリックされたら、親にfile-clickイベントをemitし、fileidを渡す
//ファイル名が右クリックされたら、親にfile-right-clickイベントをemitし、fileid、クリックした座標を渡す
//それ以外の部分が右クリックされたら、親にright-clickイベントをemitし、クリック座標を渡す
const emit = defineEmits<{
    (event:'file-click',id:number):void;
    (event:'file-right-click',id:number,clientx:number,clienty:number):void;
    (event:'right-click',clientx:number,clienty:number):void;
}>();

//FileLinkVueのための配列を作る
const createNameEditedArray = computed(() => {
    const arr:Array<{name:string,id:number,edited:boolean,opening:boolean}> = [];
    for(const [id,{name,edited}] of props.client_files.fetched.entries()){
        arr.push({name,id,edited,opening:(props.current_id === id)});
    }
    for(const [id,{name}] of props.client_files.unfetched.entries()){
        arr.push({name,id,edited:false,opening:(props.current_id === id)});
    }
    for(const [id,{name}] of props.client_files.created.entries()){
        arr.push({name,id,edited:true,opening:(props.current_id === id)});
    }
    //アルファベット順に並べる
    const comp = (a:{name:string},b:{name:string}) => {
        for(let i = 0;i < (a.name.length < b.name.length?a.name.length:b.name.length);i++){
            if(a.name.charCodeAt(i) !== b.name.charCodeAt(i)){
                return a.name.charCodeAt(i) - b.name.charCodeAt(i);
            }
        }
        return a.name.length - b.name.length;
    };
    arr.sort(comp);
    return arr;
});

const fileclick_handler = (id:number) => {
    emit('file-click',id);
};

const filerightclick_handler = (id:number,clientx:number,clienty:number) => {
    emit('file-right-click',id,clientx,clienty);
}

const rightclick_handler = (e:MouseEvent) => {
    emit('right-click',e.clientX,e.clientY);
};
</script>

<template>
    <div @contextmenu.stop.prevent="rightclick_handler" class="col-3 float-start" style="background-color: rgb(180, 180, 180); height:100%">
        <ul v-for="obj in createNameEditedArray">
            <FileLinkVue v-bind="obj" @file-click="fileclick_handler" @file-right-click="filerightclick_handler"/>
        </ul>
     </div>
</template>ß
