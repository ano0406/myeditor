import FetchedFileData from "./FetchedFileData";
import FileData from "./FileData";
import FileManager from "./FileManager";

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
   constructor(id:number,name:string,filemanager:FileManager){
        super(id,name,filemanager);
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
    public onDelete(): void {
        this.filemanager.deleteFileData(this.id);
    }
    public onSync(){
        return this.filemanager.sendAjaxData<{name:string,text:string},{success:boolean,id:number}>(
            '/rest','post',{name:this._name,text:this._text},(res)=>{
            if(res.success){
                this.filemanager.changeFileData(res.id,new FetchedFileData(res.id,this._name,this._text,this.filemanager));
                if(this.filemanager.current_fileid === this.id){
                    this.filemanager.current_fileid = res.id;
                }
                this.filemanager.deleteFileData(this.id);
            }
        });

    }
}
