<script setup lang="ts">
import { Head } from '@inertiajs/inertia-vue3';
import MyeditorLayout from '@/Layouts/MyeditorLayout.vue';
import { computed, reactive, ref, onMounted, DefineComponent } from 'vue';
import { Link } from '@inertiajs/inertia-vue3';
import FileLinksListVue from '../Components/FileLinksList.vue';
import ContextMenuVue from '../Components/ContextMenu.vue';

//TODO:lang="ts"を指定してhrefにroute('~~')を指定すると、メソッドが存在しないとエラーを吐かれる
//->@types/ziggy.jsをnpm includeしたら動くようにはなったけどvscodeはエラーを収めてくれない

const client_files:{
    fetched:Map<number,FetchedFileData>;
    unfetched:Map<number,{
        name:string;
        //一度でも名前変更が行われたか否か
        renamed:boolean;
    }>;
    created:Map<number,CreatedFileData>;
    deleted:Set<number>;
} = reactive({
    fetched:new Map(),
    unfetched:new Map(),
    created:new Map(),
    deleted:new Set(),
});
//現在開いているファイルをオブジェクト(client_filesからの参照)で保存する
//開いているファイルを変えた時オブジェクトの再代入で対応したいので、refとして宣言
//何も開いていない(起動時初期状態)、選択されたファイルをサーバーからfetch中ならば、idをundefinedにする
const current_file = ref<{
    name:string;
    text:string;
    edited?:boolean;
    id:number;
}|undefined>(undefined);
//リネーム時にファイル名被りを避ける
const used_filenames = new Set<string>();
const syncing_filenum = ref(0);
const contextmenu_props = reactive<ContextMenuProps>({
    items:[],
    clientx:0,
    clienty:0,
});

//作成したファイルに対して割り当てる、未使用のファイルid
let unused_fileid = -1;

//ユーザー操作をブロックし、サーバーからファイルを取り出し、client_filesをセットする
const fetchall_block = () => {
    sendAjaxGet('/rest',(res:Array<{id:number,name:string}>) => {
        for(const {id,name} of res){
            client_files.unfetched.set(id,{name,renamed:false});
            if(unused_fileid <= id){
                unused_fileid = id + 1;
            }
            used_filenames.add(name);
        }
    });
};

onMounted(() => {
    fetchall_block();
});

const filelink_handler = (id:number) => {
    if(client_files.fetched.has(id)){
        current_file.value = client_files.fetched.get(id) as FetchedFileData;
    }else if(client_files.created.has(id)){
        current_file.value = client_files.created.get(id) as CreatedFileData;
    }else if(client_files.unfetched.has(id)){
        current_file.value = undefined;
        sendAjaxGet<{name:string,text:string}>(`/rest/${id}`,({name,text}) => {
            client_files.unfetched.delete(id);
            const obj = {
                id,
                name,
                text,
                edited:false,
                renamed:false,
            };
            client_files.fetched.set(id,obj);
            current_file.value = obj;
        });
    }
};

const edittextarea_input = (e:Event) => {
    if(current_file.value !== undefined && e.target instanceof HTMLTextAreaElement){
        current_file.value.text = e.target.value;
        current_file.value.edited = true;
    }
};

const bodyclick_handler = () => {
    changeContextMenu();
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
            action:syncronise,
        },
    ],clientx,clienty);
};

//指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
//完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
function sendAjaxGet<ResponseData>(url:string,callback:(res:ResponseData) => void){
    syncing_filenum.value++;
    $.ajax({
        headers:{
            'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content'),
        },
        url,
        type:'get',
        timeout:3000,
    }).done((res:ResponseData) => {
        callback(res);
        syncing_filenum.value--;
    }).fail((res) => {
        //TODO:alertでエラーメッセージを出すと、セッションが切れた時alertを無限に出されて面倒
        //alert('サーバーからのデータ取得に失敗しました　再読み込みしてください');
    });
}

//指定urlにRequestData型のデータを付与したリクエストを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
//完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
function sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData,callback:(res:ResponseData) => void){
    syncing_filenum.value++;
    $.ajax({
        headers:{
            'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content'),
            'Content-Type':'application/json',
        },
        url,
        type:reqtype,
        dataType:'json',
        data:JSON.stringify(reqdata),
        timeout:3000,
    }).done((res:ResponseData) => {
        callback(res);
        syncing_filenum.value--;
    }).fail((data) => {
        console.log(data);
        console.log(JSON.parse(data.responseText));
    });

}

//表示するコンテキストメニューを変更する 無引数ならばコンテキストメニューを消す
function changeContextMenu(items:Array<{name:string,action:()=>void}> = [],x:number = 0,y:number = 0){
    contextmenu_props.items = items;
    contextmenu_props.clientx = x;
    contextmenu_props.clienty = y;
}

