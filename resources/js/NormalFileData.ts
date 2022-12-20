import DeletedFile from "./DeletedFile";
import FileData from "./FileData";
import FileDatabase from "./FileDatabase";

//サーバーに既に存在し、ローカルでもリネームと内容編集のみが行われたファイル
export default class NormalFileData extends FileData{
    private _text:string|undefined = undefined;
    public get text(){
        return (this._text !== undefined?this._text:'');
    }
    public set text(t:string){
        this.edited = true;
        this._text = t;
    }
    private edited = false;
    private renamed = false;;
    constructor(id:number,name:string,text:string|undefined,filemanager:FileDatabase){
        super(id,name,filemanager);
        this._text = text;
    }
    public get name(){
        return this._name;
    }
    public set name(newname:string){
        this.renamed = true;
        this._name = newname;
    }
    public textareaDisable(){
        return false;
    }
    public fileLinkDisplayName(){
        return (this.edited?'*':'')+this._name+(this.renamed?' (名前変更済み)':'');
    }
    public onSelect(){
        if(this._text === undefined){
            return this.filedatabase.sendAjaxGet<{name:string,text:string}>(`/rest/${this.id}`)
            .then(res => {
                this._text = res.text;
            });
        }else{
            return undefined;
        }
    }
    public onDelete(){
        return new DeletedFile(this.id,this.name,this.filedatabase);
    }
    public onSync(){
        if(this.edited || this.renamed){
            const data:{name?:string,text?:string} = {};
            if(this.edited){
                data.text = this.text;
            }
            if(this.renamed){
                data.name = this.name;
            }
            return this.filedatabase.sendAjaxData<{name?:string,text?:string},{success:boolean}>(`/rest/${this.id}`,'put',data)
            .then(_ => {
                this.edited = false;
                this.renamed = false;
                return this;
            });
        }else{
            return undefined;
        }
    }
}
