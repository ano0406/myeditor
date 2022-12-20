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
        super(id,name,io);
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
        return this.io.sendAjaxData<{name:string,text:string},{success:boolean,id:number}>('/rest','post',{name:this._name,text:this.text})
            .then(res => {
                if(res.success){
                    this.io.removeCookie(this.id);
                    return new NormalFileData(res.id,this._name,this.text,this.io);
                }
            });
    }
    private updateCookie(){
        this.io.saveCookie(this.id,{
            itemname:`作成:${this.name}`,
            openable:true,
            text:'',
        });
    }
}
