import FetchedFileData from "./FetchedFileData";
import FileData from "./FileData";
import FileDatabase from "./FileDatabase";
import NormalFileData from "./NormalFileData";

export default class CreatedFileData extends FileData{
    private _text = '';
    public get text(){
        return this._text;
    }
    public set text(newtext:string){
        this._text = newtext;
    }
    public get name(){
        return this._name;
    }
    public set name(newname:string){
        this._name = newname;
    }
   constructor(id:number,name:string,filedatabase:FileDatabase){
        super(id,name,filedatabase);
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
    public onDelete(){
        return undefined;
    }
    public onSync(){
        return this.filedatabase.sendAjaxData<{name:string,text:string},{success:boolean,id:number}>('/rest','post',{name:this._name,text:this.text})
            .then(res => {
                if(res.success){
                    return new NormalFileData(res.id,this._name,this.text,this.filedatabase);
                }
            });

    }
}