function changeFileName(id:number){
    changeContextMenu();
    let obj:{name:string,renamed?:boolean}|undefined = client_files.fetched.get(id);
    if(obj === undefined){
        obj = client_files.unfetched.get(id);
    }
    if(obj === undefined){
        obj = client_files.created.get(id);
    }
    if(obj === undefined){
        return;
    }
    let filename = prompt('新しいファイル名を入力してください。');
    while(filename !== null){
        if(obj.name === filename){
            return;
        }else if(used_filenames.has(filename)){
            filename = prompt('ファイル名が重複しています。別のファイル名を入力してください。');
        }else{
            break;
        }
    }
    if(filename === null){
        return;
    }
    used_filenames.delete(obj.name);
    obj.name = filename;
    used_filenames.add(filename);
    obj.renamed = true;
}

function deleteFile(id:number){
    changeContextMenu();
    //ファイル名を表示し確認するために一度検索
    let obj:{name:string}|undefined = client_files.fetched.get(id);
    if(obj === undefined){
        obj = client_files.unfetched.get(id);
    }
    if(obj === undefined){
        obj = client_files.created.get(id);
    }
    if(obj === undefined){
        return;
    }
    const conf = confirm(`本当にファイル「${obj.name}」を削除しますか?`);
    if(!conf){
        return;
    }
    if(current_file.value?.id === id){
        current_file.value = undefined;
    }
    used_filenames.delete(obj.name);
    if(client_files.fetched.delete(id)){
        client_files.deleted.add(id);
    }
    if(client_files.unfetched.delete(id)){
        client_files.deleted.add(id);
    }
    client_files.created.delete(id);
}

function createNewFile(){
    changeContextMenu();
    const filename = prompt('新しく作成するファイルの名前を入力してください。');
    if(filename !== null){
        client_files.created.set(unused_fileid,{
            id:unused_fileid,
            name:filename,
            text:'',
        });
        current_file.value = client_files.created.get(unused_fileid) as CreatedFileData;
        unused_fileid++;
    }
}

function syncronise(){
    for(const id of client_files.deleted){
        sendAjaxData<{},{success:boolean}>(`/rest/${id}`,'delete',{},(res) => {if(res.success)client_files.deleted.delete(id);});
    }
    const unf_itr = client_files.unfetched.keys();
    while(true){
        const key = unf_itr.next();
        if(key.done){
            break;
        }
        const file = client_files.unfetched.get(key.value);
        if(file !== undefined && file.renamed){
            sendAjaxData<{name:string},{success:boolean}>(`/rest/${key}`,'put',{name:file.name},(res)=>{if(res.success)file.renamed=false;});
        }
    }
    const fet_itr = client_files.fetched.keys();
    while(true){
        const key = fet_itr.next();
        if(key.done){
            break;
        }
        const file = client_files.fetched.get(key.value);
        if(file !== undefined && (file.edited || file.renamed)){
            const data:{name?:string,text?:string} = {};
            if(file.edited){
                data.text = file.text;
            }
            if(file.renamed){
                data.name = file.name;
            }
            sendAjaxData<{name?:string,text?:string},{success:boolean}>(`/rest/${key.value}`,'put',data,(res)=>{if(res.success){file.edited=false;file.renamed=false;}});
        }
    }
    const cre_itr = client_files.created.keys();
    while(true){
        const key = cre_itr.next();
        if(key.done){
            break;
        }
        const file = client_files.created.get(key.value);
        if(file !== undefined){
            sendAjaxData<{name:string,text:string},{success:boolean,id:number}>('/rest','post',file,(res)=>{
                if(res.success){
                    client_files.created.delete(file.id);
                    const newfile = {
                        id:res.id,
                        name:file.name,
                        text:file.text,
                        edited:false,
                        renamed:false,
                    };
                    client_files.fetched.set(res.id,newfile);
                    if(current_file.value?.id === file.id){
                        current_file.value = newfile;
                    }
                    if(unused_fileid <= res.id){
                        unused_fileid = res.id;
                    }
                }
            });
        }
    }
}
</script>

<template>
    <Head title="編集"/>
    <div id="syncoverlayer" v-if="syncing_filenum>0">
        <p class="position-absolute top-50 start-50 translate-middle">同期中...</p>
    </div>
    <ContextMenuVue :items="contextmenu_props.items" :clientx="contextmenu_props.clientx" :clienty="contextmenu_props.clienty"/>
    <MyeditorLayout @both-click="bodyclick_handler">
        <template v-slot:headinner>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><a :href="route('profile.edit')">プロフィール編集</a></button>
            <button type="button" class="btn btn-sm btn-outline-primary m-1"><Link :href="route('logout')" method="post" as="button">ログアウト</Link></button>
        </template>
        <template v-slot:default>
            <FileLinksListVue :client_files="client_files" :current_id="current_file?.id"
            @file-click="filelink_handler"
            @file-right-click="filerightclick_handler"
            @right-click="listrightclick_handler"/>
            <div class="col-9 float-end" style="background-color:blue;height:100%">
                <textarea id="edittextarea" @input="edittextarea_input" :disabled="current_file===undefined" :value="current_file?.text"></textarea>
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
