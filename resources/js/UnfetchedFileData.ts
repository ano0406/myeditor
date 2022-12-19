import DeletedFile from "./DeletedFile";
import FetchedFileData from "./FetchedFileData";
import FileData from "./FileData";
import FileManager from "./FileManager";

export default class UnfetchedFileData extends FileData{
    private renamed = false;
    constructor(id:number,name:string,filemanager:FileManager){
        super(id,name,filemanager);
    }
    public get name(){
        return this._name;
    }
    public set name(newname:string){
        this.renamed = true;
        this._name = newname;
    }
    public textareaDisable(){
        return true;
    }
    public fileLinkDisplayName(){
        return this._name;
    }
    public onSelect(){
        return this.filemanager.sendAjaxGet<{name:string,text:string}>(`/rest/${this.id}`,({name,text}) => {
            this.filemanager.changeFileData(this.id,new FetchedFileData(
                this.id,this.name,text,this.filemanager,this.renamed
            ));
        });
    }
    public onDelete(){
        this.filemanager.changeFileData(this.id,new DeletedFile(this.id,this._name,this.filemanager));
    }
    public onSync(){
        if(this.renamed){
            return this.filemanager.sendAjaxData<{name:string},{success:boolean}>(`/rest/${this.id}`,'put',{name:this._name},(res)=>{
                if(res.success){
                    this.renamed = false;
                }
            });
        }else{
            return undefined;
        }
    }
}
