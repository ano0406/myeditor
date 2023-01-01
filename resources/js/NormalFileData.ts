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
    private tagaltered = false;
    constructor(id:number,name:string,text:string|undefined,tags:Array<string>,created:Date,updated:Date,io:IOInterface){
        super(id,name,tags,created,updated,io);
        this._text = text;
    }
    public get name(){
        return this._name;
    }
    public fileLinkDisplayName(){
        return (this.edited?'*':'')+this._name+(this.renamed||this.tagaltered?' ':'')+(this.renamed?'(名前変更済み)':'')+(this.tagaltered?'(タグ変更済み)':'');
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
        return new DeletedFile(this.id,this.name,this.created,this.updated,this.io);
    }
    public onSync(){
        if(this.edited || this.renamed || this.tagaltered){
            const data:{name?:string,text?:string,tags?:Array<string>} = {};
            if(this.edited){
                data.text = this.text;
            }
            if(this.renamed){
                data.name = this.name;
            }
            if(this.tagaltered){
                data.tags = [];
                this._tags.forEach((tag) => {
                    data.tags?.push(tag);
                });
            }
            return this.io.sendAjaxData<{name?:string,text?:string,tag?:Array<string>},{updated:string}>(`/rest/${this.id}`,'put',data)
            .then(({updated}) => {
                this.edited = false;
                this.renamed = false;
                this.tagaltered = false;
                this.updated = new Date(updated);
                this.io.removeCookie(this.id);
                return this;
            });
        }else{
            return undefined;
        }
    }
    private updateCookie(){
        let itemname = '';
        let openable = false;
        let text = '';
        let tags:Array<string> = [];
        if(this.edited){
            itemname += '編集';
        }
        if(this.renamed){
            if(itemname !== ''){
                itemname += '/';
            }
            itemname += '改名';
        }
        if(this.tagaltered){
            if(itemname !== ''){
                itemname += '/';
            }
            itemname += 'タグ変更';
        }
        itemname += `:${this._name}`;
        if(this.edited || this.tagaltered){
            openable = true;
            if(this._text !== undefined){
                text = this._text;
            }
            tags = this._tags;
        }
        if(!openable){
            this.io.saveCookie(this.id,{
                itemname,
                openable,
            });
        }else{
            this.io.saveCookie(this.id,{
                itemname,
                openable,
                text,
                tags,
            });
        }
    }
    public addTag(tag:string){
        if(this._tags.find((t) => t===tag) === undefined){
            this.tagaltered = true;
            this._tags.push(tag);
            this.updateCookie();
        }
    }
    public deleteTag(tag:string){
        const ind = this._tags.findIndex((t) => t===tag);
        if(ind !== -1){
            this.tagaltered = true;
            this._tags.splice(ind,1);
            this.updateCookie();
        }
    }
}
