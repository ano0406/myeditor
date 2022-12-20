import FileData from "./FileData";
import FileDatabase from "./FileDatabase";
import NormalFileData from "./NormalFileData";

export default class CreatedFileData extends FileData{
    private _text = '';
    public get text(){
        return this._text;
    }
    public get name(){
        return this._name;
    }
   constructor(id:number,name:string,filedatabase:FileDatabase){
        super(id,name,filedatabase);
        filedatabase.saveCookie(id,{
            itemname:`作成:${name}`,
            openable:true,
            text:'',
        });
    }
    public textareaDisable(){
        return false;
    }
    public fileLinkDisplayName():string|undefined{
        return `+${this._name}`;
    }
    public onSelect(){
        return undefined;
    }
    public onChange(input:string){
        this._text = input;
        this.filedatabase.saveCookie(this.id,{
            itemname:`作成:${this.name}`,
            openable:true,
            text:this._text,
        });
    }
    public onRename(name: string){
        this._name = name;
        this.filedatabase.saveCookie(this.id,{
            itemname:`作成:${name}`,
            openable:true,
            text:'',
        });
    }
    public onDelete(){
        this.filedatabase.removeCookie(this.id);
        return undefined;
    }
    public onSync(){
        return this.filedatabase.sendAjaxData<{name:string,text:string},{success:boolean,id:number}>('/rest','post',{name:this._name,text:this.text})
            .then(res => {
                if(res.success){
                    this.filedatabase.removeCookie(this.id);
                    return new NormalFileData(res.id,this._name,this.text,this.filedatabase);
                }
            });

    }
}
