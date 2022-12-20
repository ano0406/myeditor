<script setup lang="ts">
import { Head } from '@inertiajs/inertia-vue3';
import MyeditorLayout from '@/Layouts/MyeditorLayout.vue';
import { computed, reactive, ref, onMounted } from 'vue';
import { Link } from '@inertiajs/inertia-vue3';
import FileLinksListVue from '../Components/FileLinksList.vue';
import ContextMenuVue from '../Components/ContextMenu.vue';
import FileDatabase from '../FileDatabase';
import route from 'ziggy-js';

const filedatabase = reactive(new FileDatabase());

const contextmenu_props = reactive<ContextMenuProps>({
    items:[],
    clientx:0,
    clienty:0,
});
//コンテキストメニューの項目と位置を変更する 無引数ならばコンテキストメニューを消す
function changeContextMenu(items:Array<{name:string,action:()=>void}> = [],x:number = 0,y:number = 0){
    contextmenu_props.items = items;
    contextmenu_props.clientx = x;
    contextmenu_props.clienty = y;
}

//編集中のファイル　ないならばundefined
const editing_fileid = ref<number|undefined>(undefined);

//表示中の、Cookieに保存されたデータ　ないならばundefined
const showing_cookie = ref<CookiedFileData|undefined>(undefined);

const textareaDisable = computed(() => {
    return (editing_fileid.value === undefined && showing_cookie.value === undefined);
});

const textarea_text = computed(() => {
    if(editing_fileid.value !== undefined){
        const text = filedatabase.getFileText(editing_fileid.value);
        if(text !== undefined){
            return text;
        }
    }
    if(showing_cookie.value !== undefined){
        return showing_cookie.value.text;
    }
    return '';
});

onMounted(() => {
    filedatabase.onMounted($('meta[name="csrf-token"]').attr('content') as string);
});

const edittextarea_change = (e:Event) => {
    if(editing_fileid.value !== undefined && e.target instanceof HTMLTextAreaElement){
        filedatabase.onTextareaChange(editing_fileid.value,e.target.value);
    }
};

const bodyclick_handler = () => {
    changeContextMenu();
};

const fileclick_handler = (id:number) => {
    filedatabase.onFileSelect(id);
    editing_fileid.value = id;
    showing_cookie.value = undefined;
};

const cookieclick_handler = (data:CookiedFileData) => {
    editing_fileid.value = undefined;
    showing_cookie.value = data;
};

const filerightclick_handler = (id:number,clientx:number,clienty:number) => {
    changeContextMenu([
        {
            name:'ファイル名変更',
            action:() => {
                onChangeFileName(id);
            }
        },
        {
            name:'ファイル削除',
            action:() => {
                onDeleteFile(id);
            }
        },
    ],clientx,clienty);
};

const listrightclick_handler = (clientx:number,clienty:number) => {
    changeContextMenu([
        {
            name:'新規作成',
            action:onCreateNewFile,
        },
        {
            name:'同期',
            action:synchronize,
        },
    ],clientx,clienty);
};

function onChangeFileName(id:number){
    changeContextMenu();
    let filename = prompt('新しいファイル名を入力してください。');
    while(filename !== null){
        if(filedatabase.changeFileName(id,filename)){
            break;
        }else{
            filename = prompt('ファイル名が重複しています。別のファイル名を入力してください。');
        }
    }
}

function onDeleteFile(id:number){
    changeContextMenu();
    const name = filedatabase.getFileName(id) as string;
    const conf = confirm(`本当にファイル「${name}」を削除しますか?`);
    if(!conf){
        return;
    }
    if(id === editing_fileid.value){
        editing_fileid.value = undefined;
    }
    filedatabase.deleteFile(id);
}

function onCreateNewFile(){
    changeContextMenu();
    let filename = prompt('新しく作成するファイルの名前を入力してください。');
    while(filename !== null){
        if(filedatabase.createFile(filename)){
            break;
        }else{
            filename = prompt('ファイル名が重複しています。別のファイル名を入力してください。');
        }
    }
}

function synchronize(){
    changeContextMenu();
    editing_fileid.value = undefined;
    //TODO:現在編集中のファイルidをsynchronizeに渡し、新しいidを返させる
    filedatabase.synchronize();
}

</script>

<template>
    <Head title="編集"/>
    <div id="syncoverlayer" v-if="filedatabase.is_syncing || filedatabase.error_occured">
        <p v-if="filedatabase.error_occured" class="position-absolute top-50 start-50 translate-middle">エラーが発生しました<br/>再読み込みを行なってください</p>
        <p v-if="filedatabase.is_syncing && !filedatabase.error_occured" class="position-absolute top-50 start-50 translate-middle">同期中...</p>
    </div>
    <ContextMenuVue :items="contextmenu_props.items" :clientx="contextmenu_props.clientx" :clienty="contextmenu_props.clienty"/>
    <MyeditorLayout @both-click="bodyclick_handler">
        <template v-slot:headinner>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><a :href="route('profile.edit')">プロフィール編集</a></button>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><Link :href="route('logout')" method="post" as="button">ログアウト</Link></button>
        </template>
        <template v-slot:default >
        <FileLinksListVue :files="filedatabase.getFileLinksDatas()" :current-id="editing_fileid" :cookied="filedatabase.cookied_datas"
            @file-click="fileclick_handler"
            @cookie-click="cookieclick_handler"
            @file-right-click="filerightclick_handler"
            @right-click="listrightclick_handler"/>
            <div class="col-9 float-end" style="background-color:blue;height:100%">
                <textarea id="edittextarea" :disabled="textareaDisable" @change="edittextarea_change" :value="textarea_text"></textarea>
            </div>
        </template>
    </MyeditorLayout>
</template>

<style>
#syncoverlayer{
    position: absolute;
    width: 100vw;
    height: 100vh;
    background-color: rgba(128, 128, 128, 0.5);
}
#edittextarea{
    width:100%;
    height:100%;
}
</style>
