import FileDatabase from "./FileDatabase";

export default class FileData{
    public readonly id:number;
    //ファイルが選択されたとき、このsetter/getterを介してtextareaに表示・変更する
    public get text():string{
        return '';
    }
    public set text(_:string){
    }
    protected _name:string;
    public get name(){
        return this._name;
    }
    public set name(_:string){
    }
    protected filedatabase:FileDatabase;
    constructor(id:number,name:string,filedatabase:FileDatabase){
        this.id = id;
        this._name = name;
        this.filedatabase = filedatabase;
    }
    //このファイルを開いているとき、textareaを編集不可にするか
    public textareaDisable(){
        return true;
    }
    //FileLinkでの表示名を返す 表示しないならばundefinedを返す
    public fileLinkDisplayName():string|undefined{
        return undefined;
    }
    //このファイル名がクリックされた場合の処理
    //非同期処理を行いたい場合、それを行うPromiseを返す
    //非同期処理を行わない場合、undefinedを返す
    public onSelect():undefined|Promise<void>{
        return undefined;
    }
    //このファイルが削除されるときの処理
    //filedatabase.files[id]の値には、この関数の返り値がセットされる undefinedならば削除
    public onDelete():FileData|undefined{
        return this;
    }
    //このファイルを同期する
    //非同期処理を行いたい場合、それを行い新しいFileDataを返すPromiseを返す Promiseから返されたFileDataがfiledatabase.files[id]にセットされる
    //非同期処理を行わない場合、undefinedを返す
    public onSync():undefined|Promise<FileData|undefined>{
        return undefined;
    }
}
