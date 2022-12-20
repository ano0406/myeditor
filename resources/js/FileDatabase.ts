import CreatedFileData from "./CreatedFile";
import FileData from "./FileData";
import NormalFileData from "./NormalFileData";

//ファイルのデータの管理、サーバーとのやり取りを担う
export default class FileDatabase{
    //id:-1は選択しているファイルがないときの番兵
    public files = new Map<number,FileData>().set(-1,new FileData(-1,'',this));
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
    /*public getCurrentFile(){
        return this.files.get(this.current_fileid) as FileData;
    };*/
    //リネーム時にファイル名被りを避ける
    private used_filenames = new Set<string>();
    //作成したファイルに対して割り当てる、未使用のファイルid
    private unused_fileid = -2;
    private csrf_token:string = '';
    constructor(){
    }
    //onMountedで設定する必要があるため
    public setCSRFToken(csrf_token:string){
        this.csrf_token = csrf_token;
    }
    //ユーザー操作をブロックし、サーバーからファイルを取り出し、client_filesをセットする
    public fetchAllandBlock(){
        this._is_syncing = true;
        this.sendAjaxGet<Array<{id:number,name:string}>>('/rest')
        .then(res => {
            this._is_syncing = false;
            for(const {id,name} of res){
                this.files.set(id,new NormalFileData(id,name,undefined,this));
                this.used_filenames.add(name);
            }
        });
    }
    public getFileText(id:number):string|undefined{
        return this.files.get(id)?.text;
    }
    public getFileName(id:number):string|undefined{
        return this.files.get(id)?.name;
    }
    public onTextareaChange(id:number,text:string){
        const file = this.files.get(id);
        if(file !== undefined){
            file.text = text;
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
        file.name = name;
        this.used_filenames.add(name);
        return true;
    }
    public deleteFile(del:number){
        if(!this.files.has(del)){
            return;
        }
        const file = this.files.get(del) as FileData;
        const newfile = file.onDelete();
        if(newfile === undefined){
            this.files.delete(del);
        }else{
            this.files.set(del,newfile);
        }
        this.used_filenames.delete(file.name);
    }
    //受け取った名前で新しいファイルを作成する
    //名前が重複するため作成できない場合はfalseを返し何もしない それ以外の場合trueを返しファイルを作成する
    public createFile(name:string){
        if(this.used_filenames.has(name)){
            return false;
        }
        this.files.set(this.unused_fileid,new CreatedFileData(this.unused_fileid,name,this));
        this.unused_fileid--;
        return true;
    }
    public synchronize(){
        const fileid_arr = new Array<number>;
        const promise_arr = new Array<Promise<undefined|FileData>>();
        for(const file of this.files.values()){
            const fileret = file.onSync();
            if(fileret !== undefined){
                fileid_arr.push(file.id);
                promise_arr.push(fileret);
            }
        }
        if(promise_arr.length > 0){
            this._is_syncing = true;
            Promise.all(promise_arr)
            .then(arr => {
                for(let i = 0;i < arr.length;i++){
                    this.files.delete(fileid_arr[i]);
                    if(arr[i] !== undefined){
                        const f = arr[i] as FileData;
                        this.files.set(f.id,f);
                    }
                }
                this._is_syncing = false;
            })
        }
    }

    //「指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るresolveを実行する」というPromiseを返す
    //全promiseが完了するまで、ユーザー入力はブロックされる
    public sendAjaxGet<ResponseData>(url:string){
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
    public sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData){
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
}
