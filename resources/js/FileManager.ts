import { ref, Ref, reactive, computed } from 'vue';

//ローカルのファイルの管理、サーバーとのやり取りを担う
export class FileManager{
    public fetched = reactive<Map<number,FetchedFileData>>(new Map());
    public unfetched = reactive<Map<number,{
        name:string;
        //一度でも名前変更が行われたか否か
        renamed:boolean;
    }>>(new Map());
    public created = reactive<Map<number,CreatedFileData>>(new Map());
    public deleted = reactive<Set<number>>(new Set());
    //TODO:外部でgetする必要のあるref/reactiveはどう公開すれば良い?
    public current_file = ref<{
        name:string;
        text:string;
        edited?:boolean;
        id:number;
    }|undefined>(undefined);
    //現在スタックされている非同期読み込みの数
    public _syncing_filenum = ref(0);
    //操作をブロックする必要があるか否かはこのcomputedメソッドで判断する
    //TODO:isFileSyncingがundefined扱いになっており、syncoverlayerの表示切り替えに使えない
    public isFileSyncing = computed(() => {
        if(this._syncing_filenum.value > 0){
            return true;
        }
        return false;
        return this._syncing_filenum.value > 0;
    });
    //リネーム時にファイル名被りを避ける
    private used_filenames = new Set<string>();
    //作成したファイルに対して割り当てる、未使用のファイルid
    private unused_fileid = -1;
    private csrf_token:string = '';
    constructor(){
    }
    //onMountedで設定する必要があるため
    public setCSRFToken(csrf_token:string){
        this.csrf_token = csrf_token;
    }
    //ユーザー操作をブロックし、サーバーからファイルを取り出し、client_filesをセットする
    public fetchAllandBlock(){
        this.sendAjaxGet('/rest',(res:Array<{id:number,name:string}>) => {
            for(const {id,name} of res){
                this.unfetched.set(id,{name,renamed:false});
                if(this.unused_fileid <= id){
                    this.unused_fileid = id + 1;
                }
                this.used_filenames.add(name);
            }
        });
    }
    public changeCurrentFileTo(id:number){
        console.log('a');
        console.log(this.fetched.size);
        if(this.fetched.has(id)){
            this.current_file.value = this.fetched.get(id) as FetchedFileData;
        }else if(this.created.has(id)){
            this.current_file.value = this.created.get(id) as CreatedFileData;
        }else if(this.unfetched.has(id)){
            this.current_file.value = undefined;
            this.sendAjaxGet<{name:string,text:string}>(`/rest/${id}`,({name,text}) => {
                this.unfetched.delete(id);
                const obj = {
                    id,
                    name,
                    text,
                    edited:false,
                    renamed:false,
                };
                this.fetched.set(id,obj);
                this.current_file.value = obj;
            });
        }
    }
    public onTextInput(text:string){
        if(this.current_file.value !== undefined){
            this.current_file.value.text = text;
            this.current_file.value.edited = true;
        }
    }
    public changeFileName(id:number){
        let obj:{name:string,renamed?:boolean}|undefined = this.fetched.get(id);
        if(obj === undefined){
            obj = this.unfetched.get(id);
        }
        if(obj === undefined){
            obj = this.created.get(id);
        }
        if(obj === undefined){
            return;
        }
        let filename = prompt('新しいファイル名を入力してください。');
        while(filename !== null){
            if(obj.name === filename){
                return;
            }else if(this.used_filenames.has(filename)){
                filename = prompt('ファイル名が重複しています。別のファイル名を入力してください。');
            }else{
                break;
            }
        }
        if(filename === null){
            return;
        }
        this.used_filenames.delete(obj.name);
        obj.name = filename;
        this.used_filenames.add(filename);
        obj.renamed = true;
    }
    public deleteFile(id:number){
        //ファイル名を表示し確認するために一度検索
        let obj:{name:string}|undefined = this.fetched.get(id);
        if(obj === undefined){
            obj = this.unfetched.get(id);
        }
        if(obj === undefined){
            obj = this.created.get(id);
        }
        if(obj === undefined){
            return;
        }
        const conf = confirm(`本当にファイル「${obj.name}」を削除しますか?`);
        if(!conf){
            return;
        }
        if(this.current_file.value?.id === id){
            this.current_file.value = undefined;
        }
        this.used_filenames.delete(obj.name);
        if(this.fetched.delete(id)){
            this.deleted.add(id);
        }
        if(this.unfetched.delete(id)){
            this.deleted.add(id);
        }
        this.created.delete(id);
    }
    public createNewFile(){
        const filename = prompt('新しく作成するファイルの名前を入力してください。');
        if(filename !== null){
            this.created.set(this.unused_fileid,{
                id:this.unused_fileid,
                name:filename,
                text:'',
            });
            this.current_file.value = this.created.get(this.unused_fileid) as CreatedFileData;
            this.unused_fileid++;
        }
    }
    public synchronize(){
        for(const id of this.deleted){
            this.sendAjaxData<{},{success:boolean}>(`/rest/${id}`,'delete',{},(res) => {if(res.success)this.deleted.delete(id);});
        }
        const unf_itr = this.unfetched.keys();
        while(true){
            const key = unf_itr.next();
            if(key.done){
                break;
            }
            const file = this.unfetched.get(key.value);
            if(file !== undefined && file.renamed){
                this.sendAjaxData<{name:string},{success:boolean}>(`/rest/${key.value}`,'put',{name:file.name},(res)=>{
                    if(res.success)file.renamed=false;
                });
            }
        }
        const fet_itr = this.fetched.keys();
        while(true){
            const key = fet_itr.next();
            if(key.done){
                break;
            }
            const file = this.fetched.get(key.value);
            if(file !== undefined && (file.edited || file.renamed)){
                const data:{name?:string,text?:string} = {};
                if(file.edited){
                    data.text = file.text;
                }
                if(file.renamed){
                    data.name = file.name;
                }
                this.sendAjaxData<{name?:string,text?:string},{success:boolean}>(`/rest/${key.value}`,'put',data,(res)=>{
                    if(res.success){
                        file.edited=false;file.renamed=false;
                    }
                });
            }
        }
        const cre_itr = this.created.keys();
        while(true){
            const key = cre_itr.next();
            if(key.done){
                break;
            }
            const file = this.created.get(key.value);
            if(file !== undefined){
                this.sendAjaxData<{name:string,text:string},{success:boolean,id:number}>('/rest','post',file,(res)=>{
                    if(res.success){
                        this.created.delete(file.id);
                        const newfile = {
                            id:res.id,
                            name:file.name,
                            text:file.text,
                            edited:false,
                            renamed:false,
                        };
                        this.fetched.set(res.id,newfile);
                        if(this.current_file.value?.id === file.id){
                            this.current_file.value = newfile;
                        }
                        if(this.unused_fileid <= res.id){
                            this.unused_fileid = res.id;
                        }
                    }
                });
            }
        }
        }

    //指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    private sendAjaxGet<ResponseData>(url:string,callback:(res:ResponseData) => void){
        this._syncing_filenum.value++;
        $.ajax({
            headers:{
                'X-CSRF-TOKEN':this.csrf_token,
            },
            url,
            type:'get',
            timeout:3000,
        }).done((res:ResponseData) => {
            callback(res);
            this._syncing_filenum.value--;
        }).fail((res) => {
            //TODO:alertでエラーメッセージを出すと、セッションが切れた時alertを無限に出されて面倒
            //alert('サーバーからのデータ取得に失敗しました　再読み込みしてください');
        });
    }
    //指定urlにRequestData型のデータを付与したリクエストを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    private sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData,callback:(res:ResponseData) => void){
        this._syncing_filenum.value++;
        $.ajax({
            headers:{
                'X-CSRF-TOKEN':this.csrf_token,
                'Content-Type':'application/json',
            },
            url,
            type:reqtype,
            dataType:'json',
            data:JSON.stringify(reqdata),
            timeout:3000,
        }).done((res:ResponseData) => {
            callback(res);
            this._syncing_filenum.value--;
        }).fail((data) => {
            console.log(data);
            console.log(JSON.parse(data.responseText));
        });
    }
}
