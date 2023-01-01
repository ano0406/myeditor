import FileData from "./FileData";
import NormalFileData from "./NormalFileData";

export default class CreatedFileData extends FileData{
    private _text = '';
    public get text(){
        return this._text;
    }
    public get name(){
        return this._name;
    }
    constructor(id:number,name:string,io:IOInterface){
        super(id,name,[],new Date(),new Date(),io);
        this.updateCookie();
    }
    public fileLinkDisplayName():string|undefined{
        return `+${this._name}`;
    }
    public onSelect(){
        return undefined;
    }
    public onChange(input:string){
        this._text = input;
        this.updateCookie();
    }
    public onRename(name: string){
        this._name = name;
        this.updateCookie();
    }
    public onDelete(){
        this.io.removeCookie(this.id);
        return undefined;
    }
    public onSync(){
        const tags:Array<string> = [];
        this._tags.forEach((tag) => {
            tags.push(tag);
        });
        const data = {
            name:this._name,
            text:this._text,
            tags,
        };
        return this.io.sendAjaxData<{name:string,text:string,tags:Array<string>},{id:number,created:string,updated:string}>('/rest','post',data)
            .then(res => {
                this.io.removeCookie(this.id);
                return new NormalFileData(res.id,this._name,this.text,tags,new Date(this.created),new Date(this.updated),this.io);
            });
    }
    private updateCookie(){
        this.io.saveCookie(this.id,{
            itemname:`作成:${this.name}`,
            openable:true,
            text:'',
            tags:this._tags,
        });
    }
    public addTag(tag:string){
        if(this._tags.find((t) => t===tag) === undefined){
            this._tags.push(tag);
        }
    }
    public deleteTag(tag:string){
        const ind = this._tags.findIndex((t) => t===tag);
        if(ind !== -1){
            this._tags.splice(ind,1);
        }
    }
}
