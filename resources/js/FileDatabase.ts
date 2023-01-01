import CreatedFileData from "./CreatedFile";
import FileData from "./FileData";
import NormalFileData from "./NormalFileData";
import { getCookie,setCookie,removeCookie } from 'typescript-cookie';

//ファイルのデータの管理、サーバーとのやり取りを担う
export default class FileDatabase{
//public:
    //ファイルを同期中か否か(Edit.vueで参照し同期中の表示を出す)
    private _is_syncing = false;
    public get is_syncing(){
        return this._is_syncing;
    }
    //ファイルの同期中にエラーが発生したか否か(Edit.vueで参照しエラー画面を出す)
    private _error_occured = false;
    public get error_occured(){
        return this._error_occured;
    }
    //Cookieに保存されていた未同期の内容
    private _cookied_datas = new Array<CookiedFileData>();
    public get cookied_datas(){
        return this._cookied_datas as ReadonlyArray<CookiedFileData>;
    }
    constructor(){
    }
    //Edit.vue読み込み時の遅延初期化
    public onMounted(csrf_token:string){
        this.csrf_token = csrf_token;
        this.fetchAllandBlock();
    }
    public getFileText(id:number):string|undefined{
        return this.files.get(id)?.text;
    }
    public getFileName(id:number):string|undefined{
        return this.files.get(id)?.name;
    }
    public getFileTags(id:number):ReadonlyArray<string>|undefined{
        return this.files.get(id)?.tags;
    }
    public getFileLinksDatas(){
        const arr = new Array<FileLinkData>();
        for(const file of this.files.values()){
            const data = file.getFileLinksData();
            if(data !== undefined){
                arr.push(data);
            }
        }
        return arr;
    }
    public onTextareaChange(edited_file:number,text:string){
        const file = this.files.get(edited_file);
        if(file !== undefined){
            file.onChange(text);
        }
    }
    //ファイル名がクリックされ選択されたときに呼び出す
    public onFileSelect(id:number){
        if(this.files.has(id)){
            const file = this.files.get(id) as FileData;
            const fileret = file.onSelect();
            if(fileret !== undefined){
                this._is_syncing = true;
                fileret
                .then(() => {
                    this._is_syncing = false;
                });
            }
        }
    }
    //タグを削除する時呼び出す
    public onTagDelete(id:number,tag:string){
        const file = this.files.get(id);
        if(file !== undefined){
            file.deleteTag(tag);
        }
    }
    public onTagAdd(id:number,tag:string){
        const file = this.files.get(id);
        if(file !== undefined){
            file.addTag(tag);
        }
    }
    //ファイルの名前を変更する
    //重複するファイル名があり変更できないならば変更せずfalseを返す それ以外の場合trueを返す
    public changeFileName(id:number,name:string){
        if(!this.files.has(id)){
            return true;
        }
        const file = this.files.get(id) as FileData;
        if(file.name === name){
            return true;
        }
        if(this.used_filenames.has(name)){
            return false;
        }
        this.used_filenames.delete(file.name);
        file.onRename(name);
        this.used_filenames.add(name);
        return true;
    }
    public deleteFile(id:number){
        if(!this.files.has(id)){
            return;
        }
        const file = this.files.get(id) as FileData;
        const newfile = file.onDelete();
        if(newfile === undefined){
            this.files.delete(id);
        }else{
            this.files.set(id,newfile);
        }
        this.used_filenames.delete(file.name);
    }
    //受け取った名前で新しいファイルを作成する
    //名前が重複するため作成できない場合はfalseを返し何もしない それ以外の場合trueを返しファイルを作成する
    public createFile(name:string){
        if(this.used_filenames.has(name)){
            return false;
        }
        this.files.set(this.unused_fileid,new CreatedFileData(this.unused_fileid,name,this.getIOInterface()));
        this.unused_fileid--;
        return true;
    }
    //ファイル全体の同期を行う
    public synchronize():Promise<void>{
        const fileid_arr = new Array<number>();
        const promise_arr = new Array<Promise<undefined|FileData>>();
        for(const file of this.files.values()){
            const fileret = file.onSync();
            if(fileret !== undefined){
                fileid_arr.push(file.id);
                promise_arr.push(fileret);
            }
        }
        this._is_syncing = true;
        return Promise.all(promise_arr)
        .then(arr => {
            for(let i = 0;i < arr.length;i++){
                this.files.delete(fileid_arr[i]);
                if(arr[i] !== undefined){
                    const f = arr[i] as FileData;
                     this.files.set(f.id,f);
                }
            }
            this._cookied_datas.splice(0);
            this._is_syncing = false;
        });
    }
//private:
    private files = new Map<number,FileData>();
    //リネーム時にファイル名被りを避ける
    private used_filenames = new Set<string>();
    //作成したファイルに対して割り当てる、未使用のファイルid
    private unused_fileid = -1;
    private csrf_token:string = '';
    //今cookieにデータを保存しているファイルidの集合
    private cookieing_files = new Set<number>();
    //ユーザー操作をブロックし、サーバーからファイルを取り出し、client_filesをセットする
    private fetchAllandBlock(){
        this._is_syncing = true;
        this.sendAjaxGet<Array<{id:number,name:string,tags:Array<string>,created:string,updated:string}>>('/rest')
        .then(res => {
            for(const {id,name,tags,created,updated} of res){
                this.files.set(id,new NormalFileData(id,name,undefined,tags,new Date(created),new Date(updated),this.getIOInterface()));
                this.used_filenames.add(name);
            }
            const cookied_ids_org = getCookie('cookieing_files');
            if(cookied_ids_org !== undefined){
                const cookied_ids = cookied_ids_org.split(',').map(v => Number(v));
                for(const id of cookied_ids){
                    const data_org = getCookie(id.toString()) as string;
                    this._cookied_datas.push(JSON.parse(data_org));
                    removeCookie(id.toString());
                }
                removeCookie('cookieing_files');
            }
            this._is_syncing = false;
        });
    }
    //「指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るresolveを実行する」というPromiseを返す
    //全promiseが完了するまで、ユーザー入力はブロックされる
    private sendAjaxGet<ResponseData>(url:string){
        return new Promise<ResponseData>((resolve) => {
            $.ajax({
                headers:{
                    'X-CSRF-TOKEN':this.csrf_token,
                },
                url,
                type:'get',
                timeout:3000,
            }).done((res:ResponseData) => {
                resolve(res);
            }).fail((res) => {
                this._error_occured = true;
                console.log(res.responseText);
            });
        });
    }
    //「指定urlにRequestData型のデータを付与したリクエストを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する」というpromiseを返す
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    private sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData){
        return new Promise<ResponseData>((resolve) => {
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
                resolve(res);
            }).fail((data) => {
                this._error_occured = true;
                console.log(data.responseText);
            });
        });
    }
    //このidをキーとして、CookieにCookiedFileDataを保存
    private saveCookie(id:number,data:CookiedFileData){
        if(!this.cookieing_files.has(id)){
            this.cookieing_files.add(id);
            setCookie('cookieing_files',Array.from(this.cookieing_files).toString(),{expires:7});
        }
        //深く考えていないが保存期間は7日
        setCookie(id.toString(),JSON.stringify(data),{expires:7});
    }
    //このidをキーとしてCookieに保存していた情報を削除　
    private removeCookie(id:number){
        if(this.cookieing_files.has(id)){
            removeCookie(id.toString());
            this.cookieing_files.delete(id);
            if(this.cookieing_files.size > 0){
                setCookie('cookieing_files',Array.from(this.cookieing_files).toString(),{expires:7});
            }else{
                removeCookie('cookieing_files');
            }
        }
    }
    //FileDataクラスのインスタンスを作成する際、この関数でIOInterfaceオブジェクトを作成する
    //obj={sendAjaxGet:this.sendAjaxGet,sendAjaxData:this.sendAjaxData,...}をFileDataに渡すと、FileDataでobjの関数を呼び出した際、関数定義のthisがobjと解釈される
    private getIOInterface(){
        return{
            sendAjaxGet:<ResponseData>(url:string) => this.sendAjaxGet.call<FileDatabase,[string],Promise<ResponseData>>(this,url),
            sendAjaxData:<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData) => this.sendAjaxData.call<FileDatabase,[string,string,RequestData],Promise<ResponseData>>(this,url,reqtype,reqdata),
            saveCookie:(id:number,data:CookiedFileData) => this.saveCookie.call(this,id,data),
            removeCookie:(id:number) => this.removeCookie.call(this,id),
        }
    }
}
