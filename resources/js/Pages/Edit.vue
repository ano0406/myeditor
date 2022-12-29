<script setup lang="ts">
import { Head } from '@inertiajs/inertia-vue3';
import MyeditorLayout from '@/Layouts/MyeditorLayout.vue';
import { computed, reactive, ref, onMounted, onUnmounted } from 'vue';
import { Link } from '@inertiajs/inertia-vue3';
import FileLinksListVue from '../Components/FileLinksList.vue';
import ContextMenuVue from '../Components/ContextMenu.vue';
import FileDatabase from '../FileDatabase';
import route from 'ziggy-js';
import { setCookie,getCookie } from 'typescript-cookie';


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

//このタブが編集権を得た日時
let tab_accessgrant_time:number;
//別タブで編集ページが開かれているか否か
const tab_block = ref<boolean>(false);
//CookieをチェックするsetIntervalのid
let cookie_check_intervalid:number;

const textareaAvailable = computed(() => {
    return (editing_fileid.value !== undefined || showing_cookie.value !== undefined);
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

const currentfile_tags = computed(() => {
    let ret:ReadonlyArray<string> = [];
    if(editing_fileid.value !== undefined){
        ret = filedatabase.getFileTags(editing_fileid.value) as ReadonlyArray<string>;
    }else if(showing_cookie.value !== undefined){
        ret = showing_cookie.value.tags as string[];
    }
    return ret;
});

onMounted(() => {
    filedatabase.onMounted($('meta[name="csrf-token"]').attr('content') as string);
    tab_accessgrant_time = new Date().getTime();
    setCookie('last-open',tab_accessgrant_time);
    //TODO:browserオブジェクトをapp.jsから渡そうとしたが、そもそもapp.jsでbrowserがundefinedになっていた(app.jsから値を渡すこと自体はできた)
    //vue-cookies-reactiveなどのpluginを用いてreactiveとしてcookieを見ようとしたが、そもそもpluginが導入できなかった
    cookie_check_intervalid = setInterval(() => {
        const lastopen_str = getCookie('last-open') as string;
        const lastopen = Number(lastopen_str);
        if(lastopen > tab_accessgrant_time){
            tab_block.value = true;
            clearInterval(cookie_check_intervalid);
        }
    },250);
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

const tagrightclick_handler = (tag:string,clientx:number,clienty:number) => {
    if(editing_fileid.value !== undefined){
        changeContextMenu([
            {
                name:'タグ削除',
                action:() => {
                    onTagDelete(tag);
                },
            },
        ],clientx,clienty);
    }
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

function onTagDelete(tag:string){
    changeContextMenu();
    filedatabase.onTagDelete(editing_fileid.value as number,tag);
}

function onTagAdd(){
    if(editing_fileid.value !== undefined){
        let newtag = prompt('新しく追加するタグを入力してください');
        if(newtag !== null){
            filedatabase.onTagAdd(editing_fileid.value as number,newtag);
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
    <div id="editblock" v-if="filedatabase.is_syncing || filedatabase.error_occured || tab_block">
        <p v-if="filedatabase.error_occured" class="position-absolute top-50 start-50 translate-middle">エラーが発生しました<br/>再読み込みを行なってください</p>
        <p v-if="filedatabase.is_syncing && !filedatabase.error_occured" class="position-absolute top-50 start-50 translate-middle">同期中...</p>
        <p v-if="tab_block" class="position-absolute top-50 start-50 translate-middle">別のタブで編集ページが開かれています<br/>編集を再開するにはページをリロードしてください</p>
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
            <div id="editarea" class="col-9 float-end" style="height:100%" v-show="textareaAvailable">
                <div id="tagsdisplay" class="container">
                    <template v-for="tag of currentfile_tags">
                        <button type="button" class="btn btn-outline-secondary m-2" @contextmenu.stop.prevent="(e:MouseEvent) => tagrightclick_handler(tag,e.clientX,e.clientY)">{{tag}}</button>
                    </template>
                    <button type="button" class="btn btn-outline-secondary m-2" @click="onTagAdd">+タグを追加</button>
                </div>
                <textarea id="edittextarea" @change="edittextarea_change" :value="textarea_text"></textarea>
            </div>
        </template>
    </MyeditorLayout>
</template>

<style>
#editblock{
    position: absolute;
    width: 100vw;
    height: 100vh;
    background-color: rgba(128, 128, 128, 0.5);
}

#editarea{
    display:flex;
    flex-direction:column;
    height:100%;
}

#tagsdisplay{
    width:100%;
}

#edittextarea{
    width:100%;
    flex-grow:1;
}
</style>
