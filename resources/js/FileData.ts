import FileManager from "./FileManager";

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
    protected filemanager:FileManager;
    constructor(id:number,name:string,filemanager:FileManager){
        this.id = id;
        this._name = name;
        this.filemanager = filemanager;
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
    //非同期処理を行いたい場合、それを行うPromiseを返す　特にajax通信を行いたい場合、filemanager.SendAjaxGet/SendAjaxDataに処理を指定し関数の返り値をそのまま返せば良い
    //非同期処理を行わない場合、undefinedを返す
    public onSelect():undefined|Promise<void>{
        return undefined;
    }
    //このファイルが削除されるときの処理
    public onDelete(){
    }
    //このファイルを同期する
    //非同期処理を行いたい場合、それを行うPromiseを返す　特にajax通信を行いたい場合、filemanager.SendAjaxGet/SendAjaxDataに処理を指定し関数の返り値をそのまま返せば良い
    //非同期処理を行わない場合、undefinedを返す
    public onSync():undefined|Promise<void>{
        return undefined;
    }
}
