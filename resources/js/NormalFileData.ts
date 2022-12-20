import DeletedFile from "./DeletedFile";
import FileData from "./FileData";

//サーバーに既に存在し、ローカルでもリネームと内容編集のみが行われたファイル
export default class NormalFileData extends FileData{
    private _text:string|undefined = undefined;
    public get text(){
        return (this._text !== undefined?this._text:'');
    }
    private edited = false;
    private renamed = false;
    constructor(id:number,name:string,text:string|undefined,io:IOInterface){
        super(id,name,io);
        this._text = text;
    }
    public get name(){
        return this._name;
    }
    public fileLinkDisplayName(){
        return (this.edited?'*':'')+this._name+(this.renamed?' (名前変更済み)':'');
    }
    public onSelect(){
        if(this._text === undefined){
            return this.io.sendAjaxGet<{name:string,text:string}>(`/rest/${this.id}`)
            .then(res => {
                this._text = res.text;
            });
        }else{
            return undefined;
        }
    }
    public onChange(input:string){
        this.edited = true;
        this._text = input;
        this.updateCookie();
    }
    public onRename(name: string){
        this.renamed = true;
        this._name = name;
        this.updateCookie();
    }
    public onDelete(){
        return new DeletedFile(this.id,this.name,this.io);
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
            return this.io.sendAjaxData<{name?:string,text?:string},{success:boolean}>(`/rest/${this.id}`,'put',data)
            .then(_ => {
                this.edited = false;
                this.renamed = false;
                this.io.removeCookie(this.id);
                return this;
            });
        }else{
            return undefined;
        }
    }
    private updateCookie(){
        if(this.renamed && this.edited){
            this.io.saveCookie(this.id,{
                itemname:`改名と編集:${this.name}`,
                openable:true,
                text:this._text,
            });
        }else if(this.renamed && !this.edited){
            this.io.saveCookie(this.id,{
                itemname:`改名:${this.name}`,
                openable:false,
            });
        }else if(!this.renamed && this.edited){
            this.io.saveCookie(this.id,{
                itemname:`編集:${this.name}`,
                openable:true,
                text:this._text,
            });
        }
    }
}
