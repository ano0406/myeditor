export default class FileData{
    public readonly id:number;
    //ファイルが選択されたとき、このsetter/getterを介してtextareaに表示する
    public get text():string{
        return '';
    }
    protected _name:string;
    public get name(){
        return this._name;
    }
    protected _tags:Array<string>;
    public get tags(){
        return this._tags as ReadonlyArray<string>;
    }
    protected io:IOInterface;
    constructor(id:number,name:string,tags:Array<string>,io:IOInterface){
        this.id = id;
        this._name = name;
        this._tags = tags;
        this.io = io;
    }
    public getFileLinksData():FileLinkData|undefined{
        const itemname = this.fileLinkDisplayName();
        if(itemname !== undefined){
            return{
                id:this.id,
                itemname,
                tags:this.tags,
                key:{
                    name:this.name,
                }
            }
        }else{
            return undefined;
        }
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
    //このファイルを開いている際、textareaのonChangeイベントが発生したら呼び出される
    public onChange(input:string){
    }
    public onRename(name:string){
        this._name = name;
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
    public addTag(_:string){
    }
    public deleteTag(_:string){
    }
}
