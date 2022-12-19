import CreatedFileData from "./CreatedFile";
import FileData from "./FileData";
import UnfetchedFileData from "./UnfetchedFileData";

//ローカルのファイルの管理、サーバーとのやり取りを担う
export default class FileManager{
    //id:-1は選択しているファイルがないときの番兵
    public files = new Map<number,FileData>().set(-1,new FileData(-1,'',this));
    public current_fileid = -1;
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
    public getCurrentFile(){
        return this.files.get(this.current_fileid) as FileData;
    };
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
        this.sendAjaxGet('/rest',(res:Array<{id:number,name:string}>) => {
            for(const {id,name} of res){
                this.files.set(id,new UnfetchedFileData(id,name,this));
                this.used_filenames.add(name);
            }
        })
        .catch((errdata) => {
            this._error_occured = true;
            console.log(errdata);
        })
        .finally(() => {
            this._is_syncing = false;
        });
    }
    public changeFileData(id:number,newfile:FileData){
        this.files.set(id,newfile);
    }
    public deleteFileData(id:number){
        this.files.delete(id);
    }
    public changeCurrentFileTo(id:number){
        if(this.files.has(id)){
            const file = this.files.get(id) as FileData;
            const fileret = file.onSelect();
            if(fileret !== undefined){
                this.current_fileid = -1;
                this._is_syncing = true;
                fileret
                .then(() => {
                    this.current_fileid = id;
                })
                .catch((errdata) => {
                    this._error_occured = true;
                    console.log(errdata);
                })
                .finally(() => {
                    this._is_syncing = false;
                });
            }else{
                this.current_fileid = id;
            }
        }
    }
    public onChangeFileName(id:number){
        if(!this.files.has(id)){
            return;
        }
        const file = this.files.get(id) as FileData;
        let filename = prompt('新しいファイル名を入力してください。');
        while(filename !== null){
            if(file.name === filename){
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
        this.used_filenames.delete(file.name);
        file.name = filename;
        this.used_filenames.add(filename);
    }
    public onDeleteFile(id:number){
        //ファイル名を表示し確認するために一度検索
        if(!this.files.has(id)){
            return;
        }
        const file = this.files.get(id) as FileData;
        const conf = confirm(`本当にファイル「${file.name}」を削除しますか?`);
        if(!conf){
            return;
        }
        if(this.current_fileid === id){
            this.current_fileid = -1;
        }
        file.onDelete();
        this.used_filenames.delete(file.name);
    }
    public onCreateFile(){
        let filename = prompt('新しく作成するファイルの名前を入力してください。');
        while(filename !== null){
            if(this.used_filenames.has(filename)){
                filename = prompt('ファイル名が重複しています。別のファイル名を入力してください。');
            }else{
                break;
            }
        }
        if(filename !== null){
            this.files.set(this.unused_fileid,new CreatedFileData(this.unused_fileid,filename,this));
            this.unused_fileid--;
        }
    }
    public synchronize(){
        const promise_arr = new Array<Promise<void>>();
        for(const file of this.files.values()){
            const fileret = file.onSync();
            if(fileret !== undefined){
                promise_arr.push(fileret);
            }
        }
        if(promise_arr.length > 0){
            this._is_syncing = true;
            Promise.all(promise_arr)
            .catch((errdata) => {
                this._error_occured = true;
                console.log(errdata);
            })
            .finally(() => {
                this._is_syncing = false;
            });
        }
    }

    //「指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する」というPromiseを返す
    //全promiseが完了するまで、ユーザー入力はブロックされる
    public sendAjaxGet<ResponseData>(url:string,callback:(res:ResponseData) => void){
        return new Promise<void>((resolve,rejected) => {
            $.ajax({
                headers:{
                    'X-CSRF-TOKEN':this.csrf_token,
                },
                url,
                type:'get',
                timeout:3000,
            }).done((res:ResponseData) => {
                callback(res);
                resolve();
            }).fail((res) => {
                rejected(res.responseText);
                //TODO:alertでエラーメッセージを出すと、セッションが切れた時alertを無限に出されて面倒
                //alert('サーバーからのデータ取得に失敗しました　再読み込みしてください');
            });
        });
    }
    //「指定urlにRequestData型のデータを付与したリクエストを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する」というpromiseを返す
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    public sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData,callback:(res:ResponseData) => void){
        return new Promise<void>((resolve,rejected) => {
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
                resolve();
            }).fail((data) => {
                rejected(data.responseText);
            });
        });
    }
}
