<script setup lang="ts">
import { Head } from '@inertiajs/inertia-vue3';
import MyeditorLayout from '@/Layouts/MyeditorLayout.vue';
import { computed, reactive, ref, onMounted, DefineComponent, toRef } from 'vue';
import { Link } from '@inertiajs/inertia-vue3';
import FileLinksListVue from '../Components/FileLinksList.vue';
import ContextMenuVue from '../Components/ContextMenu.vue';
import FileManager from '../FileManager';

//TODO:lang="ts"を指定してhrefにroute('~~')を指定すると、メソッドが存在しないとエラーを吐かれる
//->@types/ziggy.jsをnpm includeしたら動くようにはなったけどvscodeはエラーを収めてくれない

const filemanager = reactive(new FileManager());
const contextmenu_props = reactive<ContextMenuProps>({
    items:[],
    clientx:0,
    clienty:0,
});
const current_filetext = computed(() => filemanager.getCurrentFile().text);
const textareaDisable = computed(() => filemanager.getCurrentFile().textareaDisable());

onMounted(() => {
    filemanager.setCSRFToken($('meta[name="csrf-token"]').attr('content') as string);
    filemanager.fetchAllandBlock();
});

const edittextarea_input = (e:Event) => {
    if(e.target instanceof HTMLTextAreaElement){
        filemanager.getCurrentFile().text = e.target.value;
    }
};

const bodyclick_handler = () => {
    changeContextMenu();
};

//TODO:イベントハンドラにchangeCurrentFileToを直渡しすると、filemanager.fetchedがundefinedになっていると怒られる
//ラムダで包んで渡すと怒られない thisが悪さをしている?
const fileclick_handler = (id:number) => {
    filemanager.changeCurrentFileTo(id);
};

const filerightclick_handler = (id:number,clientx:number,clienty:number) => {
    changeContextMenu([
        {
            name:'ファイル名変更',
            action:() => {
                changeFileName(id);
            }
        },
        {
            name:'ファイル削除',
            action:() => {
                deleteFile(id);
            }
        },
    ],clientx,clienty);
};

const listrightclick_handler = (clientx:number,clienty:number) => {
    changeContextMenu([
        {
            name:'新規作成',
            action:createNewFile,
        },
        {
            name:'同期',
            action:synchronize,
        },
    ],clientx,clienty);
};

//表示するコンテキストメニューを変更する 無引数ならばコンテキストメニューを消す
function changeContextMenu(items:Array<{name:string,action:()=>void}> = [],x:number = 0,y:number = 0){
    contextmenu_props.items = items;
    contextmenu_props.clientx = x;
    contextmenu_props.clienty = y;
}

function changeFileName(id:number){
    changeContextMenu();
    filemanager.onChangeFileName(id);
}

function deleteFile(id:number){
    changeContextMenu();
    filemanager.onDeleteFile(id);
}

function createNewFile(){
    changeContextMenu();
    filemanager.onCreateFile();
}

function synchronize(){
    changeContextMenu();
    filemanager.synchronize();
}
</script>

<template>
    <Head title="編集"/>
    <div id="syncoverlayer" v-if="filemanager.is_syncing || filemanager.error_occured">
        <p v-if="filemanager.error_occured" class="position-absolute top-50 start-50 translate-middle">エラーが発生しました<br/>再読み込みを行なってください</p>
        <p v-if="filemanager.is_syncing" class="position-absolute top-50 start-50 translate-middle">同期中...</p>
    </div>
    <ContextMenuVue :items="contextmenu_props.items" :clientx="contextmenu_props.clientx" :clienty="contextmenu_props.clienty"/>
    <MyeditorLayout @both-click="bodyclick_handler">
        <template v-slot:headinner>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><a :href="route('profile.edit')">プロフィール編集</a></button>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><Link :href="route('logout')" method="post" as="button">ログアウト</Link></button>
        </template>
        <template v-slot:default >
        <FileLinksListVue :files="filemanager.files" :current_id="filemanager.current_fileid"
            @file-click="fileclick_handler"
            @file-right-click="filerightclick_handler"
            @right-click="listrightclick_handler"/>
            <div class="col-9 float-end" style="background-color:blue;height:100%">
                <textarea id="edittextarea" :disabled="textareaDisable" @input="edittextarea_input" :value="current_filetext"></textarea>
            </div>
        </template>
    </MyeditorLayout>
</template>

<style>
#syncoverlayer{
    position: absolute;
    width: 100vh;
    height: 100vh;
    background-color: rgba(128, 128, 128, 0.5);
}
#edittextarea{
    width:100%;
    height:100%;
}
</style>
