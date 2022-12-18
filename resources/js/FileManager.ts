import CreatedFileData from "./CreatedFile";
import FileData from "./FileData";
import UnfetchedFileData from "./UnfetchedFileData";

//ローカルのファイルの管理、サーバーとのやり取りを担う
export default class FileManager{
    //id:-1は選択しているファイルがないときの番兵
    public files = new Map<number,FileData>().set(-1,new FileData(-1,'',this));
    public current_fileid = -1;
    //現在スタックされている非同期読み込みの数
    public _syncing_filenum = 0;
    //操作をブロックする必要があるか否かはこのcomputedメソッドで判断する
    //TODO:isFileSyncingがundefined扱いになっており、syncoverlayerの表示切り替えに使えない
    public isFileSyncing = () => {
        if(this._syncing_filenum > 0){
            return true;
        }
        return false;
        return this._syncing_filenum > 0;
    };
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
        this.sendAjaxGet('/rest',(res:Array<{id:number,name:string}>) => {
            for(const {id,name} of res){
                this.files.set(id,new UnfetchedFileData(id,name,this));
                this.used_filenames.add(name);
            }
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
            file.onSelect();
            this.current_fileid = id;
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
        for(const file of this.files.values()){
            file.onSync();
        }
    }

    //指定urlにgetを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    public sendAjaxGet<ResponseData>(url:string,callback:(res:ResponseData) => void){
        this._syncing_filenum++;
        $.ajax({
            headers:{
                'X-CSRF-TOKEN':this.csrf_token,
            },
            url,
            type:'get',
            timeout:3000,
        }).done((res:ResponseData) => {
            callback(res);
            this._syncing_filenum--;
        }).fail((res) => {
            //TODO:alertでエラーメッセージを出すと、セッションが切れた時alertを無限に出されて面倒
            //alert('サーバーからのデータ取得に失敗しました　再読み込みしてください');
        });
    }
    //指定urlにRequestData型のデータを付与したリクエストを送り、成功時ResponseData型のレスポンスを受け取るコールバックを実行する
    //完了までユーザー入力をブロックする(isSyncronisingをtrueにする)
    public sendAjaxData<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData,callback:(res:ResponseData) => void){
        this._syncing_filenum++;
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
            this._syncing_filenum--;
        }).fail((data) => {
            console.log(data);
            console.log(JSON.parse(data.responseText));
        });
    }
}
